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
const createtokenformahindra = async () => {
    let headers={
        headers: {
        'content-type'      : 'application/json',
        "x-ibm-client-id"   : process.env.CLIENT_ID_IBM
        }
    };
    let reqdata={
        "CP_Code"           : process.env.CPCODE,
        "CP_AppCode"        : process.env.CPAPPCODE,
        "CP_API_UserName"   : process.env.CPAPIUSERNAME,
        "CP_Password"       : process.env.CPPASSWORD
    };
    var createtoken = await axios.post(process.env.MAHINDRA_MAIN_URL+process.env.MAHINDRA_AUTH_API,reqdata,headers).then((res) => {
			return res;
		  }).catch((err) => {
			if (err) {
			  return err;
			}
          });
    //console.log(createtoken);
    let returndata={"status":"success","token":createtoken.data.token};
    return returndata;
}
/************************************************************************* */
const createleadformahindra= async(data)=>{
    let headers={
        headers: {
        'content-type'      : 'application/json',
        "x-ibm-client-id"   : process.env.CLIENT_ID_IBM,
        "Authorization"     : data.token
        }
    };
    /*************************************************** */
    let reqdata={  
        "LeadDetails": 
        {
            "Scp_Code":"TRANS_SBRK",  
            "Ref_Type":"TRANS_SBRK",
            "Ref_Cust_Code":"",
            "Ref_Rm_Code":"",
            "Ref_Othr_Code":"",
            "CP_Trans_Ref_No":data.CP_Trans_Ref_No, 
            "Name":data.customer_details.user_name,
            "Amount":data.products[0].amount,
            "DOB":data.dob,
            "EmailId":data.email,
            "LeadType":"01", 
            "CP_Location_Code":"DL",
            "Mobile":data.customer_details.mobile_no,
            "PAN":data.pancard_no,   
            "Salutation":"MR",
            "Source":"CP"
        }
    };
    console.log("client token req data:",reqdata);
    /************************************************** */
    var createlead = await axios.post(process.env.MAHINDRA_MAIN_URL+process.env.MAHINDRA_LEAD_CREATION_API,reqdata,headers).then((res) => {
        return res;
      }).catch((err) => {
        if (err) {
          return err;
        }
      });
   console.log("client data:",createlead.data);
   return createlead.data;
}
/*********************************************************************************** */
const savetranjuctiondetails = async (requesrdata)=>{

    console.log(requesrdata);
    // return false;
    /************************************************************* */
    let tokendata                   = await createtokenformahindra();
    requesrdata.token               = tokendata.token;
    
    requesrdata.CP_Trans_Ref_No     ="ZFUNDS"+new Date().valueOf();
    let clientcreation              = await createleadformahindra(requesrdata);
    console.log(clientcreation.MF_SYS_REF_NO,requesrdata.CP_Trans_Ref_No);
    /*********************************************************** */
    let headers={
        headers: {
        'content-type'      : 'application/json',
        "x-ibm-client-id"   : process.env.CLIENT_ID_IBM,
        "Authorization"     : tokendata.token
        }
    };
    /********************************************************** */
    let trnreqdata={
            "InvestmentDetails":
             {
               "Scp_Code":"TRANS_SBRK",
               "Ref_Type":"TRANS_SBRK",
               "Ref_Cust_Code":"",
               "Ref_Rm_Code":"",
               "Ref_Othr_Code":"",
               "CP_Trans_Ref_No":requesrdata.CP_Trans_Ref_No,
               "MF_Sys_Ref_No":clientcreation.MF_SYS_REF_NO,
               "Category":requesrdata.products[0].customer_category,
               "SchemeType_Code":requesrdata.products[0].scheme_type_code,
               "SchemeCode":requesrdata.products[0].scheme_code,
               "IntRate":requesrdata.products[0].interest_rate,
               "IntFreq":requesrdata.products[0].interest_frequency,
               "Tenure":requesrdata.products[0].tenure_month_from,
               "IsAutoRenewal":"False",
               "Amount":requesrdata.products[0].amount,
               "PaymentMode":"2",
               "PaymentInstruction":"F",
               "CP_Location_Code":"DL",
               "IsTnCAccepted":"",
               "IsDecAccepted":"",
               "Payment_Ref_No":"12121212112121",
               "Payment_Ref_Date":"",
               "Drawn_Bank_Name":"ICICI BANK",
               "Drawn_Bank_Branch":"HITANI",
               "Drawn_Bank_Micr_Code":"000229000",
               "Drawn_Bank_Ifsc_Code":"ICIC0000958",
               "Cms_Branch_Code":"000229000",
               "Cms_Branch_Name":"HITANI",
               "Cms_Location_Code":"DL",
               "Cms_Location_Name":"HITANI",
               "Cms_Branch_State_Code":"DL",
               "Cms_Branch_Short_Name":"HITANI",
               "Cms_Branch_Pincode":"721101",
               "Is_TDS_Applicable":"True",
               "Is_Payment_Disc_Accepted":"",
               "Is_Cersai_Disc_Accepted":"",
               "Renewal_For":"P"
              },
             "InvestorBankDtl":
              {
               "Scp_Code":"TRANS_SBRK",
               "Ref_Type":"TRANS_SBRK",
               "Ref_Cust_Code":"",
               "Ref_Rm_Code":"",
               "Ref_Othr_Code":"",
               "MICRCode":"000229000",
               "NEFTCode": "ICIC0000958", 
               "BranchName": "WANI BRANCH", 
               "BankName": "ICICI BANK LTD",
               "BankAccountNo":"122133343245544355345"
              },
              "InvestorAddDtls":
           {
              "Scp_Code":"TRANS_SBRK",
               "Ref_Type":"TRANS_SBRK",
               "Ref_Cust_Code":"",
               "Ref_Rm_Code":"",
               "Ref_Othr_Code":"",
               "First_Holder_Name":"Bishnu Singh",
                "Mobile":"9958844723",
                "EmailId":"bishnu.mca@gmail.com",
                "First_Holder_PAN":"BTBPS6021A",
                "Amount":"25000",
                 "DOB":"02-Jul-1982",
                 "Address1":"DL",
                 "Address2":"",
                 "Address3":"",
                 "CKC_StateCode":"DL",
                  "DistrictName":"Central Delhi",
                  "PinCode":"110005",
                 "CKYC_No":"" ,
                  "Second_Holder_Name":"",
                  "Third_Holder_Name":"",
                  "Second_Holder_CKYC_No":"",
                  "Third_Holder_CKYC_No":"",
                  "Second_Holder_PAN":"",
                  "Second_Holder_Ovd_Type":"",
                   "Second_Holder_Ovd_No":"",
                  "Third_Holder_PAN":"",
                   "Third_Holder_Ovd_Type":"",
                  "Third_Holder_Ovd_No":"",
                  "Second_Holder_DOB":"",
                  "Third_Holder_DOB":"",
                  "First_Holder_Kyc_TaxResidencyOutsideIndia_Code":"01"    
           },
           "FATCAHeader":{
               "Nationality_Code":"IN",
               "Nationality_Dec":"INDIAN",
               "CountryOfBirth_Code":"IN",
               "CountryOfBirth_Name":"INDIA",
               "CityOfBirth_Name":"BANKURA",
               "Father_Name":"D.N.DEBSINHA",
               "Spouse_Name":"NILIMA",
               "Occupation_code":"S-02",
               "Occupation_Name":"SERVICE"
           },
           "FATCADetails":
           [{
           "TaxResident_CountryC":"IN",
           "TaxResident_CountryCode":"US",
           "TaxResident_CountryN":"IN",
           "TaxIdentificationTypeCode":"2",
           "TaxIdentificationTypeDe":"09",
           "TaxIdentificationNumber":"667686866",
           "TRCExpiryDate":"02-JUL-2020",
           "Address_TypeCode":"01",
           "Address_TypeDesc":"Central Delhi",
           "Address1":"Central Delhi",
           "Address2":"Central Delhi",
           "Landmark":"Central Delhi",
           "State_Code":"US-AK",
           "State_Name":"DELHI",
           "Postalcode":"110005",
           "STD_Code_Primary":"01",
           "Telephone_Number_":"1234567890",
           "Mobile_Number_Prim":"123456789",
           "STD_Code_Other":"1234566",
           "Mobile_Number_Othe":"123356777",
           "Country_Code":"IN",
           "Country_Name":"INDIA",
           "City":"DELHI"
           }],
           "FATCACitizenship":
           [{
           "CitizenshipCode":"IN",
           "Citizenship":"Indian",
           "AddressType":""
           }],
            "KYCDataDetails": [
                   {
                       "Source_Sub_Type": "MCP",
                       "Holder_Type": "01",
                       
                       "CP_Trans_Ref_No":requesrdata.CP_Trans_Ref_No,
                       "MF_Sys_Ref_No":clientcreation.MF_SYS_REF_NO,
                       "CP_Location_Code": "DL",
                       "Kyc_ConstiType": "CT",
                       "Kyc_NamePrefix": "MR",
                       "Kyc_FirstName": "Bishnu",
                       "Kyc_MiddleName": "",
                       "Kyc_LastName": "Singh",
                       "Kyc_FullName": "Bishnu Singh",
                       "Kyc_MaidenNamePrefix": "",
                       "Kyc_MaidenFirstName": "",
                       "Kyc_MaidenMiddleName": "",
                       "Kyc_MaidenLastName": "",
                       "Kyc_MaidenFullName": "",
                       "Kyc_FatherNamePrefix": "MR",
                       "Kyc_FatherFirstName": "PRAFUL XXXX",
                       "Kyc_FatherMiddleName": "",
                       "Kyc_FatherLastName": "",
                       "Kyc_FatherFullName": "",
                       "Kyc_SpouseNamePrefix": "",
                       "Kyc_SpouseFirstName": "",
                       "Kyc_SpouseMiddleName": "",
                       "Kyc_SpouseLastName": "",
                       "Kyc_SpouseFullName": "",
                       "Kyc_MotherNamePrefix": "MRS",
                       "Kyc_MotherFirstName": " ",
                       "Kyc_MotherMiddletName": null,
                       "Kyc_MotherLastName": "",
                       "Kyc_MotherFullName": "",
                       "Kyc_Gender": "F",
                       "Kyc_MaritalStatus": "01",
                       "Kyc_Nationality_Code": "IN",
                       "Kyc_Occupation_Code": "S-02",
                       "Kyc_DOB": "02-Jul-1982",
                       "Kyc_ResidentialStatus_Code": "01",
                       "Kyc_TaxResidencyOutsideIndia_Code": "02",
                       "Kyc_JurisdictionofRes_Code": "01",
                       "Kyc_TIN": "",
                       "Kyc_CountryOfBirth": "INDIA",
                       "Kyc_PlaceOfBirth": "DELHI",
                       "Kyc_Per_AddType_Code": "01",
                       "Kyc_Per_Add1": "C 918 Central Delhi",
                       "Kyc_Per_Add2": "OPP Central Delhi ",
                       "Kyc_Per_Add3": "Central Delhi ",
                       "Kyc_Per_AddCity_Desc": "Delhi",
                       "Mf_Kyc_Per_AddCity_Code": "01",
                       "Kyc_Per_AddDistrict_Desc": "Central Delhi",
                       "Kyc_Per_AddState_Code": "DL",
                       "Kyc_Per_AddCountry_Code": "IN",
                       "Mf_Kyc_Per_AddCountry_Code": "IN",
                       "Mf_Per_AddCountry_Desc": null,
                       "Kyc_Per_AddPin": "110005",
                       "Kyc_Per_AddPOA": "",
                       "Kyc_Per_AddPOAOthers": "",
                       "Kyc_Per_AddSameAsCor_Add": "Y",
                       "Kyc_Cor_Add1": "C 918  XXXXX APARTMENT XXXXEDARWADI ",
                       "Kyc_Cor_Add2": "OPP XXXX XXXXX ",
                       "Kyc_Cor_Add3": "XXXXX  W  ",
                       "Kyc_Cor_AddCity_Desc": "MUMBAI",
                       "Mf_Kyc_Cor_AddCity_Code": null,
                       "Mf_Kyc_Cor_AddCity_Desc": null,
                       "Kyc_Cor_AddDistrict_Desc": "Central Delhi",
                       "Mf_Kyc_Cor_AddDistrict_Code": null,
                       "Mf_Kyc_Cor_AddDistrict_Desc": null,
                       "Kyc_Cor_AddState_Code": "DL",
                       "Kyc_Cor_AddCountry_Code": "IN",
                       "Mf_Kyc_Cor_AddCountry_Code": "91",
                       "Mf_Kyc_Cor_AddCountry_Desc": null,
                       "Kyc_Cor_AddPin": "110005",
                       "Kyc_PerAddSameAsJurAdd": "",
                       "Kyc_Jur_Add1": "",
                       "Kyc_Jur_Add2": "",
                       "Kyc_Jur_Add3": "",
                       "Kyc_Jur_AddCity_Desc": "Delhi",
                       "Mf_Kyc_Jur_AddCity_Code": null,
                       "Mf_Kyc_Jur_AddCity_Desc": null,
                       "Kyc_Jur_AddState_Desc": "DL",
                       "Kyc_Jur_AddCountry_Code": "IN",
                       "Mf_Kyc_Jur_AddCountry_Code": "IN",
                       "Mf_Kyc_Jur_AddCountry_Desc": "Central Delhi",
                       "Kyc_Jur_AddPin": "110005",
                       "Kyc_ResTelSTD": "",
                       "Kyc_ResTelNumber": "",
                       "Kyc_OffTelSTD": "",
                       "Kyc_OffTelNumber": "",
                       "Kyc_MobileISD": null,
                       "Kyc_MobileNumber": "9958844723",
                       "Kyc_FAXSTD": "",
                       "Kyc_FaxNumber": "",
                       "Kyc_EmailAdd": "bishnu.mca@gmail.com",
                       "Kyc_TypeofDocSubmitted": "",
                       "CreatedIP": null,
                       "CreatedBy": null,
                       "CreatedType": null,
                       "SessionID": null,
                       "CreatedByUName": null,
                       "Kyc_AccType": "01",
                       "Ref_Cust_Code": "",
                       "Ref_Rm_Code": "",
                       "Ref_Othr_Code": "",
                       "Ref_Type": "TRANS_SBRK",
                       "Scp_Code": "TRANS_SBRK"
                   }
               ],
               "KYCNomineeDtls": {
                   "ApplNo": null,
                   "CPCode": null,
                   "CPName": null,
                   "UserName": null,
                   "AppCode": null,
                   
                   "CP_Trans_Ref_No":requesrdata.CP_Trans_Ref_No,
                   "MF_Sys_Ref_No":clientcreation.MF_SYS_REF_NO,
                   "CP_Location_Code": null,
                   "Nom_NamePrefix": null,
                   "Nom_Name": "RAKESHXXX",
                   "Nom_FirstName": "RAKESHXX",
                   "Nom_MiddleName": "V",
                   "Nom_LastName": "XXXX",
                   "Nom_Relations": "HUS",
                   "Nom_DOB": "20-Feb-1978",
                   "Is_Nom_Minor": false,
                   "Nom_EmailID": "",
                   "Nom_MobileNo": "",
                   "Nom_GuardianName": "",
                   "Active": false,
                   "FromDate": null,
                   "ToDate": null,
                   "CreatedBy": null,
                   "CreatedByUName": null,
                   "CreatedOn": null,
                   "CreatedIP": null,
                   "SessionId": null,
                   "Ref_Cust_Code": "",
                   "Ref_Rm_Code": "",
                   "Ref_Othr_Code": "",
                   "Ref_Type": "TRANS_SBRK",
                   "Scp_Code": "TRANS_SBRK",
                   "Nom_Add1": "",
                   "Nom_Add2": "",
                   "Nom_Add3": "",
                   "Nom_CKC_StateCode": "",
                   "Nom_CKC_District_Desc": "",
                   "Nom_City_Desc": "",
                   "Nom_Pin_Code": "110005"
               }
           };
    /************************************************** */
        var savetranjuctiondata = await axios.post(process.env.MAHINDRA_MAIN_URL+process.env.MAHINDRA_TRANJUCTION_CREATION_API,trnreqdata,headers).then((res) => {
            return res;
        }).catch((err) => {
            if (err) {
            return err;
            }
        });
    console.log("response 396:",savetranjuctiondata.data);
    let returnparams={};
    if(savetranjuctiondata.data.msg=='SUCCESS')
    {
        returnparams.status         ="success";
        returnparams.Appl_No        =savetranjuctiondata.data.Appl_No;
        returnparams.token          =tokendata.token;
        returnparams.CP_Trans_Ref_No=requesrdata.CP_Trans_Ref_No;
        returnparams.MF_SYS_REF_NO  =clientcreation.MF_SYS_REF_NO;

    }
    else
    {
        returnparams.status         ="failed";
        returnparams.message        =savetranjuctiondata.data.msg;
        returnparams.token          =tokendata.token;
        returnparams.CP_Trans_Ref_No=requesrdata.CP_Trans_Ref_No;
        returnparams.MF_SYS_REF_NO  =clientcreation.MF_SYS_REF_NO;
    }
    return returnparams;
}
/****************************************************************************** */
const paymenturlgeneratefunction = async (requestdata) =>{
    /*********************************************************** */
    let headers={
        headers: {
        'content-type'      : 'application/json',
        "x-ibm-client-id"   : process.env.CLIENT_ID_IBM,
        "Authorization"     : requestdata.token
        }
    };
    /********************************************************** */
    let linkreqdata={
        "CP_CODE"                           :process.env.CPCODE,
        "CP_API_User_Name"                  :process.env.CPAPIUSERNAME,
        "CP_Trans_Ref_no"                   :requestdata.CP_Trans_Ref_No,
        "Appl_No"                           :requestdata.Appl_No,
        "MF_Sys_Ref_No"                     :requestdata.MF_SYS_REF_NO,
        "IV"                                :process.env.VECTOR_KEY_MAHINDRA,
        "Key"                               :process.env.PRIVATE_KYE_MAHINDRA,
        "CP_Payment_Response_Return_URL"    :process.env.PAYMENTGATEWAYREDIRECTURL
    }
    /********************************************************* */
    var generatelink = await axios.post(process.env.MAHINDRA_MAIN_URL+process.env.MAHINDRAPAYMENTLINKGENERATEAPUIURL,linkreqdata,headers).then((res) => {
        return res;
    }).catch((err) => {
        if (err) {
        return err;
        }
    });
    console.log(generatelink.data);
    return generatelink.data;
}
/***************************************************************************** */
module.exports = {
    savetranjuctiondetails,
    paymenturlgeneratefunction
  };