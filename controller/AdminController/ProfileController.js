var conn = require("../../config/db");
var adminModel = require("../../models/Admin");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    changePassword: function(req, res) {
        var currentPath = req.path;
        res.render("admin/setting/change-password", { currentPath });
    },
    changePasswordPost: async function(req, res) {
        // any occurs or not and return an object
        const errors = validationResult(req);
        // If some error occurs, then this
         if (!errors.isEmpty()) {
             const errorMessages = errors.array().map(error => error.msg);
             req.flash('error', errorMessages[0]);
             res.redirect('/admin/change-password');
         }else{
            const { current_password, new_password } = req.body;
            var adminEmail = req.session.admin.email;
            var adminDetails = await adminModel.adminAuthCheck(conn,adminEmail);
            if(adminDetails != ''){
                var adminData = adminDetails[0];
                var hashPassword = passwordHash(current_password);
                if( hashPassword != adminData.password){
                    req.flash('error', 'You current password is invalid.');
                    return res.redirect('/admin/change-password');
                }
                var newPassword = passwordHash(new_password);
                var adminId = adminData.id;
                const passwordChange = await adminModel.adminPasswordReset(conn, adminId, newPassword);
                if(passwordChange){
                    req.flash('success', 'Password have been change succesfully.');
                    res.redirect('/admin/change-password');
                }else{
                    req.flash('error', 'Something went wrong.');
                    res.redirect('/admin/change-password');
                }
            }else{
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/change-password');
            }
        }
    },
    myProfile: async function(req, res) {
        var currentPath = req.path;
        var adminEmail = req.session.admin.email;
        var adminDetails =  await adminModel.adminAuthCheck(conn, adminEmail);
        adminDetails = adminDetails[0];
        res.render("admin/setting/myprofile", { currentPath, adminDetails });
    },
    myProfilePost: async function(req, res) {
        // any occurs or not and return an object
        const errors = validationResult(req);
        // If some error occurs, then this
         if (!errors.isEmpty()) {
             const errorMessages = errors.array().map(error => error.msg);
             req.flash('error', errorMessages[0]);
             res.redirect('/admin/my-profile');
         }else{
            const { name } = req.body;
            var adminId = req.session.admin.id;
            if(adminId != ''){
                let data = {
                    name: name,
                };
                const passwordChange = await adminModel.update(conn, data, adminId);
                if(passwordChange){
                    req.flash('success', 'Profile have been updated succesfully.');
                    res.redirect('/admin/my-profile');
                }else{
                    req.flash('error', 'Something went wrong.');
                    res.redirect('/admin/my-profile');
                }
            }else{
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/my-profile');
            }
        }
    },
}

function passwordHash(inputPassword){
    const salt = 'tokenpass'; 
    return crypto.pbkdf2Sync(inputPassword, salt, 100000, 64, 'sha512').toString('hex');
}