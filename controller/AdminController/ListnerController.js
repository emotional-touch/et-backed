var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var adminModel = require("../../models/Admin");
var userModel = require("../../models/User");
var emailTempleteModel = require("../../models/EmailTemplete");
var notificationModel = require("../../models/Notification");
var walletModel = require("../../models/Wallet");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const moment = require('moment');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/users/list", { currentPath });
    },
    googleFormData: function(req, res) {
        const credentials = require(path.join(__dirname, '../../credentials.json'));
        // Create a new JWT client using the credentials.
        const jwtClient = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets']
        );
        
        // Replace with your spreadsheet ID.
        const spreadsheetId = '1470RcNuIG4wcRRVT01fhk3WXS5OAHfPcjlsM7Paztws';

        jwtClient.authorize((err) => {
          if (err) {
            console.error('JWT authorization error:', err);
            return;
          }
      
          sheets.spreadsheets.values.get({
            auth: jwtClient,
            spreadsheetId,
            range: 'A:D', // Adjust the range to match your data.
          }, (err, response) => {
            if (err) {
              console.error('API error:', err);
              return;
            }
      
            const values = response.data.values;

            if (values.length) {
              const specificEmailResponses = values.filter(value => value[3] === 'ravikoriya.nyusoft@gmail.com');
              //console.log('Responses for specific email ID:', specificEmailResponses);
              // Process the data (e.g., save it to a database, display it, etc.).
            } else {
              //console.log('No data found.');
            }
          });
        });
    },
    googleDocsWebhook: async function(req, res) {
      try {
        var resumeFileName = null;
        if (!req.files){
            var resumeFile = null;
        }else if(req.files.resume) {
            const uploadedFile = req.files.resume;
            var resumeFileName = 'resume_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
            const uploadPath = path.join(__dirname, '..', '..', 'public', 'uploads', 'resume', resumeFileName);
            var resumeFile = path.join(process.env.WEB_URL, 'public', 'uploads', 'resume', resumeFileName);
            uploadedFile.mv(uploadPath); 
        }


        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        var dob = req.body.dob;
        const ageData = moment().diff(moment(dob, 'YYYY-MM-DD'), 'years');
        var fullName =  req.body.full_name;
        var mobile = req.body.phone_number;
        var email = req.body.email;
        var gender = req.body.gender;
        var question1 = req.body.question_1;
        var question2 = req.body.question_2;
        var question3 = req.body.question_3;
        var question4 = req.body.question_4;
        var question5 = req.body.question_5;
        
        var dataJson = {
            formattedDate,
            fullName,
            mobile,
            email,
            dob,
            gender,
            question1,
            question2,
            question3,
            question4,
            question5,
            resumeFile,
        };

        // Convert the values of the object into an array
        var dataArray = Object.values(dataJson);
        var dataArrayJson = JSON.stringify(dataArray)

        let utcDate = new Date();

        // Add the time difference for IST (5 hours and 30 minutes)
        utcDate.setUTCHours(utcDate.getUTCHours() + 5);
        utcDate.setUTCMinutes(utcDate.getUTCMinutes() + 30);

        // Convert the UTC date to a string in ISO format and replace 'T' with a space
        let istTime = utcDate.toISOString().slice(0, 19).replace('T', ' ');

        let data = {
          full_name: fullName,
          phone_number: '+91'+mobile,
          dob: dob,
          age: ageData,
          gender: gender,
          about: question1,
          google_docs_status: 2,
          google_form_responce: JSON.stringify(dataArrayJson),
          listner_status: 1,
          docs_responce_date: istTime
        };
       
        var emailID = email;
        let userCheck = await userModel.loginAuth(conn, emailID);
        var userData = userCheck[0];
        let resp = await userModel.update(conn, data, userData.id);

        let emailTempleteCheck = await emailTempleteModel.list(conn, 2);
        if(emailTempleteCheck != ''){
             let emailContent = emailTempleteCheck[0].body;
             var emailSubject = emailTempleteCheck[0].subject;
             const replacements = [
                 { word: '{NAME}', replacement: userData.full_name },
                 { word: '{EMAIL}', replacement: userData.email },
             ];
            
            
             const pattern = new RegExp(replacements.map(rep => rep.word).join('|'), 'g');
            
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
        //console.log('webhook called successfully.');
        res.status(200).json({
            "status": "success",   
            "message": 'success',
        });
      } catch (error) {
          //console.log(error);
      }
    },
    listnerAccountRequestList: async function(req, res) {
      let listnerList = await userModel.listnerAccountRequestData(conn);
      var currentPath = req.path;
      res.render("admin/listner-account-request/listner-account-request", { listnerList, currentPath });
    },
    acceptAccountRequest: async function(req, res) {
      if(req.params.id){
          const userId = req.params.id;
          let userDetails = await userModel.userDetailsPanel(conn, userId);
          if(userDetails.length > 0){
              try {
                  var userInfo = userDetails[0];

                   /* soft launch special code */
                   var otpData = getOTPData();
                   var otp = otpData.otp;
                   /* soft launch special code end */

                  /**************************** Email Send Code ***********************/

                  let emailTempleteCheck =  await emailTempleteModel.list(conn, 5);
                  if(emailTempleteCheck != ''){
                          let emailContent = emailTempleteCheck[0].body;
                          var emailSubject = emailTempleteCheck[0].subject;
                          if(userInfo.register_from == 2){
                            var apkLink = process.env.ET_APP_LINK
                          }else{
                            var apkLink = process.env.ET_APP_LINK;
                          }
                          const replacements = [
                              { word: '{NAME}', replacement: userInfo.full_name },
                              { word: '{LINK}', replacement: apkLink },
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
                    user_type: 'listner',
                    listner_status: 2,
                    otp: otp,
                    api_token: null,
                    device_token: null,
                  };
                  let resp = await userModel.update(conn, data, userId);
                  /**************************** End Email Send Code ***********************/

                  req.flash('success', 'Account request have been accepted successfully.');
                  res.redirect('/admin/listener-account-request/list');
              } catch (error) {
                  req.flash('error', error);
                  res.redirect('/admin/listener-account-request/list');
              }
          }else{
              req.flash('error', 'User not found.');
              res.redirect('/admin/listener-account-request/list');
          }
      }else{
          req.flash('error', 'UserId is missing.');
          res.redirect('/admin/listener-account-request/list');
      }
    }, 
    rejectAccountRequest: async function(req, res) {
      if(req.params.id){
          const userId = req.params.id;
          let userDetails = await userModel.userDetailsPanel(conn, userId);
          if(userDetails.length > 0){
              try {
                  var userInfo = userDetails[0];

                  /**************************** Email Send Code ***********************/

                  let emailTempleteCheck =  await emailTempleteModel.list(conn, 6);
                  if(emailTempleteCheck != ''){
                          let emailContent = emailTempleteCheck[0].body;
                          var emailSubject = emailTempleteCheck[0].subject;
                          const replacements = [
                              { word: '{NAME}', replacement: userInfo.full_name },
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
                    listner_status: 3,
                  };
                  let resp = await userModel.update(conn, data, userId);
                  /**************************** End Email Send Code ***********************/

                  req.flash('success', 'Account request have been rejected successfully.');
                  res.redirect('/admin/listener-account-request/list');
              } catch (error) {
                  req.flash('error', error);
                  res.redirect('/admin/listener-account-request/list');
              }
          }else{
              req.flash('error', 'User not found.');
              res.redirect('/admin/listener-account-request/list');
          }
      }else{
          req.flash('error', 'UserId is missing.');
          res.redirect('/admin/listener-account-request/list');
      }
    }, 
    viewDocsDetails:async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let userDetails = await userModel.userDetailsPanel(conn, userId);
            if(userDetails.length > 0){
                var userInfo = userDetails[0];
                var docsInfo = JSON.parse(userInfo.google_form_responce);
                var docsData = JSON.parse(docsInfo);
                var currentPath = req.path;
                res.render("admin/listner-account-request/google-docs-details", { docsData, userId, currentPath });
            }else{
                req.flash('error', 'User not found.');
                res.redirect('/admin/listener-account-request/list');
            }
        }else{
            req.flash('error', 'UserId is missing.');
            res.redirect('/admin/listener-account-request/list');
        }
    }, 
    profileApprovalRequestList: async function(req, res) {
      let profileList = await userModel.profileApprovalRequestData(conn);
      var currentPath = req.path;
      res.render("admin/listner-account-request/listener-profile-approval-requests", { profileList, currentPath });
    },
    approveProfileRequest: async function(req, res) {
      if(req.params.id){
          const userId = req.params.id;
          let userDetails = await userModel.userDetailsPanel(conn, userId);
          if(userDetails.length > 0){
              try {
                  var userInfo = userDetails[0];

                  /**************************** Email Send Code ***********************/

                  let emailTempleteCheck =  await emailTempleteModel.list(conn, 8);
                  if(emailTempleteCheck != ''){
                          let emailContent = emailTempleteCheck[0].body;
                          var emailSubject = emailTempleteCheck[0].subject;
                          const replacements = [
                              { word: '{NAME}', replacement: userInfo.full_name },
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
                    profile_status: 2,
                  };
                  let resp = await userModel.update(conn, data, userId);


                   var walletBalance = await walletModel.walletBalance(conn, userId);
                    var walletData = {
                        'balance': 0,
                    };
                    var updateBalance = await walletModel.update(conn, walletData, walletBalance[0].id);
                  /**************************** End Email Send Code ***********************/

                    // notification code
                    var storeNotificationData = {
                        user_id:userId,
                        name:'Admin',
                        screen_type:'profile',
                        message:'Your profile have been approved by admin',
                        read_status: 0
                    };
                    let storeNotification = await notificationModel.insert(conn, storeNotificationData);

                  req.flash('success', 'Profile request have been approved successfully.');
                  res.redirect('/admin/profile-approval-request/list');
              } catch (error) {
                  req.flash('error', error);
                  res.redirect('/admin/profile-approval-request/list');
              }
          }else{
              req.flash('error', 'User not found.');
              res.redirect('/admin/profile-approval-request/list');
          }
      }else{
          req.flash('error', 'UserId is missing.');
          res.redirect('/admin/profile-approval-request/list');
      }
    }, 
    rejectProfileRequest: async function(req, res) {
      if(req.params.id){
          const userId = req.params.id;
          let userDetails = await userModel.userDetailsPanel(conn, userId);
          if(userDetails.length > 0){
              try {
                  var userInfo = userDetails[0];

                  /**************************** Email Send Code ***********************/

                  let emailTempleteCheck =  await emailTempleteModel.list(conn, 9);
                  if(emailTempleteCheck != ''){
                          let emailContent = emailTempleteCheck[0].body;
                          var emailSubject = emailTempleteCheck[0].subject;
                          const replacements = [
                              { word: '{NAME}', replacement: userInfo.full_name },
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
                    profile_status: 3,
                  };
                  let resp = await userModel.update(conn, data, userId);
                  /**************************** End Email Send Code ***********************/

                  req.flash('success', 'Profile request have been rejected successfully.');
                  res.redirect('/admin/profile-approval-request/list');
              } catch (error) {
                  req.flash('error', error);
                  res.redirect('/admin/profile-approval-request/list');
              }
          }else{
              req.flash('error', 'User not found.');
              res.redirect('/admin/profile-approval-request/list');
          }
      }else{
          req.flash('error', 'UserId is missing.');
          res.redirect('/admin/profile-approval-request/list');
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