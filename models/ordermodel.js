const AWS       = require("aws-sdk");
const dynamo    = require('dynamodb');
const Joi       = require('joi');
const dotenv    = require('dotenv');
/****************************************************** */
dotenv.config();
/**********************************************************/
dynamo.AWS.config.update({accessKeyId: process.env.API_KEY,secretAccessKey: process.env.SECRET_KEY,region: process.env.REGION,endpoint: process.env.END_POINT});
/******************************************************************************/

var order = dynamo.define('tm_order', {
    hashKey   : 'id',
    timestamps: true,
    schema: {
        id                          : dynamo.types.uuid(),
        cart_session_id            : Joi.string(),
        expert_id                   : Joi.string(),
        user_id                     : Joi.string(),
        cart_type                   : Joi.string(),
        transaction_number          : Joi.string(),
        product                     : Joi.object().keys(),
        expert_details              : Joi.object().keys(),
        customer_details            : Joi.object().keys(),
        order_type                  : Joi.string(),
        user_pan_no                 : Joi.string(),
        customer_token_for_siyaram  : Joi.string(), 
        CP_Trans_Ref_No             : Joi.string(), 
        MF_Sys_Ref_No               : Joi.string(),
        token_for_mahindra          : Joi.string(),
        payment_status              : Joi.string()  
    },
  });
/*****************************************************************************/
module.exports = order;