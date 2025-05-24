var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let emailList = await emailTempleteModel.list(conn);
        var currentPath = req.path;
        res.render("admin/email/list", { emailList, currentPath });
    },
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/email/add-email", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/email-management/list');
        }else{
            if(req.body.emailId){
                const emailId = req.body.emailId;

                let data = {
                    title: req.body.title,
                    subject: req.body.subject,
                    body: req.body.body,
                };

                try {
                    let resp = await emailTempleteModel.update(conn, data, emailId);
                    req.flash('success', 'Email Template updated successfully.');
                    res.redirect('/admin/email-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/email-management/list');
                }
            }else{
                
                let data = {
                    title: req.body.title,
                    subject: req.body.subject,
                    body: req.body.body,
                    header_id: 1,
                    footer_id: 1,
                };

                try {
                    let resp = await emailTempleteModel.insert(conn, data);
                    req.flash('success', 'Email Template added successfully.');
                    res.redirect('/admin/email-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/email-management/list');
                }

            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const emailId = req.params.id;
            let emailDetails = await emailTempleteModel.details(conn, emailId);
            if(emailDetails.length > 0){
                var emailInfo = emailDetails[0];
                res.render("admin/email/add-email", { emailInfo });
            }else{
                req.flash('error', 'Email Template not found.');
                res.redirect('/admin/email-management/list');
            }
        }else{
            req.flash('error', 'Email Id is missing.');
            res.redirect('/admin/email-management/list');
        }
    }, 
    emailStatusAction: async function(req, res) {
        if(req.body.emailId){
            const emailId = req.body.emailId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await emailTempleteModel.update(conn, data, emailId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Email Template status updated successfully',
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
                "message": 'EmailId is missing',
            });
        }
    },
}