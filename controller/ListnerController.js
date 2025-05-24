var conn = require("../config/db");
var userModel = require("../models/User");
var leaveModel = require("../models/Leave");
var reportModel = require("../models/Report");
var activityLogModel = require("../models/ActivityLog");
var paneltyModel = require("../models/Penalty");
const homeController = require("../controller/HomeController");
var emailTempleteModel = require("../models/EmailTemplete");
var nickNameModel = require("../models/NickName");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    profileStepOne: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            if (!req.files){
                var profileImage = null;
            }else if (req.files.profile_photo) {
                const uploadedFile = req.files.profile_photo;
                const imgProfileName = 'user_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'users', imgProfileName);
                var profileImage = path.join(process.env.WEB_URL, 'public', 'uploads', 'users', imgProfileName);
                uploadedFile.mv(uploadPath); 
            }else{
                var profileImage = null;
            }
            if(req.authuser.profile_step < 1){
                var profileStep = 1;
            }else{
                var profileStep = req.authuser.profile_step;
            }
           let data = {
                profile_photo: profileImage,
                is_anonymous: req.body.is_anonymous,
                full_name: req.body.full_name,
                display_name: req.body.display_name,
                gender: req.body.gender,
                age: req.body.age,
                topic_id: req.body.topic_id,
                service: req.body.service,
                about: req.body.about,
                story: req.body.story,
                availability: req.body.availability,
                profile_step: profileStep,
           };
           try {
               let resp = await userModel.update(conn, data, req.authuser.id);
               let userInfo = await userModel.list(conn, req.authuser.id);
               return res.status(200).json({
                "status": "success",   
                "data": { 'user_details':userInfo[0] },
                "message": 'User profile save successfully',
               });
           } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
           }
       }
    },

    profileStepTwo: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            if (req.files.selfie_photo) {
                const uploadedFile = req.files.selfie_photo;
                const selfieImageName = 'user_selfie_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'users_selfie', selfieImageName);
                var selfieImage = path.join(process.env.WEB_URL, 'public', 'uploads', 'users_selfie', selfieImageName);
                uploadedFile.mv(uploadPath); 
            }else{
                var selfieImage = null;
            }
            if(req.authuser.profile_step < 2){
                var profileStep = 2;
            }else{
                var profileStep = req.authuser.profile_step;
            }
           let data = {
                selfie_photo: selfieImage,
                profile_step: profileStep,
           };
           try {
               let resp = await userModel.update(conn, data, req.authuser.id);
               let userInfo = await userModel.list(conn, req.authuser.id);
               return res.status(200).json({
                "status": "success",   
                "data": { 'user_details':userInfo[0] },
                "message": 'User profile save successfully',
               });
           } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
           }
       }
    },

    profileStepThree: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            if (req.files.id_proof) {
                const uploadedFile = req.files.id_proof;
                const proofImageName = 'user_proof_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'users_proof', proofImageName);
                var proofImage = path.join(process.env.WEB_URL, 'public', 'uploads', 'users_proof', proofImageName);
                uploadedFile.mv(uploadPath); 
            }else{
                var proofImage = null;
            }
            if(req.authuser.profile_step < 3){
                var profileStep = 3;
            }else{
                var profileStep = req.authuser.profile_step;
            }
           let data = {
                id_proof: proofImage,
                profile_step: profileStep,
                id_proof_name: req.body.id_proof_name,
                profile_status: 1,
           };
           try {
               let resp = await userModel.update(conn, data, req.authuser.id);
               let userInfo = await userModel.list(conn, req.authuser.id);
               var userData = userInfo[0];
               if(req.authuser.profile_status == 0 && req.authuser.profile_step < 3){
                     /**************************** Email Send Code ***********************/

                  let emailTempleteCheck =  await emailTempleteModel.list(conn, 7);
                  if(emailTempleteCheck != ''){
                          let emailContent = emailTempleteCheck[0].body;
                          var emailSubject = emailTempleteCheck[0].subject;
                          var routeProfile = process.env.WEB_URL+'admin/users-management/user-details/'+userData.id;
                          const replacements = [
                              { word: '{NAME}', replacement: userData.full_name },
                              { word: '{EMAIL}', replacement: userData.email },
                              { word: '{LINK}', replacement: routeProfile },
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
                  var emailTo = process.env.MAIL_ADMIN_ADDRESS;
                  homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                  /**************************** End Email Send Code ***********************/
               }
               return res.status(200).json({
                "status": "success",   
                "data": { 'user_details':userInfo[0] },
                "message": 'User profile save successfully',
               });
           } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
           }
       }
    },

    profileEdit:async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
           let userInfo = await userModel.list(conn, req.authuser.id);
            var userDetails = userInfo[0];
            if (!req.files){
                var profileImage = userDetails.profile_photo;
            }else if (req.files.profile_photo) {
                const uploadedFile = req.files.profile_photo;
                const imgProfileName = 'user_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'users', imgProfileName);
                var profileImage = path.join(process.env.WEB_URL, 'public', 'uploads', 'users', imgProfileName);
                uploadedFile.mv(uploadPath); 
            }else{
                var profileImage = userDetails.profile_photo;
            }
           let data = {
                profile_photo: profileImage,
                full_name: req.body.full_name,
                display_name: req.body.display_name,
                gender: req.body.gender,
                age: req.body.age,
                service: req.body.service,
                about: req.body.about,
                story: req.body.story,
           };
           try {
               let resp = await userModel.update(conn, data, req.authuser.id);
               let updatedUser = await userModel.list(conn, req.authuser.id);
               return res.status(200).json({
                "status": "success",   
                "data": { 'user_details':updatedUser[0] },
                "message": 'User profile updated successfully',
               });
           } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
           }
       }
    }, 

    reportAndBlock:async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
   
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
        }else{
            let userInfo = await userModel.list(conn, req.query.user_id);
            if(userInfo != ''){
                var userDetails = userInfo[0];
                var personType = 'User';
                if(userDetails.user_type == 'listner'){
                    var personType = 'Listener';
                }
                let reportInfo = await reportModel.findReport(conn, req.authuser.id, userDetails.id);
                if(reportInfo != ''){
                    return res.status(201).json({
                        "status": "error",   
                        "message": "The "+personType+" has been already blocked.",
                    });
                }
               
                if(req.query.user_id == req.authuser.id){
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'User id is invalid.',
                    });
                }

                // if(userDetails.block_status == 1){
                //     return res.status(201).json({
                //         "status": "error",   
                //         "message": 'This user already blocked.',
                //     });
                // }
                // let data = {
                //     block_status: 1,
                // };
                try {
                    // let blockUser = await userModel.update(conn, data, userDetails.id);
                    let reportData = {
                        report_by: req.authuser.id,
                        report_for: userDetails.id,
                    };
                    let saveReport = await reportModel.insert(conn, reportData);
                    /**************************** Email Send Code ***********************/

                        let emailTempleteCheck =  await emailTempleteModel.list(conn, 12);
                        if(emailTempleteCheck != ''){
                                let emailContent = emailTempleteCheck[0].body;
                                var emailSubject = emailTempleteCheck[0].subject;
                                var blokingUser = req.authuser.full_name;
                                
                                //var routeProfile = process.env.WEB_URL+'admin/users-management/user-details/'+userData.id;
                                const replacements = [
                                    { word: '{BLOCKED_USER}', replacement: userDetails.full_name },
                                    { word: '{BLOCKING_USER}', replacement: blokingUser },
                                    //{ word: '{LINK}', replacement: routeProfile },
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
                        var emailTo = process.env.MAIL_ADMIN_ADDRESS;
                        homeController.sendEmailData(res, emailTo, emailSubject, finalContent);

                    /**************************** End Email Send Code ***********************/

                     /**************************** Email Send Code ***********************/

                     let emailTempleteCheck1 =  await emailTempleteModel.list(conn, 13);
                     if(emailTempleteCheck1 != ''){
                            let emailContent1 = emailTempleteCheck1[0].body;
                            var emailSubject1 = emailTempleteCheck1[0].subject;
                            var nickName = await nickNameModel.filterNameFind(conn, userDetails.id, req.authuser.id);
                            const replacements = [
                                { word: '{NAME}', replacement: userDetails.full_name },
                                { word: '{USER}', replacement: nickName[0].full_name },
                            ];
                        
                            // Create a regular expression pattern that matches any of the words to replace
                            const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
                            // Use String.replace() with a callback function to handle the replacements
                            const modifiedString = emailContent1.replace(pattern, match => {
                                const replacement = replacements.find(rep => rep.word === match);
                                return replacement ? replacement.replacement : match;
                            });
                            var finalContent1 = modifiedString;
                     }else{
                         var finalContent1 = '';
                         var emailSubject1 = '';
                     }
                     var emailTo1 = userDetails.email;
                     homeController.sendEmailData(res, emailTo1, emailSubject1, finalContent1);

                 /**************************** End Email Send Code ***********************/
                    return res.status(200).json({
                        "status": "success",   
                        "message": personType+' block successfully.',
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
                    "message": 'User id not found.',
                });
            } 
        }
    }, 

    unblock:async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
   
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
        }else{
            let reportBy = req.authuser.id;
            let reportFor = req.query.user_id;
            let reportInfo = await reportModel.findReport(conn, reportBy, reportFor);
            if(reportInfo != ''){
                var requestDetails = reportInfo[0];
                if(req.authuser.user_type == 'listner'){
                    return res.status(201).json({
                        "status": "error",   
                        "message": "The user has been blocked by you, and you do not have the permission to unblock them.",
                    });
                }else if(requestDetails.status == '1'){
                    return res.status(201).json({
                        "status": "error",   
                        "message": "The user has been already unblocked.",
                    });
                }
                
                let reportData = {
                    status: '1',
                };
                try {
                    let unblockUserReport = await reportModel.update(conn, reportData, requestDetails.id);
                    // let unblockData = {
                    //     block_status: 0,
                    // };
                    // let unblockUser = await userModel.update(conn, unblockData, requestDetails.report_for);
                    return res.status(200).json({
                        "status": "success",   
                        "message": 'Account unblock successfully.',
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
                    "message": 'The block request you made could not be found.',
                });
            } 
        }
    }, 

    blockedUserList:async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
   
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
        }else{
            try {
                let userId = req.authuser.id;
                let blockUserInfo = await reportModel.findBlockedUser(conn, userId);
                if(blockUserInfo != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": blockUserInfo,
                        "message": 'success',
                    });
                }else{
                    return res.status(200).json({
                        "status": "success",   
                        "data": [],
                        "message": 'success',
                    });
                } 
            }catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            }
        }
    }, 

    logout: async function(req, res) { 
       let data = {
            api_token: null,
            device_token: null,
            socket_id: null,
            online_status: 0,
            last_seen: Date.now()
       };
       try {
           let resp = await userModel.update(conn, data, req.authuser.id);
           return res.status(200).json({
            "status": "success",   
            "message": 'User logout successfully',
           });
       } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
       }
    },

    deleteUserAccount: async function(req, res) {
        let data = {
            deleted_at: new Date()
       };
        let userCheck = await userModel.update(conn, data, req.authuser.id);
        if(userCheck != ''){
            return res.status(200).json({
                "status": "success",   
                "message": 'User Account deleted successfully. This account can be reactive by logging in three months',
            });
        }else{
            return res.status(201).json({
                "status": "error",   
                "message": 'User not found',
            });
        }
    },

    getAllListener: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            var userId = req.authuser.id;
            const page = req.query.page || 1;
            const limit = 5;
            const offset = (page - 1) * limit; 
            const search = req.query.search || '';
            const gender = req.query.gender || '';
            const language = req.query.language || '';
            var category = req.query.category || '';
            var service_type = req.query.service_type || '';
            const age_from = req.query.age_from || '';
            const age_to = req.query.age_to || '';

            if(service_type != '' && service_type != undefined){
                if (service_type.includes(',')) {
                    // If the input contains a comma, split it into an array
                    service_type = service_type.split(',').map(value => value.trim());
                } else {
                    // If there's a single value, convert it into an array
                    service_type = [service_type];
                }
            }

            if(category != '' && category != undefined){
                if (category.includes(',')) {
                    // If the input contains a comma, split it into an array
                    category = category.split(',').map(value => parseInt(value));
                } else {
                    // If there's a single value, convert it into an array
                    category = [parseInt(category)];
                }
            }
            var whereClause = '';
            var secondwhereClause = '';
            if (Array.isArray(service_type)) {
                var whereClause = service_type.map(param => `service LIKE '%${param}%'`).join(' AND ');
            }
            if (Array.isArray(category)) {
                var secondwhereClause = category.map(param => `topic_id LIKE '%${param}%'`).join(' AND ');
            }
           
            var filterArray = {
                'limit': limit,
                'offset': offset,
                'search': search,
                'gender': gender,
                'language': language,
                'category': category,
                'service_type': service_type,
                'age_from': age_from,
                'age_to': age_to
            };
            let paginateCount = await userModel.activeListenerPaginate(conn, userId, filterArray, whereClause, secondwhereClause);
            let lastPage = Math.ceil(paginateCount/limit);
            let listenerList = await userModel.activeListenerList(conn, userId, filterArray, whereClause, secondwhereClause);
            if(listenerList != ''){
                if (listenerList[0].id !== null && listenerList[0].id !== undefined) {
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'listener_list': listenerList, 'lastPage': lastPage, 'current_page': parseInt(page)},
                        "message": 'success',
                    });
                }else{
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'listener_list': [], 'lastPage': 1, 'current_page': parseInt(page)},
                        "message": 'success',
                    });
                }
            }else{
                return res.status(201).json({
                    "status": "success",   
                    "data": { 'listener_list': [], 'lastPage': 1, 'current_page': parseInt(page)},
                    "message": 'success',
                });
            } 
        }
    },

    listenerDetails: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            var userId = req.query.user_id;
            let listenerDetails = await userModel.listenerDetails(conn, userId);
            
            let chargeFetch = await userModel.chargeDetails(conn, userId);
            if(chargeFetch != ''){
                var chargeDetails = chargeFetch[0];
            }else{
                let generalChargeFetch = await userModel.chargeDetails(conn, 0);
                var chargeDetails = generalChargeFetch[0];
            }
            if(listenerDetails != ''){
                let reviewDetails = await userModel.listenerReviewDetails(conn, userId);
                let reviewList = await userModel.listenerReviewList(conn, userId);
                let reviewSeparateCount = await userModel.listenerReviewSeprateCount(conn, userId);
                var reviewCounter = {};
                var reviewData = {};
                var listeningHours = 0;
                var reviewListing = [];
                if(reviewDetails != ''){
                    if(reviewSeparateCount != ''){
                        reviewSeparateCount.forEach((person) => {
                            const key = `rating${person.rating}`; // Create the key based on the rating
                            const value = person.total_count; // Get the total count
                            reviewCounter[key] = value; 
                        });
                    }
                    reviewData = reviewDetails;
                    reviewListing = reviewList;
                }

                if(listenerDetails[0].topic_name != '' && listenerDetails[0].topic_name != undefined && listenerDetails[0].topic_name != null){
                    if (listenerDetails[0].topic_name.includes(',')) {
                        // If commas are present, split the string using commas
                        listenerDetails[0].topic_name = listenerDetails[0].topic_name.split(',').map(item => item.trim());
                    } else {
                        // If no commas are present, treat the input as a single value
                        listenerDetails[0].topic_name = [listenerDetails[0].topic_name.trim()];
                    }
                }else{
                    listenerDetails[0].topic_name = [];
                }

                let reportInfo = await reportModel.findReport(conn, req.authuser.id, userId);
                if(reportInfo != ''){
                    listenerDetails[0].block_status = 1;
                }else{
                    listenerDetails[0].block_status = 0;
                }
                var totalExp = await activityLogModel.totalListingHoursGet(conn, userId);
                listeningHours = totalExp[0].total_exp;
               
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'basic_details': listenerDetails[0], 'listening_hours':listeningHours, 'charge_details':chargeDetails, 'review_basic_data': reviewData[0], 'separate_review_count':reviewCounter, 'review_listing':reviewListing},
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'User details not found.',
                });
            } 
        }
    },

    getDashboardData: async function(req, res) {
        var userId = req.authuser.id;

        const currentDate = new Date();
        const options = { year: 'numeric', month: 'short' };
        const formattedDate = currentDate.toLocaleString('en-US', options);

        let leaveData = await leaveModel.leaveDetails(conn, userId);
        

        let settingLeaveData = await paneltyModel.details(conn, 2);
        let settingSessionData = await paneltyModel.details(conn, 1);

        var listening_time = '';
        var extra_leave_penalty_amount = settingLeaveData[0].penalty_amount;
        var session_missed_penalty_amount = settingSessionData[0].penalty_amount;
        var total_leaves = settingLeaveData[0].no;
        var taken_leaves = 0;
        var left_leaves = settingLeaveData[0].no;
        var extra_leaves = 0;
        var extra_leave_penalty = 0;
        var session_missed_no_for_penalty = settingSessionData[0].no;
        var session_missed = 0;
        var session_penalty = 0;
        var total_panelty = 0;
        var leave_list_data = [];

        let missedSessionData = await leaveModel.missedSessionDetails(conn, userId, session_missed_no_for_penalty);

        var listenTime = await leaveModel.dailyListenerActivityTime(conn, userId);
        if(listenTime != ''){
            listening_time = listenTime[0].total_time_difference_minutes;
        }
        if(leaveData != ''){
            taken_leaves = parseInt(leaveData.length);
            if(taken_leaves >= total_leaves){
                left_leaves = 0;
                extra_leaves = taken_leaves - total_leaves;
                extra_leave_penalty = extra_leave_penalty_amount * parseInt(extra_leaves);
            }else{
                left_leaves = total_leaves - taken_leaves;
            }
            leave_list_data = leaveData;
        }

        if(missedSessionData != ''){
            session_missed = parseInt(missedSessionData.length);
            session_penalty = session_missed * session_missed_penalty_amount;
            
        }

        total_panelty = parseInt(session_penalty) + parseInt(extra_leave_penalty);

        var dashboardPaneltyArray = {
            'listening_time': listening_time,
            'extra_leave_penalty_amount': extra_leave_penalty_amount,
            'session_missed_penalty_amount': session_missed_penalty_amount,
            'total_leaves': total_leaves,
            'taken_leaves': taken_leaves,
            'left_leaves': left_leaves,
            'extra_leaves': extra_leaves,
            'extra_leave_penalty': extra_leave_penalty,
            'session_missed': session_missed,
            'session_missed_no_for_penalty': session_missed_no_for_penalty,
            'session_penalty': session_penalty,
            'total_panelty': total_panelty,
            'leave_list_data': leave_list_data,
        };

        return res.status(200).json({
            "status": "success",   
            "data": dashboardPaneltyArray,
            "message": 'success',
        });
    },

    listenerInterestNotify: async function(req, res) {
        try {
            let userId = req.authuser.id;
            let data = {
                listener_interest_status: 1,
            };
            let notifyStatus = await userModel.update(conn, data, userId);
            if(notifyStatus != ''){
                return res.status(200).json({
                    "status": "success",   
                    "message": 'Your interest saved successfully',
                });
            }else{
                return res.status(201).json({
                    "status": "error",   
                    "message": 'Something went wrong',
                });
            } 
        }catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        }
    }, 

}