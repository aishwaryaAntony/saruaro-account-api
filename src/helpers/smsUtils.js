const request = require('request');
import { TWILIO_AUTH_TOKEN, TWILIO_ACCOUNT_SID, TWILIO_FROM_PHONE} from "./constants";
export default {  
    sendSms(phoneNumber, OTPMessage) {
	   const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
         return new Promise(async (resolve, reject) => {
			client.messages
			.create({
			   body: OTPMessage,
			   from: TWILIO_FROM_PHONE,
			   to: phoneNumber
			 })
			.then(message =>resolve(message))
            .catch(function (error) {
                console.log(`error at sending sms for - ${phoneNumber} -> ${JSON.stringify(error)}`)
            }); 
         });        
    }
}