const express 	= require("express");
var AWS     	= require("aws-sdk");
var dynamo  	= require('dynamodb');
var axios       = require("axios");
const dotenv 	= require('dotenv');
/****************************************************** */
var DB 			= new AWS.DynamoDB.DocumentClient();
/*******************************************************/
dotenv.config();
AWS.config.update({
	secretAccessKey: process.env.SECRET_KEY,
	accessKeyId: process.env.API_KEY,
	region: process.env.REGION
});
const s3 = new AWS.S3();
var s3Bucket = new AWS.S3({ params: { Bucket: process.env.S3_BUCKET_NAME, } });
/****************************************************************************** */
const createclientsyaram = async (data) => {
	console.log("client data:",data);
	let reqdata=[
		{"Parameter1":data.title,
		"Parameter2":data.fname,
		"Parameter3":data.mname,
		"Parameter4":data.lname,
		"Parameter5":data.dob,
		"Parameter6":data.gender,
		"Parameter7":data.pancard_no,
		"Parameter8":data.address,
		"Parameter9":"",
		"Parameter10":data.city,
		"Parameter11":data.city,
		"Parameter12":data.city,
		"Parameter13":data.country,
		"Parameter14":data.pin,
		"Parameter15":data.customer_details.mobile_no,
		"Parameter16":data.email,
		"Parameter17":"",
		"Parameter18":"Resident Individual",
		"Parameter19":"Cumulative",
		"Parameter20":"NA",
		"Parameter21":data.products[0].amount,
		"Parameter22":"Auto Refund",
		"Parameter23":"",
		"Parameter24":"Sole Or First Applicant",
		"Parameter25":data.bank_accounts[0].type,
		"Parameter26":data.bank_accounts[0].ifsc_code,
		"Parameter27":data.bank_accounts[0].account_no,
		"Parameter28":data.bank_accounts[0].bank_name, 
		"Parameter29":data.bank_accounts[0].branch,// Bank branch
		"Parameter30":"",
		"Parameter31":"",
		"Parameter32":"",
		"Parameter33":"",
		"Parameter34":"",
		"Parameter35":"",
		"Parameter36":"",// 36 - 43 nom details
		"Parameter37":"",
		"Parameter38":"",
		"Parameter39":"",
		"Parameter40":"",
		"Parameter41":"",
		"Parameter42":"",
		"Parameter43":"",
		"Parameter44":data.pancard_no, // pancard
		"Parameter45":data.products[0].monthes, //fd duration
		"Parameter46":data.products[0].intarest_rate, //intarest rate
		"Parameter47":data.aadhar_card_no, //aadhar card
		"Parameter48":process.env.PAYMENTGATEWAYREDIRECTURL,
		"Parameter49":"SHRIRAM TRANSPORT FINANCE COMPANY LTD.",
		"Parameter50":"InsertInwardDetails",
		"Parameter51":"Service_USP_UserInwardEntryDetails",
		}];
		console.log("siram request data:",reqdata);
		var clientdata = await axios.post('http://cos.stfc.me/APIService/ApiMasterWcfService.svc/InsertInward',reqdata,{headers: { 'content-type': 'application/json'}}).then((res) => {
			return res;
		  }).catch((err) => {
			if (err) {
			  return err;
			}
		  });
		console.log("sriram response:",clientdata);
		let result = clientdata.data.split(",");
		let returnres={"status":""};
		if(result[0]=='SUCCESS')
		{
			let token=result[1];
			returnres.status='SUCCESS';
			returnres.token=token;
		}
		else
		{
			returnres.status='FAILED';
		}
		return returnres;
		//res.json({status:result[0],data:token}) 
}
/******************************************************************************** */
module.exports = {
    createclientsyaram
  };