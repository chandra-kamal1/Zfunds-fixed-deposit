const express 	= require("express");
var AWS     	= require("aws-sdk");
var dynamo  	= require('dynamodb');
var axios       = require("axios");
const dotenv 	= require('dotenv');
/****************************************************** */
/*******************************************************/
dotenv.config();
AWS.config.update({
	secretAccessKey: process.env.SECRET_KEY,
	accessKeyId: process.env.API_KEY,
	region: process.env.REGION
});
const s3 = new AWS.S3();
var s3Bucket = new AWS.S3({ params: { Bucket: process.env.S3_BUCKET_NAME, } });
/****************************************************************************8 */
var database 	= require("../models/");
var cartmodel 	= require("../models/cartmodel");
var ordermodel 	= require("../models/ordermodel");
const router 	= express.Router();
var DB 			= new AWS.DynamoDB.DocumentClient();
/******************************************************************** */
const {
	createclientsyaram
} = require("./siyaramapi");
const {
	savetranjuctiondetails,
	paymenturlgeneratefunction
} = require("./mahindraapi");
/***********************************************************************/
const getAllfd= async (req, res) => {
  var scanResults=[];
  var params = {
        "TableName": "zf_fds",
        "FilterExpression": '#cust_id=:cust_id and #status=:status and cart_type=:cart_type',
    };
  do {
    var fddata = await DB.scan(params).promise();
    fddata.Items.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey = fddata.LastEvaluatedKey;
  } while (typeof fddata.LastEvaluatedKey != "undefined");
  res.json({	status: "success",data:scanResults}); 
}
/*************************************************************************/

const getfdBySchemeCode= async (req, res) => {
    var scanResults=[];
    var params = {
        "TableName": "zf_fds",
        "KeyConditionExpression"		: "#scheme_code= :scheme_code",
		"ExpressionAttributeNames"		: {"#scheme_code": "scheme_code"},
		"ExpressionAttributeValues"		: {":scheme_code" : req.body.scheme_code}
    };
    var fddata = await DB.query(params).promise();
    fddata.Items.forEach((item) => scanResults.push(item));
    res.json({	status: "success",data:scanResults}); 
}
/*********************************************************************************/

