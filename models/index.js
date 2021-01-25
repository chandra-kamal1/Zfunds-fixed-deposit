var AWS     	= require("aws-sdk");
var dynamo  	= require('dynamodb');
const Joi   	= require('joi');
const dotenv 	= require('dotenv');
/****************************************************** */
dotenv.config();
/**********************************************************/
dynamo.AWS.config.update({accessKeyId: process.env.API_KEY, secretAccessKey: process.env.SECRET_KEY, region: process.env.REGION,endpoint: process.env.END_POINT});
var fd = dynamo.define('zf_fd', {
	  hashKey : 'scheme_code',
	  timestamps : true,
	  schema : {
					scheme_code                 : Joi.string(),
					company_name                : Joi.string(),
					customer_category           : Joi.string(),
					special_normal_flag         : Joi.string(),
					tenure_month_from           : Joi.string(),
					tenure_month_to             : Joi.string(),
					min_deposit                 : Joi.number(),
					max_deposit           		: Joi.number(),
					scheme_type_code         	: Joi.string(),
					interest_frequency          : Joi.string(),
					interest_rate             	: Joi.number(),
					active_date                 : Joi.string(),
					in_active_date         		: Joi.string(),
					multiples         			: Joi.number(),
					active_in_active_flag       : Joi.number()
	  			}
});

module.exports=fd;
