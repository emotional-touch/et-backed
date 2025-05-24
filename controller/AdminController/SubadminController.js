var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var roleModel = require("../../models/AdminRole");
var adminModel = require("../../models/Admin");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let adminList = await adminModel.list(conn);
        var currentPath = req.path;
        res.render("admin/sub-admin/list", { adminList, currentPath });
    },
    delete: async function(req, res) {
        const adminId = req.params.id;
        //console.log(adminId);
        let adminCheck = await adminModel.delete(conn, adminId);
        if(adminCheck != ''){
            req.flash('success', 'Sub Admin deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        let roleList = await roleModel.list(conn);

        res.render("admin/sub-admin/add", { roleList, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/subadmin-management/list');
        }else{
            if(req.body.adminId){
                const adminId = req.body.adminId;
            
                let data = {
                    name: req.body.name,
                    email: req.body.email,
                    role_id: req.body.role_id,
                };

                try {   
                    let resp = await adminModel.update(conn, data, adminId);
                    req.flash('success', 'Sub Admin updated successfully.');
                    res.redirect('/admin/subadmin-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/subadmin-management/list');
                }
            }else{
                var password = generatePassword(8);
                var hashPassword = passwordHash(password);

                let data = {
                    name: req.body.name,
                    email: req.body.email,
                    role_id: req.body.role_id,
                    password: hashPassword,
                    admin_type: 'sub-admin',
                };

                try {
                    let resp = await adminModel.insert(conn, data);

                    /**************************** Email Send Code ***********************/

                    let emailTempleteCheck =  await emailTempleteModel.list(conn, 16);
                    if(emailTempleteCheck != ''){
                            let emailContent = emailTempleteCheck[0].body;
                            var emailSubject = emailTempleteCheck[0].subject;
                            
                            const replacements = [
                                { word: '{NAME}', replacement: req.body.name },
                                { word: '{USERNAME}', replacement: req.body.email },
                                { word: '{PASSWORD}', replacement: password },
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
                    
                    req.flash('success', 'Sub Admin added successfully.');
                    res.redirect('/admin/subadmin-management/list');
                } catch (error) {
                    req.flash('error', error);
                    //console.log(error);
                    res.redirect('/admin/subadmin-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const adminId = req.params.id;
            let adminDetails = await adminModel.details(conn, adminId);
            let roleList = await roleModel.list(conn);

            if(adminDetails.length > 0){
                var adminInfo = adminDetails[0];
                res.render("admin/sub-admin/add", { adminInfo, roleList });
            }else{
                req.flash('error', 'Sub Admin not found.');
                res.redirect('/admin/subadmin-management/list');
            }
        }else{
            req.flash('error', 'Sub Admin Id is missing.');
            res.redirect('/admin/subadmin-management/list');
        }
    }, 
    
}

function passwordHash(inputPassword){
    const salt = 'tokenpass'; 
    return crypto.pbkdf2Sync(inputPassword, salt, 100000, 64, 'sha512').toString('hex');
}

function generatePassword(length) {
    const bytesNeeded = Math.ceil(length * 0.75);
    const randomBytes = crypto.randomBytes(bytesNeeded);
    const password = randomBytes.toString('base64').slice(0, length);
  
    return password;
  }