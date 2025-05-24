var conn = require("../../config/db");
var adminModel = require("../../models/Admin");
const homeController = require("../../controller/HomeController");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    login: function(req, res) {
        res.render("admin/auth/login");
    },
    loginPost: async function(req, res) {
        // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error', errorMessages[0]);
           
            // Redirect back to the registration form or any other page
            res.redirect('/admin/login');
       }else{
        const { email, password } = req.body;
        const adminAuthCheck = await adminModel.adminAuthCheck(conn, email);
        if(adminAuthCheck != ''){
            const admin = adminAuthCheck[0]; 
            var hashPassword = passwordHash(password);
            if( hashPassword != admin.password){
                req.flash('error', 'Email or Password incorrect.');
           
                // Redirect back to the registration form or any other page
                res.redirect('/admin/login');
            }else if(admin.deleted_at != null){
                req.flash('error', 'Your account is deleted.');
                // Redirect back to the registration form or any other page
                res.redirect('/admin/login');
            }else if(admin.status == 0){
                req.flash('error', 'Your account is deactivated.');
                // Redirect back to the registration form or any other page
                res.redirect('/admin/login');
            }else{
                req.session.admin = admin;
                res.redirect('/admin/dashboard');
            }
        }else{
            req.flash('error', 'Email or Password incorrect.');
           
            // Redirect back to the registration form or any other page
            res.redirect('/admin/login');
        }
           // conn.query(query,[data],function)
        //    var otpData = getOTPData();
        //    let data = {
        //        full_name: req.body.full_name,
        //        email: req.body.email,
        //        phone_number: req.body.phone_number,
        //        otp: otpData.otp,
        //        otp_expiry: otpData.otp_expiry,
        //        language: req.body.language,
        //        referral_code: req.body.referral_code,
        //    };
        //    try {
        //        let resp = await userModel.insert(conn, data);
        //        return res.status(200).json({
        //         "status": "success",   
        //         "data": { 'otp':otpData.otp, 'user_id':resp.insertId},
        //         "message": 'User have been register successfully',
        //        });
        //    } catch (error) {
        //         return res.status(201).json({
        //             "status": "error",   
        //             "message": error,
        //         });
        //    }
       }
    },
    forgotPassword: function(req, res) {
        res.render("admin/auth/forgot-password");
    },
    forgotPasswordPost: async function(req, res) {
       // any occurs or not and return an object
       const errors = validationResult(req);
       // If some error occurs, then this
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            req.flash('error', errorMessages[0]);
            res.redirect('/admin/forgot-password');
        }else{
            const { email } = req.body;
            //console.log(email);
            const adminAuthCheck = await adminModel.adminAuthCheck(conn, email);
            //console.log(adminAuthCheck);
            if(adminAuthCheck != ''){
                var adminDetails = adminAuthCheck[0];
                // Generate a reset token
                const resetToken = generateResetToken();
                // Check if the token is valid and not expired
                const tokenExpiration = new Date();
                tokenExpiration.setMinutes(tokenExpiration.getMinutes() + 30);

                // Update the user's record in the database with the reset token and a timestamp
                await conn.query('UPDATE admins SET reset_token = ?, reset_token_expires =  ? WHERE email = ?', [resetToken, tokenExpiration, email]);

                // Send an email to the user with a link containing the reset token
                const resetLink = process.env.WEB_URL+`admin/reset-password/${resetToken}`;

                // /**************************** Email Send Code ***********************/

                let emailTempleteCheck =  await emailTempleteModel.list(conn, 11);
                if(emailTempleteCheck != ''){
                        let emailContent = emailTempleteCheck[0].body;
                        var emailSubject = emailTempleteCheck[0].subject;
                        const replacements = [
                            { word: '{NAME}', replacement: adminDetails.name },
                            { word: '{LINK}', replacement: resetLink },
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
                var emailTo = adminDetails.email;
                homeController.sendEmailData(res, emailTo, emailSubject, finalContent);

                /**************************** End Email Send Code ***********************/
                req.flash('success', 'Reset password link sent to your registered email.');
                res.redirect('/admin/login');
            }else{
                req.flash('error', 'The email address you entered is not registered in our system.');
                res.redirect('/admin/forgot-password');
            }
        }
    },
    resetPassword: async function(req, res) {
        const token = req.params.token;
        const adminTokenCheck = await adminModel.adminTokenAuthCheck(conn, token);
        if (adminTokenCheck != '') {
            var adminData = adminTokenCheck[0];
            if (adminData.reset_token_expires > new Date()) {
                res.render("admin/auth/reset-password", { token });
            }else{
                req.flash('error', 'Token expired.');
                res.redirect('/admin/forgot-password');
            }
        }else{
            req.flash('error', 'Invalid token.');
            res.redirect('/admin/forgot-password');
        }
    },
    resetPasswordPost: async function(req, res) {
        // any occurs or not and return an object
        const errors = validationResult(req);
        // If some error occurs, then this
         if (!errors.isEmpty()) {
             const errorMessages = errors.array().map(error => error.msg);
             req.flash('error', errorMessages[0]);
             res.redirect('/admin/login');
         }else{
            const { token, password } = req.body;
            const adminTokenCheck = await adminModel.adminTokenAuthCheck(conn, token);
            if(adminTokenCheck != ''){
                var adminDetails = adminTokenCheck[0];
                var adminId = adminDetails.id;
                var hashPassword = passwordHash(password);
                const passwordReset = await adminModel.adminPasswordReset(conn, adminId, hashPassword);
                if(passwordReset){
                    req.flash('success', 'Password have been reset succesfully.');
                    res.redirect('/admin/login');
                }else{
                    req.flash('error', 'Something went wrong.');
                    res.redirect('/admin/forgot-password');
                }
               
            }else{
                 req.flash('error', 'Invalid token.');
                 res.redirect('/admin/forgot-password');
            }
        }
    },
}

function passwordHash(inputPassword){
    const salt = 'tokenpass'; 
    return crypto.pbkdf2Sync(inputPassword, salt, 100000, 64, 'sha512').toString('hex');
}

function generateResetToken() {
    const token = crypto.randomBytes(20).toString('hex');
    return token;
}
