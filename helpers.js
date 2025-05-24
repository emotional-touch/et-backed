// helpers.js
require('dotenv').config();
const twilio = require('twilio');
var conn = require("./config/db");
const axios = require('axios');

module.exports = {
    twilioSMS: (message, toMobile) => {
        // Twilio credentials
        const accountSid =  process.env.TWILIO_ACCOUNT_SID;
        const authToken =  process.env.TWILIO_AUTH_TOKEN;
        const twilioPhoneNumber =  process.env.TWILIO_PHONE_NUMBER;

        const client = twilio(accountSid, authToken);

        client.messages
        .create({
            body: message,
            from: twilioPhoneNumber,
            to: toMobile,
        })
        .then((message) => {
            //console.log(`Message sent with SID: ${message.sid}`);
        })
        .catch((error) => {
            console.error(`Error sending SMS: ${error.message}`);
        });
    },

    factorSMS: async (otp, mobileNumber) => {
        const factorKey =  process.env.FACTOR_KEY;
        //var smsUrl =  'https://2factor.in/API/V1/' + factorKey + '/SMS/' + mobileNumber + '/' + otp + '/OTP1';
        var smsUrl = 'https://2factor.in/API/V1/' + factorKey + '/SMS/' + mobileNumber + '/' + otp + '/App+Template';
        try {
          const response = await axios.post(
              smsUrl
          );

          // Check if OTP was sent successfully
          if (response.data.Status === 'Success') {
              //console.log('OTP sent successfully!');
              return true;
          } else {
              console.error('Failed to send OTP:', response.data.Details);
              return false;
          }
        } catch (error) {
            console.error('Error sending OTP:', error.message);
            return false;
        }
    },

    transactionIdGenerator: () => {
        return new Promise((resolve, reject) => {
            // Execute the SQL query
            conn.query(
              "SELECT generated_number FROM ( SELECT CONCAT('txn_', LPAD(FLOOR(RAND() * 9999999999), 10, '0')) AS generated_number ) AS random_number LEFT JOIN wallet_transaction ON wallet_transaction.wallet_transaction_id = random_number.generated_number WHERE wallet_transaction.wallet_transaction_id IS NULL LIMIT 1",
              (error, results, fields) => {
                if (error) {
                  // Reject with error if query execution fails
                  reject(error);
                  return;
                }
                
                if (results.length > 0) {
                  // Resolve with the generated number if found
                  resolve(results[0].generated_number);
                } else {
                  // Resolve with null if no generated number found
                  resolve(null);
                }
              }
            );
        });
    },

};
  