var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var userModel = require("../../models/User");
var topicModel = require("../../models/Topic");
var indianLanguageModel = require("../../models/IndianLanguage");
var emailTempleteModel = require("../../models/EmailTemplete");
const commonController = require("../../controller/CommonController");
var walletModel = require("../../models/Wallet");
var referEarnModel = require("../../models/ReferEarn");
var leaveModel = require("../../models/Leave");
var WalletTransaction = require("../../models/WalletTransaction");
const helpers = require('../../helpers');
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/users/list", { currentPath });
    },
    userDetails: async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.adminUserDetailsPanel(conn, userId);
            if(userDetails.length > 0){
                var userInfo = userDetails[0];

                var redirectLink = '/admin/listener-management/list';
                var pageTitle = 'Listener Details';
                if(userInfo.user_type == 'user'){
                    var redirectLink = '/admin/users-management/list';
                    var pageTitle = 'User Details';
                }
                var walletBalance = await walletModel.walletBalance(conn, userId);
                var walletBalance = walletBalance[0];
                res.render("admin/users/user-details", { userInfo, walletBalance, redirectLink, pageTitle });
            }else{
                req.flash('error', 'User not found.');
                res.redirect('/admin/users-management/list');
            }
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/list');
        }
    },
    refundMoney:  async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.adminUserDetailsPanel(conn, userId);
            var userInfo = userDetails[0];
            res.render("admin/users/refund-money", { userId, userInfo });
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/list');
        }
    },
    postRefundMoney:  async function(req, res) {
        if(req.body.userId){
            const userId = req.body.userId;
            var refundAmount = req.body.refund_amount;

            var finalRefundAmount = parseInt(refundAmount);

            var userWalletBalance = await walletModel.walletBalance(conn, userId);
            var userBalance = parseInt(userWalletBalance[0].balance);

            var newBalance = userBalance + finalRefundAmount;
            var userWalletData = {
                'balance': newBalance,
            };
            var updateListnerBalance = await walletModel.update(conn, userWalletData, userWalletBalance[0].id);

            var transactionNumber = await helpers.transactionIdGenerator();
            var transactionData = {
                'wallet_id':userWalletBalance[0].id,
                'wallet_transaction_id': transactionNumber,
                'user_id':userId,
                'amount':finalRefundAmount,
                'transaction_type':'credit',
                'entry_type': 4,
                'description': 'The refund amount has been credited by the admin',
                'transaction_status': 'success'
            };
            var transactionEntry = await walletModel.storeWalleteTransaction(conn, transactionData);

            req.flash('success', 'User amount refunded successfully.');
            res.redirect('/admin/users-management/user-details/'+userId);
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/user-details/'+userId);
        }
    },
    userStatusAction: async function(req, res) {
        if(req.body.userId){
            const userId = req.body.userId;
            const status = req.body.status;
            let data = {
                is_active: status,
            };
            try {
                let resp = await userModel.update(conn, data, userId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'User status updated successfully',
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
                "message": 'UserId is missing',
            });
        }
    },
    userAccFreezeAction:  async function(req, res) {
        if(req.body.userId){
            const userId = req.body.userId;
            const status = req.body.status;
            
            if(status == 1){
                var message = 'freeze';
                var data = {
                    account_freeze_status: status,
                    api_token: null
                };
            }else{
                var message = 'unfreeze';
                var data = {
                    account_freeze_status: status,
                };
            }
            try {
                let resp = await userModel.update(conn, data, userId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Account '+message+' successfully',
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
                "message": 'UserId is missing',
            });
        }
    },
    userWalletFreezeAction:  async function(req, res) {
        if(req.body.userId){
            const userId = req.body.userId;
            const status = req.body.status;
            
            var data = {
                wallet_freeze_status: status,
            };
            if(status == 1){
                var message = 'freeze';
            }else{
                var message = 'unfreeze';
            }
            try {
                let resp = await userModel.update(conn, data, userId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Wallet '+message+' successfully',
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
                "message": 'UserId is missing',
            });
        }
    },
    deletedUserRecover:async function(req, res){
        const userId = req.params.id;
        var data = {
            deleted_at: null,
        };
        try {
            let resp = await userModel.update(conn, data, userId);
            req.flash('success', 'This account recover successfully.');
            res.redirect('back');
        } catch (error) {
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },
    deleteUser: async function(req, res) {
        const userId = req.params.id;
        //console.log(userId);
        let userCheck = await userModel.delete(conn, userId);
        if(userCheck != ''){
            req.flash('success', 'User Account deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    }, 
    softDeleteUser : async function(req, res) {
        const userId = req.params.id;
        let data = {
            deleted_at: new Date()
        };
        let userCheck = await userModel.update(conn, data, userId);
        if(userCheck != ''){
            req.flash('success', 'User Account deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    }, 
    googleDocsSent: async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.userDetailsPanel(conn, userId);
            if(userDetails.length > 0){
                try {
                    var userInfo = userDetails[0];

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

                    req.flash('success', 'Form link send successfully.');

                    var redirectLink = '/admin/listener-management/list';
                    if(userInfo.user_type == 'user'){
                        var redirectLink = '/admin/users-management/list';
                    }

                    res.redirect(redirectLink);
                } catch (error) {
                    req.flash('error', error);
                    var redirectLink = '/admin/listener-management/list';
                    if(userDetails[0].user_type == 'user'){
                        var redirectLink = '/admin/users-management/list';
                    }
                    res.redirect(redirectLink);
                }
            }else{
                req.flash('error', 'User not found.');
                res.redirect('/admin/users-management/list');
            }
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/list');
        }
    }, 
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/users/user-new", { currentPath });
    },
    userSave: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('erro', errorMessages);
                res.redirect('/admin/users-management/list');
        }else{
            if(req.body.userId){
                const userId = req.body.userId;

                let data = {
                    full_name: req.body.fullname,
                };

                try {
                    let resp = await userModel.update(conn, data, userId);
                    req.flash('success', 'User updated successfully.');
                    res.redirect('/admin/users-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/users-management/list');
                }
            }else{
                var userReferCode = await generateRandomCode(conn, 7);
                var otpData = getOTPData();
                let data = {
                    full_name: req.body.fullname,
                    email: req.body.email,
                    phone_number: '+91'+req.body.mobilenumber,
                    otp: otpData.otp,
                    otp_expiry: otpData.otp_expiry,
                    referral_code: userReferCode
                };
                try {
                    let resp = await userModel.insert(conn, data);

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

                    /**************************** Email Send Code ***********************/

                    let emailTempleteCheck =  await emailTempleteModel.list(conn, 14);
                    if(emailTempleteCheck != ''){
                            let emailContent = emailTempleteCheck[0].body;
                            var emailSubject = emailTempleteCheck[0].subject;
                            
                            const replacements = [
                                { word: '{NAME}', replacement: req.body.fullname },
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
                    var emailTo = req.body.email;
                    homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                    
                    req.flash('success', 'User added successfully.');
                    res.redirect('/admin/users-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/users-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.userDetailsPanel(conn, userId);
            if(userDetails.length > 0){
                var userInfo = userDetails[0];
                res.render("admin/users/user-new", { userInfo });
            }else{
                req.flash('error', 'User not found.');
                res.redirect('/admin/users-management/list');
            }
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/list');
        }
    }, 
    editListener: async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.userDetailsPanel(conn, userId);
            if(userDetails.length > 0){
                var userInfo = userDetails[0];
                let topicList = await topicModel.list(conn);
                let languages = await indianLanguageModel.list(conn);
                res.render("admin/users/edit-listener", { userInfo, topicList, languages });
            }else{
                req.flash('error', 'User not found.');
                res.redirect('/admin/users-management/list');
            }
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/users-management/list');
        }
    },
    saveListener: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
        
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('erro', errorMessages);
                res.redirect('/admin/users-management/list');
        }else{
            if(req.body.userId){
                const userId = req.body.userId;

                var service = req.body.service;
                var topic = req.body.topic_id;
                var language = req.body.language;
               
                if (Array.isArray(service)) {
                    service = service.join(',');
                }
                if (Array.isArray(topic)) {
                    topic = topic.join(',');
                }
                if (Array.isArray(language)) {
                    language = language.join(',');
                }
                
                var userDetails = await userModel.list(conn, userId);
                if(userDetails != ''){
                    var profileImage = userDetails[0].profile_photo;
                }else{
                    var profileImage = null;
                }

                if(userDetails != ''){
                    var selfiePhoto = userDetails[0].selfie_photo;
                }else{
                    var selfiePhoto = null;
                }

                if(userDetails != ''){
                    var idProofPhoto = userDetails[0].id_proof;
                }else{
                    var idProofPhoto = null;
                }
                if (req.files){
                    if (req.files.profile_photo) {
                        const uploadedFile = req.files.profile_photo;
                        const imgProfileName = 'user_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                        const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'users', imgProfileName);
                        var profileImage = path.join(process.env.WEB_URL, 'public', 'uploads', 'users', imgProfileName);
                        uploadedFile.mv(uploadPath); 
                    }

                    if (req.files.selfie_photo) {
                        const selfieFile = req.files.selfie_photo;
                        const selfieImageName = 'user_selfie_'+ Math.round(Math.random() * 1E9) + '_' + selfieFile.name;
                        const selfiePath = path.join(__dirname, '..', '..', 'public', 'uploads', 'users_selfie', selfieImageName);
                        var selfiePhoto = path.join(process.env.WEB_URL, 'public', 'uploads', 'users_selfie', selfieImageName);
                        selfieFile.mv(selfiePath); 
                    }

                    if (req.files.id_proof) {
                        const proofFile = req.files.id_proof;
                        const proofImageName = 'user_proof_'+ Math.round(Math.random() * 1E9) + '_' + proofFile.name;
                        const proofPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'users_proof', proofImageName);
                        var idProofPhoto = path.join(process.env.WEB_URL, 'public', 'uploads', 'users_proof', proofImageName);
                        proofFile.mv(proofPath); 
                    }
                }

                let data = {
                    profile_photo: profileImage,
                    full_name: req.body.full_name,
                    display_name: req.body.display_name,
                    gender: req.body.gender,
                    age: req.body.age,
                    topic_id: topic,
                    selfie_photo: selfiePhoto,
                    id_proof: idProofPhoto,
                    id_proof_name: req.body.id_proof_name,
                    service: service,
                    language: language,
                    about: req.body.about,
                    story: req.body.story,
                    availability: req.body.availability,
               };

                try {
                    let resp = await userModel.update(conn, data, userId);
                    req.flash('success', 'Listener updated successfully.');
                    var redirectLink = '/admin/listener-management/list';
                    if(userDetails[0].user_type == 'user'){
                        var redirectLink = '/admin/users-management/list';
                    }
                    res.redirect(redirectLink);
                } catch (error) {
                    req.flash('erro', error);
                    var redirectLink = '/admin/listener-management/list';
                    if(userDetails[0].user_type == 'user'){
                        var redirectLink = '/admin/users-management/list';
                    }
                    res.redirect(redirectLink);
                }
            }
        }
    },

    getUserList: async function(req, res) {
        var { page, pageSize, search, dataType, startDateUser, endDateUser } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        let userList = await userModel.userListPanel(conn, dataType, limit, offset, search, startDateUser, endDateUser);
        res.json(userList);
    },

    getRechargeTransaction: async function(req, res) {
        var { page, pageSize, search, userId, startDateRecharge, endDateRecharge } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        if(userId != ''){
            var rechargeTransaction = await WalletTransaction.getRechargeTransaction(conn, userId, limit, offset, search, startDateRecharge, endDateRecharge);
        }else{
            var rechargeTransaction = await WalletTransaction.getPaymentRechargeTransaction(conn, limit, offset, search, startDateRecharge, endDateRecharge);
        }
        
        res.json(rechargeTransaction);
    },

    getGiftTransaction: async function(req, res) {
        var { page, pageSize, search, userId, startDateGift, endDateGift  } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        if(userId != ''){
            var giftTransaction = await WalletTransaction.getGiftTransaction(conn, userId, limit, offset, search, startDateGift, endDateGift);
        }else{
            var giftTransaction = await WalletTransaction.getPaymentGiftTransaction(conn, limit, offset, search, startDateGift, endDateGift);
        }
        res.json(giftTransaction);
    },

    getServiceTransaction: async function(req, res) {
        var { page, pageSize, search, userId, startDateService, endDateService  } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        if(userId != ''){
            var serviceTransaction = await WalletTransaction.getServiceTransaction(conn, userId, limit, offset, search, startDateService, endDateService);
        }else{
            var serviceTransaction = await WalletTransaction.getPaymentServiceTransaction(conn, limit, offset, search, startDateService, endDateService);
        }
        res.json(serviceTransaction);
    },

    getRefundTransaction: async function(req, res) {
        var { page, pageSize, search, userId, startDateRefund, endDateRefund } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        var refundTransaction = await WalletTransaction.getRefundTransaction(conn, userId, limit, offset, search, startDateRefund, endDateRefund);
        
        res.json(refundTransaction);
    },

    getPayoutRecordTransaction: async function(req, res) {
        var { page, pageSize, search, userId, startDatePayout, endDatePayout } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        if(userId != ''){
            var payoutTransaction = await WalletTransaction.getPayoutRecordTransaction(conn, userId, limit, offset, search, startDatePayout, endDatePayout);
        }else{
            var payoutTransaction = await WalletTransaction.getPaymentPayoutRecordTransaction(conn, limit, offset, search, startDatePayout, endDatePayout);
        }
        res.json(payoutTransaction);
    },

    getLeavePenaltyRecord: async function(req, res) {
        var { page, pageSize, search, userId, startDateLeavePenalty, endDateLeavePenalty } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        var penaltyEntry = await leaveModel.getLeavePenaltyRecord(conn, userId, limit, offset, search, startDateLeavePenalty, endDateLeavePenalty);
        res.json(penaltyEntry);
    },

    getMissedPenaltyRecord: async function(req, res) {
        var { page, pageSize, search, userId, startDateMissedSessionPenalty, endDateMissedSessionPenalty } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        var missedSessionEntry = await leaveModel.getMissedPenaltyRecord(conn, userId, limit, offset, search, startDateMissedSessionPenalty, endDateMissedSessionPenalty);
        res.json(missedSessionEntry);
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