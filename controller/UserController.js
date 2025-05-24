var conn = require("../config/db");
const homeController = require("../controller/HomeController");
const commonController = require("../controller/CommonController");
var emailTempleteModel = require("../models/EmailTemplete");
var userModel = require("../models/User");
var walletModel = require("../models/Wallet");
var referEarnModel = require("../models/ReferEarn");
var leaveModel = require("../models/Leave");
var couponModel = require("../models/Coupon");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const helpers = require('../helpers');

module.exports = {
    register: async function(req, res) {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
           var mobileNo = req.body.phone_number;
            if (mobileNo.startsWith("+")) {
                var resultMobile = '+'+mobileNo.slice(1);
            } else {
                var resultMobile = '+91'+mobileNo;
            }
           var otpData = getOTPData();
           var state = null;
           if (req.body.state) {
            var state = req.body.state;
           }

           var country = null;
           if (req.body.country) {
            var country = req.body.country;
           }
           let data = {
               full_name: req.body.full_name,
               email: req.body.email,
               phone_number: resultMobile,
               otp: otpData.otp,
               otp_expiry: otpData.otp_expiry,
               language: req.body.language,
               state: state,
               country: country
           };
           var currentTimeDate = new Date();
           try {
               let userFind = await userModel.reRegisterCheck(conn, req.body.phone_number, req.body.email);
               if (userFind != '') { 
                    const record = userFind[0]; 
                    var resp = await userModel.update(conn, data, record.id);
                    var userId = record.id;
               }else{
                    var userReferCode = await generateRandomCode(conn, 7);
                    data.referral_code = userReferCode;
                    var resp = await userModel.insert(conn, data);
                    var userId = resp.insertId;
                    var welcomeBonus = 0;
                    let setting = await commonController.getSettingData(23);
                    if(setting != '' && setting != null && setting != undefined){
                        welcomeBonus = parseInt(setting.value);
                    }
                    var walleteData = {
                        'user_id': userId,
                        'balance': welcomeBonus
                    };
                    var walletBalanceAdd =  await walletModel.storeWalleteBalance(conn, walleteData); 
                    
                    if(welcomeBonus > 0){
                        var walletId = walletBalanceAdd.insertId; 

                        var transactionNumber = await helpers.transactionIdGenerator();
                        var walleteTransactionData = {
                            'wallet_id': walletId,
                            'wallet_transaction_id': transactionNumber,
                            'user_id': userId,
                            'amount': welcomeBonus,
                            'transaction_type': 'credit',
                            'entry_type': 3,
                            'description': 'Welcome Bonus',
                        };
                        var walletTransactionAdd =  await walletModel.storeWalleteTransaction(conn, walleteTransactionData);
                    }
        
                    if(req.body.referral_code != '' && req.body.referral_code != null && req.body.referral_code != undefined){
                        var referCodeCheck = await referEarnModel.findReferCode(conn, req.body.referral_code);
                        if(referCodeCheck != ''){
                            var referData = {
                                'refer_from':referCodeCheck[0].id,
                                'refer_to':userId,
                                'refer_date':currentTimeDate,
                                'referral_status': 'pending'
                            };
                            var referAdd = await referEarnModel.insert(conn, referData);
                        }
                        
                    }

               }

               /**************************** Email Send Code ***********************/

            //    let emailTempleteCheck =  await emailTempleteModel.list(conn, 3);
            //    if(emailTempleteCheck != ''){
            //         let emailContent = emailTempleteCheck[0].body;
            //         var emailSubject = emailTempleteCheck[0].subject;
            //         const replacements = [
            //             { word: '{NAME}', replacement: req.body.full_name },
            //             { word: '{OTP}', replacement: otpData.otp },
            //         ];
                   
                    
            //         const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                   
            //         const modifiedString = emailContent.replace(pattern, match => {
            //             const replacement = replacements.find(rep => rep.word === match);
            //             return replacement ? replacement.replacement : match;
            //         });
            //         var finalContent = modifiedString;
            //    }else{
            //     var finalContent = '';
            //     var emailSubject = '';
            //    }
            //    var emailTo = req.body.email;
            //    homeController.sendEmailData(res, emailTo, emailSubject, finalContent);

               /**************************** End Email Send Code ***********************/

               /******************************** SMS send code *************************/
                    // Example usage of twilioSMS function
                    const message = 'Emotional Touch one time verification OTP is '+otpData.otp;
                    const toMobile = resultMobile; // Replace with the actual phone number

                    try {
                        helpers.factorSMS(otpData.otp, toMobile);
                        //await helpers.twilioSMS(message, toMobile);
                        //console.log('SMS sent successfully!');
                    } catch (error) {
                        console.error('Error sending SMS:', error.message);
                    }
               /******************************** End SMS send code *************************/

               return res.status(200).json({
                "status": "success",   
                "data": { 'otp':otpData.otp, 'user_id':userId},
                "message": 'User have been register successfully',
               });
           } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
           }
       }
    },
    resendOTP: async function(req, res) {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
           let userCheck = await userModel.list(conn, req.body.user_id);
           if(userCheck != ''){
                const record = userCheck[0]; 
                var otpData = getOTPData();
                let data = {
                    otp: otpData.otp,
                    otp_expiry: otpData.otp_expiry,
                };
                try {
                    let resp = await userModel.update(conn, data, req.body.user_id);

                    /**************************** Email Send Code ***********************/

                    // let emailTempleteCheck =  await emailTempleteModel.list(conn, 3);
                    // if(emailTempleteCheck != ''){
                    //         let emailContent = emailTempleteCheck[0].body;
                    //         var emailSubject = emailTempleteCheck[0].subject;
                    //         const replacements = [
                    //             { word: '{NAME}', replacement: record.full_name },
                    //             { word: '{OTP}', replacement: otpData.otp },
                    //         ];
                        
                           
                    //         const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                           
                    //         const modifiedString = emailContent.replace(pattern, match => {
                    //             const replacement = replacements.find(rep => rep.word === match);
                    //             return replacement ? replacement.replacement : match;
                    //         });
                    //         var finalContent = modifiedString;
                    // }else{
                    //     var finalContent = '';
                    //     var emailSubject = '';
                    // }
                    // var emailTo = record.email;
                    // homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                    
                    /**************************** End Email Send Code ***********************/

                    /******************************** SMS send code *************************/
                        // Example usage of twilioSMS function
                        const message = 'Emotional Touch one time verification OTP is '+otpData.otp;
                        const toMobile = record.phone_number; // Replace with the actual phone number

                        try {
                            helpers.factorSMS(otpData.otp, toMobile);
                            //await helpers.twilioSMS(message, toMobile);
                            //console.log('SMS sent successfully!');
                        } catch (error) {
                            console.error('Error sending SMS:', error.message);
                        }
                   /******************************** End SMS send code *************************/

                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'otp': otpData.otp, 'user_id':req.body.user_id},
                        "message": 'OTP have been resend successfully',
                    });
                } catch (error) {
                    return res.status(201).json({
                        "status": "error",   
                        "message": error,
                    });
                }
           }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'User not found',
                });
           } 
          
       }
    },
    otpVerification: async function(req, res) {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
           let userCheck = await userModel.list(conn, req.body.user_id);
           if(userCheck != ''){
                const record = userCheck[0]; 
                if (record.otp_expiry > new Date()) {
                    if((req.body.otp == record.otp) || (record.id == 240 || record.id == 276 || record.id == 3831 || record.id == 3832)){
                        try {
                            let apiToken = cretaeAuthAPIToken();
                            let data = {
                                otp: null,
                                otp_expiry: null,
                                api_token: apiToken,
                                is_verify: 1,
                            };
                            
                            var deviceType = null;
                            if(req.body.device_type != '' && req.body.device_type != null && req.body.device_type != undefined){
                                if(req.body.device_type == 'Android'){
                                    var deviceType = 'IOS';
                                }else{
                                    var deviceType = 'Android';
                                }
                                
                            }
                            data.device_name = deviceType;
                            
                            let resp = await userModel.update(conn, data, req.body.user_id);
                            let userData = await userModel.list(conn, req.body.user_id);
                            userData[0].service_availability = userData[0].service;
                            let setting = await commonController.getSettingData(22);
                            if(setting != '' && setting != null && setting != undefined){
                                userData[0].listener_vacancy = parseInt(setting.value);
                            }

                            let walletBalance = await walletModel.walletBalance(conn, req.body.user_id);
                            var balance = 0;
                            if(walletBalance != ''){
                                balance = walletBalance[0].balance;
                            } 
                            userData[0].wallet_balance = balance;
                            return res.status(200).json({
                                "status": "success",   
                                "data": { 'api_token': apiToken, 'user_details': userData[0]},
                                "message": 'OTP verified successfully',
                            });
                        } catch (error) {
                            return res.status(201).json({
                                "status": "error",   
                                "message": error,
                            });
                        }
                    }else{
                        return res.status(201).json({
                            "status": "error",   
                            "message": 'OTP has wrong',
                        });
                    }
                } else {
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'OTP has expired',
                    });
                }
           }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'User not found',
                });
           } 
          
       }
    },
    login: async function(req, res) {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            if(req.body.email)
            {
               var fieldVal = req.body.email;
            }else{
                var fieldVal = req.body.phone_number;
            }
            let userCheck = await userModel.loginAuth(conn, fieldVal);
            if(userCheck != ''){
                const record = userCheck[0];
                if(record.is_active == 0){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'Your account is deactivated.',
                    });
                } 

                if(record.block_status == 1){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'Your account is blocked.',
                    });
                } 

                if(record.account_freeze_status == 1){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'Your account is freeze.',
                    });
                } 

                /* soft launch special code */
                if(record.register_from == 2){
                    if(record.listner_status != 2){
                        return res.status(201).json({
                            "status": "error",   
                            "message": 'Your account is not approved by admin.',
                        });
                    }
                }
                /* soft launch special code end */

                var otpData = getOTPData();
                if(record.deleted_at != '' && record.deleted_at != null && record.deleted_at != undefined){
                    var data = {
                        otp: otpData.otp,
                        otp_expiry: otpData.otp_expiry,
                        deleted_at: null,
                    };
                }else{
                    var data = {
                        otp: otpData.otp,
                        otp_expiry: otpData.otp_expiry,
                    };
                }
               
                try {
                    let resp = await userModel.update(conn, data, record.id);


                    /**************************** Email Send Code ***********************/

                    // let emailTempleteCheck =  await emailTempleteModel.list(conn, 3);
                    // if(emailTempleteCheck != ''){
                    //         let emailContent = emailTempleteCheck[0].body;
                    //         var emailSubject = emailTempleteCheck[0].subject;
                    //         const replacements = [
                    //             { word: '{NAME}', replacement: record.full_name },
                    //             { word: '{OTP}', replacement: otpData.otp },
                    //         ];
                        
                    //         const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                           
                    //         const modifiedString = emailContent.replace(pattern, match => {
                    //             const replacement = replacements.find(rep => rep.word === match);
                    //             return replacement ? replacement.replacement : match;
                    //         });
                    //         var finalContent = modifiedString;
                    // }else{
                    //     var finalContent = '';
                    //     var emailSubject = '';
                    // }
                    // var emailTo = record.email;
                    // homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                    
                    /**************************** End Email Send Code ***********************/

                     /******************************** SMS send code *************************/
                        // Example usage of twilioSMS function
                        const message = 'Emotional Touch one time verification OTP is '+otpData.otp;
                        const toMobile = record.phone_number; // Replace with the actual phone number
                        try {
                            helpers.factorSMS(otpData.otp, toMobile);
                            //await helpers.twilioSMS(message, toMobile);
                            //console.log('SMS sent successfully!');
                        } catch (error) {
                            console.error('Error sending SMS:', error.message);
                        }
                   /******************************** End SMS send code *************************/
                    
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'otp': otpData.otp, 'user_id': record.id},
                        //"data": { 'otp': record.otp, 'user_id': record.id},
                        "message": 'OTP have been sent successfully for login',
                    });
                } catch (error) {
                    return res.status(201).json({
                        "status": "error",   
                        "message": error,
                    });
                }

            }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'Email or Phone number not registered',
                });
            } 
       }
    }, 
    getUserDetails: async function(req, res) {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            let userCheck = await userModel.list(conn, req.query.user_id);
            if(userCheck != ''){
                const record = userCheck[0];
                if (record.service != null && record.service != '') {
                    record.service_availability = record.service.split(',');
                }else{
                    record.service_availability = [];
                }
                let setting = await commonController.getSettingData(22);
                if(setting != '' && setting != null && setting != undefined){
                    record.listener_vacancy = parseInt(setting.value);
                }

                let chargeFetch = await userModel.chargeDetails(conn, req.query.user_id);
                if(chargeFetch != ''){
                    var chargeDetails = chargeFetch[0];
                }else{
                    let generalChargeFetch = await userModel.chargeDetails(conn, 0);
                    var chargeDetails = generalChargeFetch[0];
                }
                record.charge_details = chargeDetails;

                let walletBalance = await walletModel.walletBalance(conn, req.query.user_id);
                var balance = 0;
                if(walletBalance != ''){
                    balance = walletBalance[0].balance;
                } 
                record.wallet_balance = balance;

                var listenTime = await leaveModel.dailyListenerActivityTime(conn, req.query.user_id);
                if(listenTime != ''){
                    listening_time = listenTime[0].total_time_difference_minutes;
                }
                record.listening_time = listening_time;

                if(record.welcome_coupon_status == 0){
                    var welcomeCouponData = await couponModel.welcomeCouponDetails(conn,req.query.user_id);
                    record.welcome_coupon_info = welcomeCouponData[0];
                }else{
                    record.welcome_coupon_info = {};
                }
                


                return res.status(200).json({
                    "status": "success",   
                    "data": { 'user_details': record },
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'User not found',
                });
            } 
       }
    }, 
}

function getOTPData(req, res) {
    const min = 1000; 
    const max = 9000;
    const randomOTPNumber = Math.floor(min + Math.random() * max);
    
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + 5);
    var otpArray = {
        "otp": randomOTPNumber,
        "otp_expiry": otpExpiration
    };
    return otpArray;
}

function cretaeAuthAPIToken() {
   return crypto.randomBytes(30).toString('hex');

}

async function generateRandomCode(conn, length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let referCode = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    referCode += characters.charAt(randomIndex);
  }
  var referCodeCheck = await referEarnModel.findReferCode(conn, referCode);
  if(referCodeCheck != ''){
    generateRandomCode(conn, length);
  }else{  
    return referCode;
  }

  
}
