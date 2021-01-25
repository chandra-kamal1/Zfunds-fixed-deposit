var AWS     = require("aws-sdk");
var dynamo  = require('dynamodb');
const Joi   = require('joi');
const dotenv= require('dotenv');
/****************************************************** */
dotenv.config();
/**********************************************************/
dynamo.AWS.config.update({accessKeyId: process.env.API_KEY, secretAccessKey: process.env.SECRET_KEY, region: process.env.REGION,endpoint: process.env.END_POINT});
/******************************************************************************/
/******************************************************************************/
var cart = dynamo.define('cart', {
    hashKey : 'id',
    timestamps : true,
    schema : {
            id                  : dynamo.types.uuid(),
            expert_id           : Joi.string(),
            cart_type           : Joi.string(),
            goal_planing_id     : Joi.string(),
            share_with_customer : Joi.string(),
            cart_share_date     : Joi.string(),
            scheme_code         : Joi.string(),
            session_id          : Joi.string(),
            status              : Joi.string(),
            products            : Joi.object().keys(),
            cust_id             : Joi.string(),
            pay_link            : Joi.string(),
            customer_details 	  : Joi.object().keys({
                                                      user_id 		    : Joi.string(),
                                                      user_name 	    : Joi.string(),
                                                      mobile_no       : Joi.string()
                                                    })
           
          },
          indexes : [
            {
              hashKey : 'expert_id',  name : 'expertidIndex', type : 'global'
            },
            {
              hashKey : 'session_id',  name : 'sessionidIndex', type : 'global'
            }
          ]
  });
  /*****************************************************************************/
module.exports=cart;