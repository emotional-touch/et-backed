var conn = require("../config/db");
var topicModel = require("../models/Topic");
var userModel = require("../models/User");
var chatModel = require("../models/Chat");
var reportModel = require("../models/Report");
var leaveModel = require("../models/Leave");
var nickNameModel = require("../models/NickName");
var emailTempleteModel = require("../models/EmailTemplete");
var chargeModel = require("../models/Charge");
var walletModel = require("../models/Wallet");
var payoutModel = require("../models/PayoutTable");
var settingModel = require("../models/Setting");
var referEarnModel = require("../models/ReferEarn");
var setting = require("../models/Setting");
var activityLogModel = require("../models/ActivityLog");
var giftAmountModel = require("../models/GiftAmount");
var serviceFeesModel = require("../models/ServiceFees");
var faqModel = require("../models/Faq");
var queryModel = require("../models/Query");
var notificationModel = require("../models/Notification");
var paneltyModel = require("../models/Penalty");
var couponModel = require("../models/Coupon");
const homeController = require("../controller/HomeController");
const { check, validationResult } = require('express-validator');
const admin = require('firebase-admin');
const path = require('path');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const helpers = require('../helpers');
require('dotenv').config();

module.exports = {
    getTopicList: async function(req, res) {
        let topicList = await topicModel.list(conn);
        if(topicList != ''){
            const record = topicList; 
            return res.status(200).json({
                "status": "success",   
                "data": { 'topic': record },
                "message": 'success',
            });
        }else{
            return res.status(201).json({
                "status": "error",   
                "message": 'Topic not found',
            });
        } 
    }, 

    sentGoogleDocs:  async function(req, res) {
        const userId = req.authuser.id;
        let userDetails = await userModel.userDetailsPanel(conn, userId);
        if(userDetails.length > 0){
            try {
                var userInfo = userDetails[0];
                if(userInfo.google_docs_status != 0){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'User have already requested for listener',
                    });
                }
                /**************************** Email Send Code ***********************/

                let emailTempleteCheck =  await emailTempleteModel.list(conn, 4);
               
                if(emailTempleteCheck != ''){
                        let emailContent = emailTempleteCheck[0].body;
                        var emailSubject = emailTempleteCheck[0].subject;
                        var moNo = userInfo.phone_number; 
                        // Remove all spaces
                        var mobile = moNo.replace(/ /g,'');

                        // If string starts with +, drop first 3 characters
                        if(moNo.slice(0,1)=='+'){
                            mobile = mobile.substring(3)
                        }
                        
                        var googleFormLink = process.env.GOOGLE_DOCS_FORM_LINK+'/'+userInfo.referral_code;
                        const replacements = [
                            { word: '{NAME}', replacement: userInfo.full_name },
                            { word: '{LINK}', replacement: googleFormLink },
                        ];
                        // Create a regular expression pattern that matches any of the words to replace
                        const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                        // Use String.replace() with a callback function to handle the replacements
                        const modifiedString = emailContent.replace(pattern, match => {
                            const replacement = replacements.find(rep => rep.word === match);
                            return replacement ? replacement.replacement : match;
                        });
                        var finalContent = modifiedString;
                }else{
                    var finalContent = '';
                    var emailSubject = '';
                }
                var emailTo = userInfo.email;
                homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                
                let data = {
                    google_docs_status: 1,
                };
                let resp = await userModel.update(conn, data, userId);
                /**************************** End Email Send Code ***********************/
                return res.status(200).json({
                    "status": "success",   
                    "message": 'Google Form link send successfully to your register email address',
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
    },

    getSettingData: async function(settingId) {
        try {
            let settingData = await setting.details(conn, settingId);
            /**************************** End Email Send Code ***********************/
            return settingData[0];
        } catch (error) {
            return false;
        }
    },

    getVersionData: async function(req,res){
        try {
            let versionList = await settingModel.versionlist(conn);
        
            /**************************** End Email Send Code ***********************/
            return res.status(200).json({
                "status": "success",   
                "data": { 'version_list': versionList },
                "message": 'success',
            });
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "data": { 'version_list': [] },
                "message": error,
            });
        }
    },

    servicePaymentInfo: async function(req, res) {
        try {
            const userId = req.authuser.id;
            let chargeFetch = await userModel.chargeDetails(conn, userId);
            if(chargeFetch != ''){
                var chargeDetails = chargeFetch[0];
            }else{
                let generalChargeFetch = await userModel.chargeDetails(conn, 0);
                var chargeDetails = generalChargeFetch[0];
            }
            /**************************** End Email Send Code ***********************/
            return res.status(200).json({
                "status": "success",   
                "data": { 'charge_details': chargeDetails },
                "message": 'success',
            });
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },

    chatCommonInfo: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
             const errorMessages = errors.array().map(error => error.msg);
             return res.status(201).json({
                 "status": "error",   
                 "message": errorMessages[0],
             });
        }else{
            try {
                const userId = req.authuser.id;
                const chatUserId = req.query.chat_user_id;
                var listBoxType = 'inbox';
                var freeMsgStatus = false;
                if(req.authuser.user_type == 'listner'){
                    let freeMsgCount = await activityLogModel.freeMessageCount(conn, userId, chatUserId);
                    if(freeMsgCount[0].free_msg_count < 2){
                        var freeMsgStatus = true;
                    }
                    let findListBoxType = await chatModel.dragOtherToInboxFind(conn, userId, chatUserId);
                    if (!findListBoxType) { 
                        var listBoxType = 'other';
                    }
                }
                let userCheck = await userModel.list(conn, chatUserId);
                var userInfo = {};
                if(userCheck != ''){
                    const record = userCheck[0];
                    let nickName = await nickNameModel.filterNameFind(conn, userId, chatUserId);
                    var fullName = record.full_name;
                    if(nickName != ''){
                        fullName = nickName[0].full_name;
                    }

                    let reportInfo = await reportModel.findReport(conn, userId, chatUserId);
                    if(reportInfo != ''){
                        var block_status = 1;
                    }else{
                        var block_status = 0;
                    }
                    
                    userInfo = {
                        'full_name': fullName,
                        'profile_photo': record.profile_photo,
                        'user_type': record.user_type,
                        'free_msg_status': freeMsgStatus,
                        'device_token': record.device_token,
                        'block_status': block_status,
                    };
                }
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'listBoxType': listBoxType, 'userInfo': userInfo },
                    "message": 'success',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        }
    },

    leaveSettlement: async function(req, res) {
        try {
            const currentDate = new Date();
            let listenerListWithLeave = await leaveModel.listenerWithLeave(conn); 
            if(listenerListWithLeave != ''){
                return res.status(200).json({
                    "status": "success",   
                    "message": currentDate+' Daily leave data added successfully',
                });
            }else{ 
                return res.status(200).json({
                    "status": "success",   
                    "message": currentDate+' Nothing to add in daily leave data',
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },

    monthlyLeaveSettlement: async function(req, res) {
        const currentDayDate = new Date();
        const currentDay = currentDayDate.getDate();

        // Check if the current date is 25
        if (currentDay === 25 || currentDay === 26) {
            try {
                const currentDate = new Date();
                let settingLeaveData = await paneltyModel.details(conn, 2);
                var penalty = settingLeaveData[0].penalty_amount;
                var freeLeaveCount = settingLeaveData[0].no;
                let listenerListWithLeave = await leaveModel.listenerWithMonthlyLeave(conn, penalty, freeLeaveCount); 
                if(listenerListWithLeave != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Monthly leave data added successfully',
                    });
                }else{ 
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Nothing to add in monthly leave data',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        }else{
            return res.status(200).json({
                "status": "error",   
                "message": 'Bro this crone is run only on 25th or 26th date of month',
            });
        }

    },

    monthlyMissedSessionSettlement: async function(req, res) {
        const currentDayDate = new Date();
        const currentDay = currentDayDate.getDate();

        // Check if the current date is 25
        if (currentDay === 25 || currentDay === 26) {
            try {
                const currentDate = new Date();
                let settingSessionData = await paneltyModel.details(conn, 1);
                var penalty = settingSessionData[0].penalty_amount;
                var sessionCount = settingSessionData[0].no;
                let listenerListWithMissedSession = await leaveModel.listenerWithMonthlyMissedSession(conn, penalty, sessionCount); 
                if(listenerListWithMissedSession != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Monthly missed session data added successfully',
                    });
                }else{ 
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Nothing to add in monthly missed session data',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        }else{
            return res.status(200).json({
                "status": "error",   
                "message": 'Bro this crone is run only on 25th or 26th date of month',
            });
        }
    },

    monthlyPayoutSettlement: async function(req, res) {
        const currentDayDate = new Date();
        const currentDay = currentDayDate.getDate();

        // Check if the current date is 25
        if (currentDay === 25 || currentDay === 26) {
            try {
                const currentDate = new Date();
                let payoutDataList = await payoutModel.list(conn);
                if(payoutDataList != ''){
                    payoutDataList.forEach(async payoutData => {
                        let payoutCheck = await payoutModel.payoutEntryCheck(conn, payoutData.listener_id);
                        var totalPanelty = parseInt(payoutData.leave_panelty_amt) +  parseInt(payoutData.session_miss_panelty_amt);
                        var netPayout = parseInt(payoutData.payout_amount) - parseInt(totalPanelty);
                        if(payoutCheck != ''){
                            var data = {
                                payout_amount : payoutData.payout_amount,
                                net_payout_amount : netPayout,
                                leave_panelty_amt : payoutData.leave_panelty_amt,
                                session_miss_panelty_amt : payoutData.session_miss_panelty_amt
                            };
                            var payoutDataStore = await payoutModel.update(conn, data, payoutData.listener_id);
                        }else{
                            var data = {
                                listener_id : payoutData.listener_id,
                                payout_amount	: payoutData.payout_amount,
                                net_payout_amount : netPayout,
                                leave_panelty_amt : payoutData.leave_panelty_amt,
                                session_miss_panelty_amt : payoutData.session_miss_panelty_amt
                            };
                            var payoutDataStore = await payoutModel.insert(conn, data); 
                        }
                    });
                   
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Monthly payout data added successfully',
                    });
                }else{
                    return res.status(200).json({
                        "status": "success",   
                        "message": currentDate+' Payout data not found',
                    });
                }
               
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        }else{
            return res.status(200).json({
                "status": "error",   
                "message": 'Bro this crone is run only on 25th or 26th date of month',
            });
        }
    },
    
    deletedUserSettlement: async function(req, res) {
        try {
            let deleteUsers = await userModel.deletedUserSettlement(conn); 
            const currentDate = new Date();
            if(deleteUsers != ''){
                return res.status(200).json({
                    "status": "success",   
                    "message": currentDate+' account data deleted successfully',
                });
            }else{ 
                return res.status(201).json({
                    "status": "error",   
                    "message": 'Something went wrong in user delete crone',
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },

    giftToListener: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                let listenerId = req.body.listener_id;
                let amount =  req.body.gift_amount;
                var paymentStatus = req.body.payment_status;
                let paymentId = req.body.payment_id;
                var errMsg = '';
                //console.log("gift api call")
               
                 // GST and Platform Fees Calculate
                let gst = await serviceFeesModel.list(conn, 'gst');
                var gstAmt = Math.round((parseInt(amount)*gst[0].fees_percentage)/100);

                //Capture pyment in razorpay
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY,
                    key_secret: process.env.RAZORPAY_SECRET_KEY
                });

                await razorpay.payments.fetch(paymentId)
                .then(async (responseData) => {
                    if (responseData.status === 'authorized') {
                        var captureAmount = amount + gstAmt;
                        var capturePaisa = captureAmount * 100;
                        await razorpay.payments.capture(paymentId, capturePaisa)
                        .then((response) => {
                            if (response.status === 'captured') {
                                //console.log('Payment captured successfully:', response);
                                paymentStatus = 'success';
                            } else {
                                console.error('Payment capture failed:', response);
                                paymentStatus = 'failed';
                                errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                            }
                        })
                        .catch((error) => {
                            console.error('Payment capture failed:', error);
                            try{
                                errMsg = error.error.description+'.Your deducted money is refunded into 5 bussiness days.';
                            }catch(error){
                                errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                            }
                            paymentStatus = 'failed';
                        });
        
                        /* 
                        * Admin Commission Calculate Start
                        */
                        let adminCommission = await serviceFeesModel.list(conn, 'service_fees');
                        var adminCommissionPercentage = adminCommission[0].fees_percentage;
                        let adminCommissionAmount = parseInt((parseInt(amount) * adminCommissionPercentage) / 100);
                        let finalAmountGifted = (parseInt(amount) - adminCommissionAmount);
                        /* 
                        * Admin Commission Calculate End
                        */
                        var walletAddAmt = finalAmountGifted;
        
                        let listenerCheck = await userModel.list(conn, listenerId);
                        //console.log(listenerCheck);
                        if(listenerCheck != ''){
                            var listnerWalletBalance = await walletModel.walletBalance(conn, listenerId);
                            var listnerBalance = parseInt(listnerWalletBalance[0].balance);
                            var newBalance = listnerBalance + parseInt(walletAddAmt);
                            var listnerWalletData = {
                                'balance': newBalance,
                            };
                            if(paymentStatus == 'success'){
                                var updateListnerBalance = await walletModel.update(conn, listnerWalletData, listnerWalletBalance[0].id);
                            }
                            var userNickName = await nickNameModel.filterNameFind(conn, listenerId, userId);
                            var transactionNumber = await helpers.transactionIdGenerator();
        
                            var transactionData = {
                                'wallet_id':listnerWalletBalance[0].id,
                                'wallet_transaction_id': transactionNumber,
                                'user_id':listenerId,
                                'gift_person_id': userId,
                                'amount':parseInt(walletAddAmt),
                                'gst': parseInt(gstAmt),
                                'transaction_type':'credit',
                                'entry_type': 2,
                                'description': 'Gift amout received from '+userNickName[0].full_name,
                                'transaction_id':paymentId, 
                                'transaction_status': paymentStatus,
                                'service_fee' : adminCommissionAmount
                            };
                            var transactionEntry = await walletModel.storeWalleteTransaction(conn, transactionData);
        
                            
                            var userWalletData = await walletModel.walletBalance(conn, userId);
                            var listenerNickName = await nickNameModel.filterNameFind(conn, userId, listenerId);
                            var transactionData1 = {
                                'wallet_id':userWalletData[0].id,
                                'wallet_transaction_id': transactionNumber,
                                'user_id':userId,
                                'gift_person_id': listenerId,
                                'amount':parseInt(amount),
                                'gst': parseInt(gstAmt),
                                'transaction_type':'debit',
                                'entry_type': 2,
                                'description': 'Gift amout sent to '+listenerNickName[0].full_name,
                                'transaction_id':paymentId, 
                                'transaction_status': paymentStatus,
                                'service_fee' : adminCommissionAmount
                            };
                            var transactionEntry1 = await walletModel.storeWalleteTransaction(conn, transactionData1);
        
                            if(paymentStatus == 'success'){
                                /**************************** Email Send Code ***********************/
        
                                let emailTempleteCheck =  await emailTempleteModel.list(conn, 19);
                            
                                if(emailTempleteCheck != ''){
                                        let emailContent = emailTempleteCheck[0].body;
                                        var emailSubject = emailTempleteCheck[0].subject;
                                    
                                        const replacements = [
                                            { word: '{NAME}', replacement: listenerCheck[0].full_name },
                                            { word: '{AMOUNT}', replacement: parseInt(walletAddAmt) },
                                            { word: '{USER_NAME}', replacement:  userNickName[0].full_name },
                                        ];
                                        // Create a regular expression pattern that matches any of the words to replace
                                        const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                        // Use String.replace() with a callback function to handle the replacements
                                        const modifiedString = emailContent.replace(pattern, match => {
                                            const replacement = replacements.find(rep => rep.word === match);
                                            return replacement ? replacement.replacement : match;
                                        });
                                        var finalContent = modifiedString;
                                }else{
                                    var finalContent = '';
                                    var emailSubject = '';
                                }
                                var emailTo = listenerCheck[0].email;
                                homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                                /**************************** End Email Send Code ***********************/
        
                                  // notification code
                                    var storeNotificationData = {
                                        user_id:listenerId,
                                        name:userNickName[0].full_name,
                                        screen_type:'wallet',
                                        message:'Gift amout received from '+userNickName[0].full_name,
                                        read_status: 0
                                    };
                                    let storeNotification = await notificationModel.insert(conn, storeNotificationData);
                            }
        
                            if(paymentStatus == 'success'){
                                //console.log('Gift amount sent by API');
                                return res.status(200).json({
                                    "status": "success",   
                                    "message": 'Gift amount sent to the listner successfully',
                                });
                            }else{
                                return res.status(201).json({
                                    "status": "error",   
                                    "message": errMsg,
                                });
                            }
                           
                        }else{
                            return res.status(201).json({
                                "status": "error",   
                                "message": 'Listener not found',
                            });
                        }
                    }else if(responseData.status === 'captured'){
                        return res.status(200).json({
                            "status": "success",   
                            "message": 'Gift amount sent to the listner successfully',
                        });
                    }else if(responseData.status === 'failed'){
                        return res.status(201).json({
                            "status": "error",   
                            "message": 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.',
                        });
                        
                    } 
                })
                .catch((error) => {
                    try{
                        errMsg = error.error.description;
                    }catch(error){
                        errMsg = 'Something went wrong.';
                    }
                    return res.status(201).json({
                        "status": "error",   
                        "message": errMsg,
                    });
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
       }
           
    },

    giftToListenerWebhook: async function(req, res) {
        try {
            const paymentData = req.body.payload.payment;
            // Extracting the notes object from the payment object
            const notesData = paymentData.entity.notes;
           
            if (notesData && typeof notesData === 'object' && 'listener_id' in notesData && notesData?.pay_type === 'gift') {
               
                // Extracting the recharge_amount from the notes object
                let userId = parseInt(notesData.user_id);
                let listenerId =  parseInt(notesData.listener_id);
                let amount = parseInt(notesData.gift_amount);
                let paymentId = paymentData.entity.id;
                var paymentStatus = '';
                var errMsg = '';
                
                // GST and Platform Fees Calculate
                let gst = await serviceFeesModel.list(conn, 'gst');
                var gstAmt = Math.round((parseInt(amount)*gst[0].fees_percentage)/100);

                //Capture pyment in razorpay
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY,
                    key_secret: process.env.RAZORPAY_SECRET_KEY
                });

                await razorpay.payments.fetch(paymentId)
                .then(async (responseData) => {
                  
                    if (responseData.status === 'authorized') { 
                        var captureAmount = amount + gstAmt;
                        var capturePaisa = captureAmount * 100;
                        await razorpay.payments.capture(paymentId, capturePaisa)
                        .then((response) => {
                            if (response.status === 'captured') {
                                //console.log('Payment captured successfully:', response);
                                paymentStatus = 'success';
                            } else {
                                console.error('Payment capture failed:', response);
                                paymentStatus = 'failed';
                                errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                            }
                        })
                        .catch((error) => {
                            console.error('Payment capture failed:', error);
                            try{
                                errMsg = error.error.description+'.Your deducted money is refunded into 5 bussiness days.';
                            }catch(error){
                                errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                            }
                            paymentStatus = 'failed';
                        });

                        /* 
                        * Admin Commission Calculate Start
                        */
                        let adminCommission = await serviceFeesModel.list(conn, 'service_fees');
                        var adminCommissionPercentage = adminCommission[0].fees_percentage;
                        let adminCommissionAmount = parseInt((parseInt(amount) * adminCommissionPercentage) / 100);
                        let finalAmountGifted = (parseInt(amount) - adminCommissionAmount);
                        /* 
                        * Admin Commission Calculate End
                        */
                        var walletAddAmt = finalAmountGifted;

                        let listenerCheck = await userModel.list(conn, listenerId);
                        //console.log(listenerCheck);
                        if(listenerCheck != ''){
                            var listnerWalletBalance = await walletModel.walletBalance(conn, listenerId);
                            var listnerBalance = parseInt(listnerWalletBalance[0].balance);
                            var newBalance = listnerBalance + parseInt(walletAddAmt);
                            var listnerWalletData = {
                                'balance': newBalance,
                            };
                            if(paymentStatus == 'success'){
                                var updateListnerBalance = await walletModel.update(conn, listnerWalletData, listnerWalletBalance[0].id);
                            }
                            var userNickName = await nickNameModel.filterNameFind(conn, listenerId, userId);
                            var transactionNumber = await helpers.transactionIdGenerator();

                            var transactionData = {
                                'wallet_id':listnerWalletBalance[0].id,
                                'wallet_transaction_id': transactionNumber,
                                'user_id':listenerId,
                                'gift_person_id': userId,
                                'amount':parseInt(walletAddAmt),
                                'gst': parseInt(gstAmt),
                                'transaction_type':'credit',
                                'entry_type': 2,
                                'description': 'Gift amout received from '+userNickName[0].full_name,
                                'transaction_id':paymentId, 
                                'transaction_status': paymentStatus,
                                'service_fee' : adminCommissionAmount
                            };
                            var transactionEntry = await walletModel.storeWalleteTransaction(conn, transactionData);

                            
                            var userWalletData = await walletModel.walletBalance(conn, userId);
                            var listenerNickName = await nickNameModel.filterNameFind(conn, userId, listenerId);
                            var transactionData1 = {
                                'wallet_id':userWalletData[0].id,
                                'wallet_transaction_id': transactionNumber,
                                'user_id':userId,
                                'gift_person_id': listenerId,
                                'amount':parseInt(amount),
                                'gst': parseInt(gstAmt),
                                'transaction_type':'debit',
                                'entry_type': 2,
                                'description': 'Gift amout sent to '+listenerNickName[0].full_name,
                                'transaction_id':paymentId, 
                                'transaction_status': paymentStatus,
                                'service_fee' : adminCommissionAmount
                            };
                            var transactionEntry1 = await walletModel.storeWalleteTransaction(conn, transactionData1);

                            if(paymentStatus == 'success'){
                                /**************************** Email Send Code ***********************/

                                let emailTempleteCheck =  await emailTempleteModel.list(conn, 19);
                            
                                if(emailTempleteCheck != ''){
                                        let emailContent = emailTempleteCheck[0].body;
                                        var emailSubject = emailTempleteCheck[0].subject;
                                    
                                        const replacements = [
                                            { word: '{NAME}', replacement: listenerCheck[0].full_name },
                                            { word: '{AMOUNT}', replacement: parseInt(walletAddAmt) },
                                            { word: '{USER_NAME}', replacement:  userNickName[0].full_name },
                                        ];
                                        // Create a regular expression pattern that matches any of the words to replace
                                        const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                        // Use String.replace() with a callback function to handle the replacements
                                        const modifiedString = emailContent.replace(pattern, match => {
                                            const replacement = replacements.find(rep => rep.word === match);
                                            return replacement ? replacement.replacement : match;
                                        });
                                        var finalContent = modifiedString;
                                }else{
                                    var finalContent = '';
                                    var emailSubject = '';
                                }
                                var emailTo = listenerCheck[0].email;
                                homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                                /**************************** End Email Send Code ***********************/

                                    // notification code
                                    var storeNotificationData = {
                                        user_id:listenerId,
                                        name:userNickName[0].full_name,
                                        screen_type:'wallet',
                                        message:'Gift amout received from '+userNickName[0].full_name,
                                        read_status: 0
                                    };
                                    let storeNotification = await notificationModel.insert(conn, storeNotificationData);
                            }

                            if(paymentStatus == 'success'){
                                //console.log('gift sent by webhook');
                                res.status(200).send('Gift amount sent to the listner successfully');
                            }else{
                                 res.status(200).send(errMsg);
                            }
                        }else{
                            res.status(200).send('Listener not found');
                        }
                    }else if(responseData.status === 'captured'){
                        res.status(200).send('Gift amount sent to the listner successfully');
                    }else if(responseData.status === 'failed'){
                        res.status(200).send('The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.');
                    }
                })
                .catch((error) => {
                    try{
                        errMsg = error.error.description;
                    }catch(error){
                        errMsg = 'Something went wrong.';
                    }
                    res.status(200).send(errMsg);
                });

                
            }
        } catch (error) {
            res.status(200).send(error);
        }   
    },
    
    getGiftAmount: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let gstFees = await serviceFeesModel.list(conn, 'gst');
                let gstFeesPercentage = gstFees[0].fees_percentage;
                let giftAmount = await giftAmountModel.apiGetGiftAmount(conn, gstFeesPercentage);
                if(giftAmount != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'gift_amount': giftAmount },
                        "message": 'success',
                    });
                }else{
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'gift_amount': [] },
                        "message": 'success',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
       }
           
    },

    rechargePayment: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
        }else{
            let userId = req.authuser.id;
            let rechargeAmount =  req.body.recharge_amount;
            let paymentId = req.body.payment_id;
            var paymentStatus = req.body.payment_status;
            let couponCode = req.body.coupon_code;
            var discountAmount = req.body.discount_amount;
            var errMsg = '';

            var couponId = '';
            if (req.body && req.body.coupon_id) {
                couponId = req.body.coupon_id;
            }

            // GST and Platform Fees Calculate
            let gst = await serviceFeesModel.list(conn, 'gst');
            var gstAmt = Math.round((parseInt(rechargeAmount)*gst[0].fees_percentage)/100);

            //Capture pyment in razorpay
             const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY,
                key_secret: process.env.RAZORPAY_SECRET_KEY
            });
            await razorpay.payments.fetch(paymentId)
            .then(async (responseData) => {
                if (responseData.status === 'authorized') { 
                    if(discountAmount != null && discountAmount != undefined && discountAmount != '' && discountAmount > 0){
                        var captureAmount = (rechargeAmount + gstAmt) - discountAmount;
                    }else{
                        var captureAmount = rechargeAmount + gstAmt;
                    }
                    var capturePaisa = captureAmount * 100;
                    await razorpay.payments.capture(paymentId, capturePaisa)
                    .then((response) => {
                        if (response.status === 'captured') {
                            //console.log('Payment captured successfully:', response);
                            paymentStatus = 'success';
                        } else {
                            console.error('Payment capture failed:', response);
                            paymentStatus = 'failed';
                            errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                        }
                    })
                    .catch((error) => {
                        try{
                            errMsg = error.error.description+'.Your deducted money is refunded into 5 bussiness days.';
                        }catch(error){
                            errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                        }
                        console.error('Payment capture failed:', error);
                        paymentStatus = 'failed';
                    });
                   
        
                    var walletAddAmt = parseInt(rechargeAmount);
        
                    let userCheck = await userModel.list(conn, userId);
                    if(userCheck != ''){
                        var userWalletBalance = await walletModel.walletBalance(conn, userId);
                        var userBalance = parseInt(userWalletBalance[0].balance);
                        var newBalance = userBalance + parseInt(walletAddAmt);
                        var userWalletData = {
                            'balance': newBalance,
                        };
                        if(paymentStatus == 'success'){
                            var updateUserBalance = await walletModel.update(conn, userWalletData, userWalletBalance[0].id);
                        }
                        var transactionDescription = 'Recharge amount credited to wallet '+walletAddAmt+' rupees.';
                        if(couponCode != '' && couponCode != null && couponCode != undefined){
                            var transactionDescription = 'Recharge amount credited to wallet '+walletAddAmt+' rupees. Applied coupon code '+ couponCode;
                        }
                        var transactionNumber = await helpers.transactionIdGenerator();
                        var transactionData = {
                            'wallet_id':userWalletBalance[0].id,
                            'wallet_transaction_id': transactionNumber,
                            'user_id':userId,
                            'amount':parseInt(walletAddAmt),
                            'gst': parseInt(gstAmt),
                            'transaction_type':'credit',
                            'entry_type': 1,
                            'description': transactionDescription,
                            'transaction_id':paymentId, 
                            'transaction_status': paymentStatus
                        };
                        var transactionEntry = await walletModel.storeWalleteTransaction(conn, transactionData);
        
                        if(paymentStatus == 'success'){
                            if(couponId != '' && couponId != undefined && couponId != null){
                                var countAdd = await couponModel.couponCountAdd(conn, couponId);
                                if(couponId == 8){
                                    let welcomeData = {
                                        welcome_coupon_status: 1,
                                    };
                                    let respwlc = await userModel.update(conn, welcomeData, userId);
                                }
                            }
                            /**************************** Email Send Code ***********************/
        
                            let emailTempleteCheck =  await emailTempleteModel.list(conn, 17);
                        
                            if(emailTempleteCheck != ''){
                                    let emailContent = emailTempleteCheck[0].body;
                                    var emailSubject = emailTempleteCheck[0].subject;
                                
                                    const replacements = [
                                        { word: '{NAME}', replacement: userCheck[0].full_name },
                                        { word: '{AMOUNT}', replacement: parseInt(walletAddAmt) },
                                        { word: '{GST}', replacement: gst[0].fees_percentage },
                                    ];
                                    // Create a regular expression pattern that matches any of the words to replace
                                    const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                    // Use String.replace() with a callback function to handle the replacements
                                    const modifiedString = emailContent.replace(pattern, match => {
                                        const replacement = replacements.find(rep => rep.word === match);
                                        return replacement ? replacement.replacement : match;
                                    });
                                    var finalContent = modifiedString;
                            }else{
                                var finalContent = '';
                                var emailSubject = '';
                            }
                            var emailTo = userCheck[0].email;
                            homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                            /**************************** End Email Send Code ***********************/
        
                            /*
                                Refer and Earn Code
                            */
                            if(parseInt(rechargeAmount) >= 100){
                                var checkReferalData =  await referEarnModel.findReferalData(conn, userId);
                                if(checkReferalData != ''){
                                    var referUserData = await userModel.list(conn, checkReferalData[0].refer_from);
                                    if(referUserData != ''){
                                        if(referUserData[0].user_type == 'user'){
                                            var referralAmt = await settingModel.referralAmt(conn);
                                            var referMoneyEarn = referralAmt[0].value;
                                            
                                        }else{
                                            var referralPer = await settingModel.referralPer(conn);
                                            var referralPer = referralPer[0].value; 
                
                                            var referMoneyEarn = ( parseInt(rechargeAmount) * parseInt(referralPer) ) / 100;
                
                                        }
                                        var referAwardAmount = Math.round(referMoneyEarn);
                                        var referWalletBalance = await walletModel.walletBalance(conn, referUserData[0].id);
                                        var referBalance = parseInt(referWalletBalance[0].balance);
                                        var newReferBalance = referBalance + parseInt(referAwardAmount);
                                        var referWalletData = {
                                            'balance': newReferBalance,
                                        };
                                        var updateReferBalance = await walletModel.update(conn, referWalletData, referWalletBalance[0].id);
                
                                    var referTransactionDescription = 'Refer amount credited to wallet '+parseInt(referAwardAmount)+' rupees.';
                                    var referTransactionData = {
                                            'wallet_id':referWalletBalance[0].id,
                                            'wallet_transaction_id': transactionNumber,
                                            'user_id':referUserData[0].id,
                                            'amount':parseInt(referAwardAmount),
                                            'transaction_type':'credit',
                                            'description': referTransactionDescription, 
                                            'transaction_status': 'success'
                                    };
                                    var referTransactionEntry = await walletModel.storeWalleteTransaction(conn, referTransactionData);
                
                                    var referUpdateData = {
                                            'referral_status': 'rewarded'
                                    };
                                    var referUpdateEntry = await referEarnModel.update(conn, referUpdateData, checkReferalData[0].id);
                
                                        /**************************** Email Send Code ***********************/
                
                                        let rEmailTempleteCheck =  await emailTempleteModel.list(conn, 18);
                                    
                                        if(rEmailTempleteCheck != ''){
                                                let rEmailContent = rEmailTempleteCheck[0].body;
                                                var rEmailSubject = rEmailTempleteCheck[0].subject;
                                            
                                                const replacements = [
                                                    { word: '{NAME}', replacement: referUserData[0].full_name },
                                                    { word: '{AMOUNT}', replacement: parseInt(referAwardAmount) },
                                                ];
                                                // Create a regular expression pattern that matches any of the words to replace
                                                const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                                // Use String.replace() with a callback function to handle the replacements
                                                const rModifiedString = rEmailContent.replace(pattern, match => {
                                                    const replacement = replacements.find(rep => rep.word === match);
                                                    return replacement ? replacement.replacement : match;
                                                });
                                                var rFinalContent = rModifiedString;
                                        }else{
                                            var rFinalContent = '';
                                            var rEmailSubject = '';
                                        }
                                        var rEmailTo = referUserData[0].email;
                                        homeController.sendEmailData(res, rEmailTo, rEmailSubject, rFinalContent);
                                        /**************************** End Email Send Code ***********************/
                                    }
                                }
                            }
                        }
                        if(paymentStatus == 'success'){
                            //console.log('recharge done by API');
                            return res.status(200).json({
                                "status": "success",   
                                "message": 'The recharge amount has been successfully added to the wallet',
                            });
                        }else{
                            return res.status(201).json({
                                "status": "error",   
                                "message": errMsg,
                            });
                        }
                       
                    }else{
                        return res.status(201).json({
                            "status": "error",   
                            "message": 'User not found',
                        });
                    }
                }else if(responseData.status === 'captured'){
                    return res.status(200).json({
                        "status": "success",   
                        "message": 'The recharge amount has been successfully added to the wallet',
                    });
                }else if(responseData.status === 'failed'){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.',
                    });
                    
                }
            })
            .catch((error) => {
                try{
                    errMsg = error.error.description;
                }catch(error){
                    errMsg = 'Something went wrong.';
                }
                return res.status(201).json({
                    "status": "error",   
                    "message": errMsg,
                });
            });

            
        }    
    },

    rechargePaymentWebhook: async function(req, res) {
        const paymentData = req.body.payload.payment;
        // Extracting the notes object from the payment object
        const notesData = paymentData.entity.notes;
        if (notesData && typeof notesData === 'object' && 'user_id' in notesData && notesData?.pay_type === 'recharge') {
            // Extracting the recharge_amount from the notes object
            let userId = parseInt(notesData.user_id);
            let rechargeAmount = parseInt(notesData.recharge_amount);
            let paymentId = paymentData.entity.id;
            var paymentStatus = '';
            let couponCode = notesData.coupon_code;
            var discountAmount = notesData.discount_amount;
            var errMsg = '';

            var couponId = '';
            if (notesData.coupon_id) {
                couponId = notesData.coupon_id;
            }

            // GST and Platform Fees Calculate
            let gst = await serviceFeesModel.list(conn, 'gst');
            var gstAmt = Math.round((parseInt(rechargeAmount)*gst[0].fees_percentage)/100);

            //Capture pyment in razorpay
            const razorpay = new Razorpay({
                key_id: process.env.RAZORPAY_KEY,
                key_secret: process.env.RAZORPAY_SECRET_KEY
            });

            await razorpay.payments.fetch(paymentId)
            .then(async (responseData) => {
                if (responseData.status === 'authorized') {
                    if(discountAmount != null && discountAmount != undefined && discountAmount != '' && parseInt(discountAmount) > 0){
                        var captureAmount = (rechargeAmount + gstAmt) - parseInt(discountAmount);
                    }else{
                        var captureAmount = rechargeAmount + gstAmt;
                    }
                    var capturePaisa = captureAmount * 100;
                    await razorpay.payments.capture(paymentId, capturePaisa)
                    .then((response) => {
                        if (response.status === 'captured') {
                            //console.log('Payment captured successfully:', response);
                            paymentStatus = 'success';
                        } else {
                            console.error('Payment capture failed:', response);
                            paymentStatus = 'failed';
                            errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                        }
                    })
                    .catch((error) => {
                        try{
                            errMsg = error.error.description+'.Your deducted money is refunded into 5 bussiness days.';
                        }catch(error){
                            errMsg = 'The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.';
                        }
                        console.error('Payment capture failed:', error);
                        paymentStatus = 'failed';
                    });
                    
        
                    var walletAddAmt = parseInt(rechargeAmount);
        
                    let userCheck = await userModel.list(conn, userId);
                    if(userCheck != ''){
                        var userWalletBalance = await walletModel.walletBalance(conn, userId);
                        var userBalance = parseInt(userWalletBalance[0].balance);
                        var newBalance = userBalance + parseInt(walletAddAmt);
                        var userWalletData = {
                            'balance': newBalance,
                        };
                        if(paymentStatus == 'success'){
                            var updateUserBalance = await walletModel.update(conn, userWalletData, userWalletBalance[0].id);
                        }
                        var transactionDescription = 'Recharge amount credited to wallet '+walletAddAmt+' rupees.';
                        if(couponCode != '' && couponCode != null && couponCode != undefined){
                            var transactionDescription = 'Recharge amount credited to wallet '+walletAddAmt+' rupees. Applied coupon code '+ couponCode;
                        }
                        var transactionNumber = await helpers.transactionIdGenerator();
                        var transactionData = {
                            'wallet_id':userWalletBalance[0].id,
                            'wallet_transaction_id': transactionNumber,
                            'user_id':userId,
                            'amount':parseInt(walletAddAmt),
                            'gst': parseInt(gstAmt),
                            'transaction_type':'credit',
                            'entry_type': 1,
                            'description': transactionDescription,
                            'transaction_id':paymentId, 
                            'transaction_status': paymentStatus
                        };
                        var transactionEntry = await walletModel.storeWalleteTransaction(conn, transactionData);
        
                        if(paymentStatus == 'success'){
                            if(couponId != '' && couponId != undefined && couponId != null){
                                var countAdd = await couponModel.couponCountAdd(conn, couponId);
                                if(couponId == 8){
                                    let welcomeData = {
                                        welcome_coupon_status: 1,
                                    };
                                    let respwlc = await userModel.update(conn, welcomeData, userId);
                                }
                            }
                            /**************************** Email Send Code ***********************/
        
                            let emailTempleteCheck =  await emailTempleteModel.list(conn, 17);
                        
                            if(emailTempleteCheck != ''){
                                    let emailContent = emailTempleteCheck[0].body;
                                    var emailSubject = emailTempleteCheck[0].subject;
                                
                                    const replacements = [
                                        { word: '{NAME}', replacement: userCheck[0].full_name },
                                        { word: '{AMOUNT}', replacement: parseInt(walletAddAmt) },
                                        { word: '{GST}', replacement: gst[0].fees_percentage },
                                    ];
                                    // Create a regular expression pattern that matches any of the words to replace
                                    const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                    // Use String.replace() with a callback function to handle the replacements
                                    const modifiedString = emailContent.replace(pattern, match => {
                                        const replacement = replacements.find(rep => rep.word === match);
                                        return replacement ? replacement.replacement : match;
                                    });
                                    var finalContent = modifiedString;
                            }else{
                                var finalContent = '';
                                var emailSubject = '';
                            }
                            var emailTo = userCheck[0].email;
                            homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                            /**************************** End Email Send Code ***********************/
        
                            /*
                                Refer and Earn Code
                            */
                            if(parseInt(rechargeAmount) >= 100){
                                var checkReferalData =  await referEarnModel.findReferalData(conn, userId);
                                if(checkReferalData != ''){
                                    var referUserData = await userModel.list(conn, checkReferalData[0].refer_from);
                                    if(referUserData != ''){
                                        if(referUserData[0].user_type == 'user'){
                                            var referralAmt = await settingModel.referralAmt(conn);
                                            var referMoneyEarn = referralAmt[0].value;
                                            
                                        }else{
                                            var referralPer = await settingModel.referralPer(conn);
                                            var referralPer = referralPer[0].value; 
                
                                            var referMoneyEarn = ( parseInt(rechargeAmount) * parseInt(referralPer) ) / 100;
                
                                        }
                                        var referAwardAmount = Math.round(referMoneyEarn);
                                        var referWalletBalance = await walletModel.walletBalance(conn, referUserData[0].id);
                                        var referBalance = parseInt(referWalletBalance[0].balance);
                                        var newReferBalance = referBalance + parseInt(referAwardAmount);
                                        var referWalletData = {
                                            'balance': newReferBalance,
                                        };
                                        var updateReferBalance = await walletModel.update(conn, referWalletData, referWalletBalance[0].id);
                
                                    var referTransactionDescription = 'Refer amount credited to wallet '+parseInt(referAwardAmount)+' rupees.';
                                    var referTransactionData = {
                                            'wallet_id':referWalletBalance[0].id,
                                            'wallet_transaction_id': transactionNumber,
                                            'user_id':referUserData[0].id,
                                            'amount':parseInt(referAwardAmount),
                                            'transaction_type':'credit',
                                            'description': referTransactionDescription, 
                                            'transaction_status': 'success'
                                    };
                                    var referTransactionEntry = await walletModel.storeWalleteTransaction(conn, referTransactionData);
                
                                    var referUpdateData = {
                                            'referral_status': 'rewarded'
                                    };
                                    var referUpdateEntry = await referEarnModel.update(conn, referUpdateData, checkReferalData[0].id);
                
                                        /**************************** Email Send Code ***********************/
                
                                        let rEmailTempleteCheck =  await emailTempleteModel.list(conn, 18);
                                    
                                        if(rEmailTempleteCheck != ''){
                                                let rEmailContent = rEmailTempleteCheck[0].body;
                                                var rEmailSubject = rEmailTempleteCheck[0].subject;
                                            
                                                const replacements = [
                                                    { word: '{NAME}', replacement: referUserData[0].full_name },
                                                    { word: '{AMOUNT}', replacement: parseInt(referAwardAmount) },
                                                ];
                                                // Create a regular expression pattern that matches any of the words to replace
                                                const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                                                // Use String.replace() with a callback function to handle the replacements
                                                const rModifiedString = rEmailContent.replace(pattern, match => {
                                                    const replacement = replacements.find(rep => rep.word === match);
                                                    return replacement ? replacement.replacement : match;
                                                });
                                                var rFinalContent = rModifiedString;
                                        }else{
                                            var rFinalContent = '';
                                            var rEmailSubject = '';
                                        }
                                        var rEmailTo = referUserData[0].email;
                                        homeController.sendEmailData(res, rEmailTo, rEmailSubject, rFinalContent);
                                        /**************************** End Email Send Code ***********************/
                                    }
                                }
                            }
                        }
                    
                        if(paymentStatus == 'success'){
                            //console.log('recharge done by webhook');
                            res.status(200).send('The recharge amount has been successfully added to the wallet.');
                        }else{
                            res.status(200).send('Error in recharge webhook call.');
                        }
                    
                    }else{
                        res.status(200).send('user not found.');
                    } 
                }else if(responseData.status === 'captured'){
                    res.status(200).send('The recharge amount has been successfully added to the wallet');
                }else if(responseData.status === 'failed'){
                    res.status(200).send('The transaction you attempted failed, your deducted money is refunded into 5 bussiness days.');
                }
            })
            .catch((error) => {
                try{
                    errMsg = error.error.description;
                }catch(error){
                    errMsg = 'Something went wrong.';
                }
                res.status(200).send(errMsg);
            });
        }  
    },

    contactBoatQuestion: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                var userType = req.authuser.user_type;

                let getQuestions = await faqModel.contactBoatQuestion(conn, userType);
                getQuestions.forEach((element, index) => {
                    var queAnsArray = JSON.parse(element.faqs);
                    getQuestions[index].faqs = queAnsArray;
                });
                if(getQuestions != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'contact_boat_question': getQuestions },
                        "message": 'success',
                    });
                }else{
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'contact_boat_question': [] },
                        "message": 'success',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
       }
           
    },

    querySubmit: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                let userType = req.authuser.user_type;
                var queryData = {
                    'user_type': userType,
                    'submited_by': userId,
                    'query': req.body.query,
                    'status': '0',
                };
                let querySubmit = await queryModel.insert(conn, queryData);

                var userDataType = 'listener';
                var emailId = process.env.LISTENER_SUPPORT_EMAIL;
                if(userType == 'user'){
                    userDataType = 'user';
                    emailId = process.env.USER_SUPPORT_EMAIL;
                }

                /**************************** Email Send Code ***********************/

                    let emailTempleteCheck =  await emailTempleteModel.list(conn, 20);
                    
                    if(emailTempleteCheck != ''){
                        let emailContent = emailTempleteCheck[0].body;
                        var emailSubject = emailTempleteCheck[0].subject;
                    
                        const replacements = [
                        { word: '{USERTYPE}', replacement: userDataType },
                        { word: '{NAME}', replacement: req.authuser.full_name },
                        { word: '{QUERY}', replacement: req.body.query },
                        ];
                        // Create a regular expression pattern that matches any of the words to replace
                        const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                        // Use String.replace() with a callback function to handle the replacements
                        const modifiedString = emailContent.replace(pattern, match => {
                        const replacement = replacements.find(rep => rep.word === match);
                        return replacement ? replacement.replacement : match;
                        });
                        var finalContent = modifiedString;
                    }else{
                        var finalContent = '';
                        var emailSubject = '';
                    }
                    var emailTo = emailId;
                    homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                /**************************** End Email Send Code ***********************/

                return res.status(200).json({
                    "status": "success",   
                    "message": 'Query submited successfully.',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },

    getNotifications: async function(req, res) {
        try {
            var userId = req.authuser.id;

            let getNotification = await notificationModel.list(conn, userId);
            if(getNotification != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'notifications': getNotification },
                    "message": 'success',
                });
            }else{
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'notifications': [] },
                    "message": 'success',
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },

    getNotificationCount: async function(req, res) {
        try {
            var userId = req.authuser.id;

            let getNotificationCount = await notificationModel.listCount(conn, userId);
            if(getNotificationCount != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'notification_count': getNotificationCount[0].count },
                    "message": 'success',
                });
            }else{
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'notification_count': 0 },
                    "message": 'success',
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },

    readNotification: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                var notificationId = req.body.notification_id;
                var notificationData = {
                    'read_status': 1,
                };
                let notificationDataSubmit = await notificationModel.update(conn, notificationId, notificationData);
                return res.status(200).json({
                    "status": "success",   
                    "message": 'Read status changed successfully.',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },

    storeDeviceToken: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                var queryData = {
                    'device_token': req.body.device_token,
                };
                let storeToken = await userModel.update(conn, queryData, userId);

                return res.status(200).json({
                    "status": "success",   
                    "message": 'Device token store successfully.',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },

    pushNotificationSent: async function(data) {
        var userId = data.toId;
        var senderData = await userModel.list(conn, data.fromId);
        let receiverData = await userModel.list(conn, userId);
        var registrationToken = receiverData[0].device_token;
        //var registrationToken = 'doCuY25sRH2UYtGy8fg14M:APA91bGbVoLVy96ZJwpi9yclpTCYJCexEpekhUmcG_OSYacYwQjGf3U3JWHwoMkt4dthEY3Bw3lhffjYAXjN4C6S39TFA6hKF8g5NxthvfKWVN7p-vTjQYZO66O2iKjMhROQ6oyBxNEV';
        if(registrationToken != '' && registrationToken != undefined && registrationToken != null){
            try {
                if (!admin.apps.length) {
                    var serviceAccount = require(path.join(__dirname, '..', 'public', 'apk', 'serviceAccountKey.json'));
                    admin.initializeApp({
                        credential: admin.credential.cert(serviceAccount)
                    });
                }

                var fromNickName = await nickNameModel.filterNameFind(conn, data.toId, data.fromId);
                fromNickName = fromNickName[0].full_name;

                var titleMessage = 'Chat Request';
                var bodyMessage = fromNickName+' has sent you a chat request';
                if(data.serviceType == 'vcall'){
                    titleMessage = 'Video Call Request';
                    bodyMessage = fromNickName+' has sent you a video call request';
                }else if(data.serviceType == 'call'){
                    titleMessage = 'Audio Call Request';
                    bodyMessage = fromNickName+' has sent you an audio call request';
                }

                // This registration token would come from the client app
                if(senderData[0].profile_photo != null && senderData[0].profile_photo != undefined && senderData[0].profile_photo != ''){
                    var pushData = {
                        user_id: "'"+senderData[0].id+"'",
                        profile_photo: senderData[0].profile_photo,
                    };
                }else{
                    var pushData = {
                        user_id: "'"+senderData[0].id+"'",
                    };
                }
                //console.log(pushData);
                var message = {
                    data : pushData,
                    notification: {
                        title: titleMessage,
                        body: bodyMessage,
                    },
                    token: registrationToken, // Provide the device token here
                    android: {
                        priority: 'high' // Set the priority to 'high'
                    },
                    apns: {
                        payload: {
                            aps: {
                            contentAvailable: true, // This is equivalent to high priority for iOS
                            },
                        },
                    },
                };
                // Send the notification
                var sendnoti = admin.messaging().send(message)
                .then((response) => {
                    //console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
                //console.log(sendnoti);
                return true;
            } catch (error) {
                //console.log('error'+ error);
                return true;
            } 
        }else{
            return true;
        }
    },

    storeUpi: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                var queryData = {
                    'upi_id': req.body.upi_id,
                };
                let storeUPI = await userModel.update(conn, queryData, userId);

                return res.status(200).json({
                    "status": "success",   
                    "message": 'UPI id saved successfully.',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },

    getUPIDetails: async function(req, res) {
        try {
            var userId = req.authuser.id;
            let settingValue =  await setting.details(conn, 30);
            let getUPIDetails = await userModel.list(conn, userId);
            if(getUPIDetails != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 
                        'upi_option_status': parseInt(settingValue[0].value),
                        'upi_id': getUPIDetails[0].upi_id
                    },
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    },
}