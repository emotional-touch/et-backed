var conn = require("../config/db");
var userModel = require("../models/User");
var contactModel = require("../models/Contact");
var PageModel = require("../models/Page");
var faqModel = require("../models/Faq");
var emailTempleteModel = require("../models/EmailTemplete");
var referEarnModel = require("../models/ReferEarn");
var walletModel = require("../models/Wallet");
const { check, validationResult } = require('express-validator');
const transporter = require('../config/nodemailer');
const path = require('path');
require('dotenv').config();

module.exports = {
    listnerFormSubmit:async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            var dataArray = {
                "status": "error",   
                "message": errorMessages,
            };
            return res.status(201).json({ dataArray });
       }else{
           var userReferCode = await generateRandomCode(conn, 7);
           let data = {
               user_type: 'listner',
               full_name: req.body.FullName,
               email: req.body.email,
               phone_number: '+91'+req.body.phoneNumber,
               message: req.body.message,
               is_verify: 0,
               register_from: 2,
               referral_code: userReferCode
           };
           try {
               let resp = await userModel.insert(conn, data);

               var userId = resp.insertId;
               var welcomeBonus = 0;
               var walleteData = {
                   'user_id': userId,
                   'balance': welcomeBonus
               };
               var walletBalanceAdd =  await walletModel.storeWalleteBalance(conn, walleteData); 

               let emailTempleteCheck = await emailTempleteModel.list(conn, 1);
               if(emailTempleteCheck != ''){
                    let emailContent = emailTempleteCheck[0].body;
                    var emailSubject = emailTempleteCheck[0].subject;
                    const replacements = [
                        { word: '{NAME}', replacement: req.body.FullName },
                        { word: '{EMAIL}', replacement: req.body.email },
                        { word: '{PHONE}', replacement: req.body.phoneNumber },
                        { word: '{MESSAGE}', replacement: req.body.message },
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
               sendEmail(res, emailTo, emailSubject, finalContent);
               var dataArray = {
                "status": "success",   
                "message": 'Form submited successfully',
               };
               return res.status(200).json({ dataArray });
           } catch (error) {
                var dataArray = {
                    "status": "error",   
                    "message": error,
                };
                return res.status(201).json({ dataArray });
           }
       }
    },
    contactFormSubmit:async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            var dataArray = {
                "status": "error",   
                "message": errorMessages,
            };
            return res.status(201).json({ dataArray });
       }else{
           let data = {
               first_name: req.body.first_name,
               last_name: req.body.last_name,
               email_address: req.body.email_address,
               contact_number: '+91'+req.body.contact_number,
               message: req.body.message,
           };
           try {
               let resp = await contactModel.insert(conn, data);
               let emailTempleteCheck = await emailTempleteModel.list(conn, 10);
               if(emailTempleteCheck != ''){
                    let emailContent = emailTempleteCheck[0].body;
                    var emailSubject = emailTempleteCheck[0].subject;
                    const replacements = [
                        { word: '{FIRST_NAME}', replacement: req.body.first_name },
                        { word: '{LAST_NAME}', replacement: req.body.last_name },
                        { word: '{EMAIL}', replacement: req.body.email_address },
                        { word: '{PHONE}', replacement: '+91'+req.body.contact_number },
                        { word: '{MESSAGE}', replacement: req.body.message },
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
               sendEmail(res, emailTo, emailSubject, finalContent);
               var dataArray = {
                "status": "success",   
                "message": 'Contact Form submited successfully',
               };
               return res.status(200).json({ dataArray });
           } catch (error) {
                var dataArray = {
                    "status": "error",   
                    "message": error,
                };
                return res.status(201).json({ dataArray });
           }
       }
    },
    sendEmailData:async function(res, emailTo, emailSubject, finalContent) {
        sendEmail(res, emailTo, emailSubject, finalContent);
    },

    getPagesData: async function(req, res) {
       // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            var dataArray = {
                "status": "error",   
                "message": errorMessages[0],
            };
            return res.status(201).json({ dataArray });
       }else{
        let pageId = req.query.page_id;
        try {
            let resp = await PageModel.details(conn, pageId);
            return res.status(200).json({
                "status": "success",   
                "data": { 'page_details':resp[0] },
                "message": 'Page data load successfully',
            });
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "data": { 'page_details':{} },
                "message": error,
            });
        }
       }
    },

    getFaqsData:  async function(req, res) {
        try {
            let resp = await faqModel.apiGetFaqs(conn);
            return res.status(200).json({
                "status": "success",   
                "data": { 'faqs_details':resp },
                "message": 'Faqs data load successfully',
            });
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "data": { 'faqs_details':{} },
                "message": error,
            });
        }
    },

    getUserData: async function(req, res) {
        try {
            var urlId = req.query.urlId;
            let resp = await userModel.apiGetDataFromReferalCode(conn, urlId);
            if(resp != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'user_details':resp[0] },
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "error",   
                    "data": { 'user_details':{} },
                    "message": "error",
                });
            }
           
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "data": { 'faqs_details':{} },
                "message": error,
            });
        }
    },

    getFrontListenerData: async function(req, res) {
        try {
            let resp = await userModel.getFrontListenerData(conn);
            return res.status(200).json({
                "status": "success",   
                "data": { 'listener_data':resp },
                "message": 'Listener data load successfully',
            });
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "data": { 'listener_data':{} },
                "message": error,
            });
        }
    },


}

function sendEmail(res, emailTo, emailSubject, finalContent) {
    const emailTemplatePath = path.join(__dirname, '..', 'views', 'emails', 'email_templete.hbs');
    res.render(emailTemplatePath, { finalContent }, (err, html) => {
        if (err) {
            console.error('Error rendering email template:', err);
            return;
        }

        const mailOptions = {
            from: process.env.MAIL_FROM_ADDRESS,
            to: emailTo,
            subject: emailSubject,
            html: html, // Set the rendered HTML as the email body
            attachments: [
                {   // utf-8 string as an attachment
                    filename: 'logo.png',
                    path: path.join(__dirname, '..', 'public', 'images', 'logo.png'),
                    cid: 'logo1' //same cid value as in the html img src
                },
            ],
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
            console.error('Email could not be sent:', error);
            } else {
            //console.log('Email sent:', info.response);
            }
        });
    });
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