/****************************** create cart for fd***************************************** */
const createcart= async (req, res) => {
  console.log('add to Cart request body ', req.body);
	/*************************************************** */
		// let params = {
		// 	"TableName": "carts",
		// 	"IndexName": "expertidIndex",
		// 	// "ProjectionExpression":"#status,arn,city,rating,mobile_no",
		// 	"KeyConditionExpression": "expert_id= :expert_id",
		// 	"FilterExpression": '#cust_id=:cust_id and #status=:status and cart_type=:cart_type',
		// 	"ExpressionAttributeNames": { "#cust_id": "cust_id", "#status": "status"},
		// 	"ExpressionAttributeValues": { ":expert_id": req.body.expert_id, ":cust_id": req.body.customer_details.user_id, ":status": "selected",":cart_type":req.body.cart_type }
		// };
		// var items = await DB.query(params).promise();
		//console.log(items.Items.length);
		/*************************************************** */
		let newProducts = []
		req.body.products.forEach(product => {
			Object.keys(product).forEach((key) => (product[key] == null || product[key] == undefined) && delete product[key]);
			newProducts.push(product)
		});
		req.body.products = newProducts;
		var alldata = [];
		var rand = req.body.expert_id + "-" + req.body.customer_details.user_id + "-" + Math.random();
		var data = {
			cart_type: req.body.cart_type,
			customer_details: req.body.customer_details,
			cust_id: req.body.customer_details.user_id,
			share_with_customer: "no",
			expert_id: req.body.expert_id
		};
    
    // if (items.Items.length > 0) 
    // {
	// 		data.status = "selected";
	// 		data.session_id = items.Items[0].session_id;
	// 		data.scheme_code = req.body.products[0].scheme_code;
	// 		data.products = req.body.products[0];
	// 		let cart = await cartmodel.create(data);
	// 		console.log("cart item added", cart);
	// }
    // else 
    // {
			data.status = "selected";
			data.session_id = rand;
			data.scheme_code = req.body.products[0].scheme_code;
			data.products = req.body.products[0];
			let cart = await cartmodel.create(data);
			console.log("cart item added", cart);
	// }
		/******************************************************************* */
		let params2 = {
			"TableName": "carts",
			"IndexName": "sessionidIndex",
			"KeyConditionExpression": "session_id= :session_id",
			"FilterExpression": '#status=:status',
			"ExpressionAttributeNames": { "#status": "status" },
			"ExpressionAttributeValues": { ":session_id": data.session_id, ":status": "selected" }
		};
		var items2 = await DB.query(params2).promise();
		let response = { status: "success", data: items2.Items };
		console.log("session id data:- ", items2.Items);
    // if (items2.Items.length == "1") 
    // {
	// 	res.json({ status: "success", data: response });
	// 	return;
	// }
	let cartItems = items2.Items
	//const updateCartAndOrderdataResp = await updateCartAndOrderdata(cartItems);
	//console.log("updateCartAndOrderdataResp", updateCartAndOrderdataResp);
	res.json(response);
}
/******************************************************************** */
/***************************** generate link *************************************************** */
const generateCartLink = async (req, res) => {
	console.log("generateCartLink request param", req.body);
	try {
		if (req.body.id) {
			var url = "";
			let params2 = {}
			let { cart_type = false, id } = req.body;
      if (cart_type) 
      {
        if (cart_type == "fd") 
        {
					url = `${process.env.APP_URL}/${id}`;
        }
				/*****************************************************************/
				params2 = {
					"TableName": "carts",
					"IndexName": "sessionidIndex",
					"KeyConditionExpression": "session_id= :session_id",
					"FilterExpression": '#status=:status and cart_type=:cart_type',
					"ExpressionAttributeNames": { "#status": "status" },
					"ExpressionAttributeValues": { ":session_id": id, ":status": "selected", ":cart_type": cart_type }
				};
      } 
      /******************************************************************** */
			let items2 = await DB.query(params2).promise();
			console.log("cart Item from DB", items2.Items);
			if (items2.Items.length == "0") {
				res.json({ status: "failed", message: "no data found for given cart id" });
				return;
			}
			/***************************************************************************/
			// const expertData = await axios.get(process.env.USER_API_URL + "/" + items2.Items[0].expert_id)
			// 	.then(response => {
			// 		return response.data;
			// 	})
			// 	.catch(error => {
			// 		return error.message;
			// 	});
			// console.log("expert data : ", expertData);
			for(let i=0;i<items2.Items.length;i++)
			{
				await DB.update({
				TableName: "carts",
				Key: { id: items2.Items[i].id },
				ReturnValues: "ALL_NEW",
				UpdateExpression: `set share_with_customer=:share_with_customer, cart_share_date=:cart_share_date`,
				ExpressionAttributeValues: { ":share_with_customer": 'yes', ":cart_share_date": (new Date()).toISOString() }
				}).promise()
			}
			// items2.Items.forEach(async item => await DB.update({
			// 	TableName: "carts",
			// 	Key: { id: item.id },
			// 	ReturnValues: "ALL_NEW",
			// 	UpdateExpression: `set share_with_customer=:share_with_customer, cart_share_date=:cart_share_date`,
			// 	ExpressionAttributeValues: { ":share_with_customer": 'yes', ":cart_share_date": (new Date()).toISOString() }
			// }).promise());

			/**********************************************************************/
				// if (cart_type && cart_type == "redemption") {
				//   let dataForEmail = { "type": ["email"], "event": "portfolio_redemption_shared", "data": { "user_id": `${items2.Items[0].cust_id}`, "body": "", "link": `${url}`, "expert_name": `${expertData.data.name}` } };
				//   await axios.post(process.env.NOFICATION_API, dataForEmail).then().catch(e => console.log("email notif", e));
				//   const dataForNotification = { type: ['sms'], event: 'portfolio_redemption_share', data: { "user_id": `${items2.Items[0].cust_id}`, "body": "", "link": `${url}`, content: "portfolio_share" } };
				//   await axios.post(process.env.NOFICATION_API, dataForNotification).then().catch(e => console.log("sms notif", e));
				//   await axios.get(`https://media.smsgupshup.com/GatewayAPI/rest?method=SendMessage&format=json&userid=${process.env.GUPSHUP_USER_ID}&password=${process.env.GUPSHUP_PASSWORD}&send_to=` + req.body.customer_details.mobile_no + `&v=1.1&auth_scheme=plain&msg_type=HSM&msg=Your investment Advisor ${req.body.exp_name}, has shared a Redemption portfolio with you. You can review and Redeem by clicking here :${url}`)
				//     .then(response => { return response.data; }).catch(error => { return error; });
				// } else {
				//   let dataForEmail = { "type": ["email"], "event": "portfolio_shared", "data": { "user_id": `${items2.Items[0].cust_id}`, "body": "", "link": `${url}`, "expert_name": `${expertData.data.name}` } };
				//   await axios.post(process.env.NOFICATION_API, dataForEmail).then().catch(e => console.log("email notif", e));
				//   const dataForNotification = { type: ['sms'], event: 'portfolio_share', data: { "user_id": `${items2.Items[0].cust_id}`, "body": "", "link": `${url}`, content: "portfolio_share" } };
				//   await axios.post(process.env.NOFICATION_API, dataForNotification).then().catch(e => console.log("sms notif", e));
				//   await axios.get(`https://media.smsgupshup.com/GatewayAPI/rest?method=SendMessage&format=json&userid=${process.env.GUPSHUP_USER_ID}&password=${process.env.GUPSHUP_PASSWORD}&send_to=` + req.body.customer_details.mobile_no + `&v=1.1&auth_scheme=plain&msg_type=HSM&msg=Your investment Advisor ${req.body.exp_name}, has shared a Investment portfolio with you. You can review and invest by clicking here :${url}`)
				//     .then(response => { return response.data; }).catch(error => { return error; });
				// }
			res.json({ status: "success", data: { url: url } });
		} else {
			console.log("here not generate link", req.body);
			res.json({ status: "failed", message: "Please enter cart id." });
		}
	} catch (err) {
		console.log("err", err);
		res.json({ status: "failed", message: " Error Occred " + err.message });
	}
};
/******************************************************************** */
const createorderforfd= async(req,res)=>{
	console.log(req.body);
	
	let params = {
		"TableName": "kycs",
		"IndexName": "user_id-index",
		"KeyConditionExpression": "user_id= :user_id",
		"ExpressionAttributeValues": { ":user_id": req.body.customer_details.user_id}
	};
	var items = await DB.query(params).promise();
	console.log(items.Items[0]);
	if(items.Items.length>0)
	{
		/************************************************* */
		let params2 = {
			"TableName": "tm_users",
			"KeyConditionExpression": "id= :user_id",
			"ExpressionAttributeValues": { ":user_id": req.body.customer_details.user_id}
		};
		var items2 = await DB.query(params2).promise();
		if(items.Items[0].address==undefined)
		{
			items.Items[0].address='test address';
		}
		console.log("address:",items.Items[0].address);
		if(items.Items[0].address)
		{
			/*************************************************** */
			//console.log(items.Items[0]);
			let dob		=items.Items[0].dob.split("/");
			let name	=items.Items[0].name.split(" ");
			
			/****************************************** */
			if(items.Items[0].gender=='Male')
			{
				req.body.title="Mr";
			}
			else
			{
				req.body.title="Miss";
			}
			/************************************************* */
			//console.log(name.length);
			if(name.length>3)
			{
				req.body.fname=name[0];
				req.body.mname=name[1];
				req.body.lname=name[name.length-1];
			}
			else
			{
				req.body.fname=name[0];
				req.body.mname="";
				req.body.lname=name[1];
			}
			/************************************************ */
			req.body.gender			=items.Items[0].gender;
			req.body.pancard_no		=items.Items[0].pancard_no;
			req.body.bank_accounts	=items.Items[0].bank_accounts;
			if(req.body.bank_accounts[0].branch==undefined)
			{
				req.body.bank_accounts[0].branch='test';
			}
			req.body.dob			=dob[0]+"-"+dob[1]+"-"+dob[2];
			req.body.address		=items2.Items[0].address;
			req.body.city 			=items2.Items[0].city;
			if(req.body.city==undefined)
			{
				req.body.city			= 'test';
			}
			req.body.pin 			=items2.Items[0].pin;
			if(req.body.pin==undefined)
			{
				req.body.pin=721101;
			}
			req.body.country 		="India";
			req.body.email			=items.Items[0].email;
			/************************************************************ */
			if(req.body.products[0].company_name=='shriram')
			{
				let userToken = await createclientsyaram(req.body);
				console.log(userToken);
				if(userToken.status=='SUCCESS')
				{
					let orderdata={"expert_id":req.body.expert_id,"user_id":req.body.customer_details.user_id,"customer_details":req.body.customer_details,"cart_session_id":req.body.cart_session_id};
					orderdata.user_pan_no=req.body.pancard_no;
					orderdata.order_type="fd";
					/********************************************* */
					let params3 = {
						"TableName": "tm_users",
						"KeyConditionExpression": "id= :expert_id",
						"ExpressionAttributeValues": { ":expert_id": req.body.expert_id}
					};
					var items3 = await DB.query(params3).promise();
					orderdata.expert_details={"expert_name":items3.Items[0].name,"mobile_no":items3.Items[0].mobile_no};
					orderdata.customer_token_for_siyaram=userToken.token;
					orderdata.product=req.body.products[0];
					orderdata.payment_status='pending';
					/********************************************** */
					let order = await ordermodel.create(orderdata);
					console.log(order);
					/*************************************************** */
					let paymenturl=`http://cos.stfc.me/stfc/UserDetails1.aspx?Qvalue=${userToken.token}&Parameter21=${req.body.products[0].amount}&Parameter16=${req.body.email}`;
					res.json({ status: "success", data:{link: paymenturl }});
				}
				else
				{
					res.json({ status: "failed", message: "Unable to cteate client." });
				}
			}
			if(req.body.products[0].company_name=='Mahindra Finance')
			{
				let month='';
				if(dob[1]=='01')
				{
					month='Jan';
				}
				if(dob[1]=='01')
				{
					month='Jan';
				}
				if(dob[1]=='02')
				{
					month='Feb';
				}
				if(dob[1]=='03')
				{
					month='Mar';
				}
				if(dob[1]=='04')
				{
					month='Apr';
				}
				if(dob[1]=='05')
				{
					month='May';
				}
				if(dob[1]=='06')
				{
					month='Jun';
				}
				if(dob[1]=='07')
				{
					month='Jul';
				}
				if(dob[1]=='08')
				{
					month='Aug';
				}
				if(dob[1]=='09')
				{
					month='Sep';
				}
				if(dob[1]=='10')
				{
					month='Oct';
				}
				if(dob[1]=='11')
				{
					month='Nov';
				}
				if(dob[1]=='12')
				{
					month='Dec';
				}
				/******************************************************************* */
				req.body.dob=dob[0]+"-"+month+"-"+dob[2];
				let tranjuctiondata = await savetranjuctiondetails(req.body);
				console.log(tranjuctiondata);
				if(tranjuctiondata.status=='success')
				{
					let generatepaymentlink = await paymenturlgeneratefunction(tranjuctiondata);
					let orderdata={"expert_id":req.body.expert_id,"user_id":req.body.user_id,"customer_details":req.body.customer_details,"cart_session_id":req.body.cart_session_id};
					orderdata.user_pan_no=req.body.pancard_no;
					orderdata.order_type="fd";
					/********************************************* */
					let params3 = {
						"TableName": "tm_users",
						"KeyConditionExpression": "id= :expert_id",
						"ExpressionAttributeValues": { ":expert_id": req.body.expert_id}
					};
					var items3 = await DB.query(params3).promise();
					orderdata.expert_details			={"expert_name":items3.Items[0].name,"mobile_no":items3.Items[0].mobile_no};
					orderdata.CP_Trans_Ref_No			=tranjuctiondata.CP_Trans_Ref_No;
					orderdata.MF_Sys_Ref_No				=tranjuctiondata.MF_SYS_REF_NO;
					orderdata.token_for_mahindra		=tranjuctiondata.token;
					orderdata.product					=req.body.products[0];
					orderdata.payment_status			='pending';
					/********************************************** */
					let order = await ordermodel.create(orderdata);
					console.log(order);
					/*************************************************** */
					//res.json({ status: "success", link: generatepaymentlink });
					res.json({ status: "success", data:{link: generatepaymentlink.result }});
				}
				else
				{
					res.json({ status: "failed", message: tranjuctiondata.message });
				}
			}
			
		}
		else
		{
			res.json({ status: "failed", message: "No address found." });
		}
	}
	else
	{
		res.json({ status: "failed", message: "KYC data not found." });
	}
}
/**************************************************************** */
const allfdlist= async (req,res)=>{
	let data=[{
		"active_date": "2020-07-16T00:00:00",
		"active_in_active_flag": 1,
		"company_name": "shriram",
		"createdAt": "2020-07-16T00:00:00",
		"customer_category": "",
		"interest_frequency": "",
		"interest_rate": 0,
		"max_deposit": 10000000,
		"min_deposit": 5000,
		"multiples": 1000,
		"scheme_code": "",
		"scheme_type_code": "",
		"special_normal_flag": "N",
		"tenure_month_from": "",
		"tenure_month_to": ""
	  },
	 // {
		// "active_date": "2020-07-16T00:00:00",
		// "active_in_active_flag": 1,
		// "company_name": "Mahindra Finance",
		// "createdAt": "2020-07-16T00:00:00",
		// "customer_category": "",
		// "interest_frequency": "",
		// "interest_rate": 0,
		// "max_deposit": 10000000,
		// "min_deposit": 5000,
		// "multiples": 1000,
		// "scheme_code": "",
		// "scheme_type_code": "",
		// "special_normal_flag": "N",
		// "tenure_month_from": "",
		// "tenure_month_to": ""
	 // },
	  {
		"active_date": "2020-07-16T00:00:00",
		"active_in_active_flag": 1,
		"company_name": "Mahindra Finance",
		"createdAt": "2020-07-16T00:00:00",
		"customer_category": "",
		"interest_frequency": "",
		"interest_rate": 0,
		"max_deposit": 10000000,
		"min_deposit": 50000,
		"multiples": 1000,
		"scheme_code": "",
		"scheme_type_code": "",
		"special_normal_flag": "N",
		"tenure_month_from": "",
		"tenure_month_to": ""
	  },
	  {
		"active_date": "2020-07-16T00:00:00",
		"active_in_active_flag": 1,
		"company_name": "Mahindra Finance",
		"createdAt": "2020-07-16T00:00:00",
		"customer_category": "",
		"interest_frequency": "",
		"interest_rate": 0,
		"max_deposit": 10000000,
		"min_deposit": 25000,
		"multiples": 1000,
		"scheme_code": "",
		"scheme_type_code": "",
		"special_normal_flag": "N",
		"tenure_month_from": "",
		"tenure_month_to": ""
	  }
	  
	];
	res.json({ status: "success", data: data });
}
/************************************************************************/
const getfddetailsbyreq = async (req,res)=>{
	console.log(req.body);
	let params = {
		"TableName": "zf_fds",
		"FilterExpression": 'company_name=:company_name and min_deposit=:min_deposit and customer_category=:customer_category and scheme_type_code=:scheme_type_code' ,
		"ExpressionAttributeValues": { ":company_name": req.body.company_name, ":min_deposit": req.body.min_deposit, ":customer_category": req.body.customer_category,":scheme_type_code" :req.body.scheme_type_code}
	};
	var items = await DB.scan(params).promise();
	function compareFunction (a, b){
				return a['tenure_month_to'] - b['tenure_month_to']; 
			}
	let redata=items.Items.sort(compareFunction);
	res.json({ status: "success", data: redata });
}
/***************************************************************************/
const getpaymentstatusresponse= async (req,res)=>{
	console.log("req data:",req.body);
	if(req.body.SHRTRANID)
	{
		/*************************************************************/
		let params3 = {
						"TableName": "tm_orders",
						"IndexName": "customer_token_for_siyaram-index",
						"KeyConditionExpression": "customer_token_for_siyaram=:token",
						"ExpressionAttributeValues": { ":token": req.body.SHRTRANID}
					};
		var items = await DB.query(params3).promise();
		let params4 = {
						"TableName": "carts",
						"IndexName": "sessionidIndex",
						"KeyConditionExpression": "session_id=:session_id",
						"ExpressionAttributeValues": { ":session_id": items.Items[0].cart_session_id}
					};
		var items2 = await DB.query(params4).promise();
		/**************************************************************************/
		await DB.update({
				TableName: "tm_orders",
				Key: { id: items.Items[0].id },
				ReturnValues: "ALL_NEW",
				UpdateExpression: `set payment_status=:payment_status, trnid=:trnid`,
				ExpressionAttributeValues: { ":payment_status": 'success', ":trnid": req.body.APTRANID}
				}).promise();
		/***********************************************************/
		await DB.update({
				TableName: "carts",
				Key: { id: items2.Items[0].id },
				ReturnValues: "ALL_NEW",
				UpdateExpression: `set #status=:status`,
				ExpressionAttributeNames : { "#status": "status" },
				ExpressionAttributeValues: { ":status": 'complited'}
				}).promise();
		console.log(req.body.SHRTRANID);
		res.redirect('http://ec2-13-232-167-163.ap-south-1.compute.amazonaws.com:3000/thankyou?lang=en');
	}
	else
	{
		res.redirect('http://ec2-13-232-167-163.ap-south-1.compute.amazonaws.com:3000/thankyou?lang=en');
	}
	
	//res.json({ status: "success"});
}
/****************************************************************** */
router.post("/getfddetailsbyque",getfddetailsbyreq);
router.get("/allfd", getAllfd);
router.post("/createorder",createorderforfd);
router.post("/geratecartlinkforfd",generateCartLink);
router.post("/createcart", createcart);
router.post("/fdBySchemeCode", getfdBySchemeCode);
router.get("/allfdlist",allfdlist);
router.post("/paymentstatus", getpaymentstatusresponse);
module.exports = router;