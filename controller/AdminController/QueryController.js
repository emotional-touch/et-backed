var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var queryModel = require("../../models/Query");
var emailTempleteModel = require("../../models/EmailTemplete");
var notificationModel = require("../../models/Notification");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let queryListenerList = await queryModel.listenerlist(conn);
        let queryUserList = await queryModel.userlist(conn);
        var currentPath = req.path;
        res.render("admin/query/list", { queryListenerList, queryUserList, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/query-management/list');
        }else{
            if(req.body.queryId){
                const queryId = req.body.queryId;

                let data = {
                    reply: req.body.reply,
                    status: req.body.status,
                };

                try {
                    let resp = await queryModel.update(conn, data, queryId);

                    /**************************** Email Send Code ***********************/

                    let emailTempleteCheck =  await emailTempleteModel.list(conn, 15);
                    if(emailTempleteCheck != ''){
                            let emailContent = emailTempleteCheck[0].body;
                            var emailSubject = emailTempleteCheck[0].subject;
                            
                            const replacements = [
                                { word: '{NAME}', replacement: req.body.submitted_by_name },
                                { word: '{QUERY}', replacement: req.body.query },
                                { word: '{REPLY}', replacement: req.body.reply },
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

                    // notification code
                    var storeNotificationData = {
                        user_id:req.body.u_id,
                        name:'Admin',
                        screen_type:'query',
                        message:'Admin has responded to your query.',
                        read_status: 0
                    };
                    let storeNotification = await notificationModel.insert(conn, storeNotificationData);

                    req.flash('success', 'Query replied successfully.');
                    res.redirect('/admin/query-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/query-management/list');
                }
            }else{

                req.flash('error', 'Query not found.');
                res.redirect('/admin/query-management/list');
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const queryId = req.params.id;
            let queryDetails = await queryModel.details(conn, queryId);
            if(queryDetails.length > 0){
                var queryInfo = queryDetails[0];
                res.render("admin/query/reply", { queryInfo });
            }else{
                req.flash('error', 'Query not found.');
                res.redirect('/admin/query-management/list');
            }
        }else{
            req.flash('error', 'Query Id is missing.');
            res.redirect('/admin/query-management/list');
        }
    }, 
    details: async function(req, res) {
        if(req.params.id){
            const queryId = req.params.id;
            let queryDetails = await queryModel.details(conn, queryId);
            if(queryDetails.length > 0){
                var queryInfo = queryDetails[0];
                res.render("admin/query/view-query", { queryInfo });
            }else{
                req.flash('error', 'Query not found.');
                res.redirect('/admin/query-management/list');
            }
        }else{
            req.flash('error', 'Query Id is missing.');
            res.redirect('/admin/query-management/list');
        }
    }, 
}