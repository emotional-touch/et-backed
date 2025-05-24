var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var transactionModel = require("../../models/WalletTransaction");
var userModel = require("../../models/User");
var emailTempleteModel = require("../../models/EmailTemplete");
var walletModel = require("../../models/Wallet");
var payoutModel = require("../../models/PayoutTable");
const helpers = require('../../helpers');
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/payout/list", { currentPath });
    },
    getPayoutList: async function(req, res) {
        var { page, pageSize, search } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        let payoutList = await payoutModel.payoutList(conn, limit, offset, search);
        res.json(payoutList);
    },
    payout: async function(req, res) {
        if(req.params.id){
            const payoutId = req.params.id;
            let payoutDetails = await payoutModel.payoutInfo(conn, payoutId);
            if(payoutDetails != ''){
                var walletBalance = await walletModel.walletBalance(conn, payoutDetails[0].listener_id);
                var balance = parseInt(walletBalance[0].balance);
                if(balance >= parseInt(payoutDetails[0].payout_amount)){
                    var leftBalance = balance - parseInt(payoutDetails[0].payout_amount);
                }else{
                    var leftBalance = 0;
                }

                var walletData = {
                    'balance': leftBalance,
                };
                var updateBalance = await walletModel.update(conn, walletData, walletBalance[0].id);
                var totalPanelty = parseInt(payoutDetails[0].leave_panelty_amt) +  parseInt(payoutDetails[0].session_miss_panelty_amt);
                if(totalPanelty > 0){
                    var message = 'A salary of Rs '+ payoutDetails[0].net_payout_amount +' has been paid by the admin, deducting '+ totalPanelty +' rupees panelty amount';
                }else{
                    var message = 'A salary of Rs '+ payoutDetails[0].net_payout_amount +' has been paid by the admin';
                }
                try {
                    var transactionNumber = await helpers.transactionIdGenerator();
                    var transactionData = {
                        'wallet_id':walletBalance[0].id,
                        'wallet_transaction_id': transactionNumber,
                        'user_id':walletBalance[0].user_id,
                        'amount':payoutDetails[0].net_payout_amount,
                        'transaction_type':'withdraw',
                        'description': message,
                        'transaction_status': 'success'
                    };
                    
                    let addTransaction = await walletModel.storeWalleteTransaction(conn, transactionData);

                    var payoutEntry = {
                        payout_amount : 0,
                        net_payout_amount : 0,
                        leave_panelty_amt : 0,
                        session_miss_panelty_amt : 0
                    }

                    var payoutDataStore = await payoutModel.update(conn, payoutEntry, payoutDetails[0].listener_id);

                    let listenerData = await userModel.list(conn, payoutDetails[0].listener_id);

                    /**************************** Email Send Code ***********************/

                     let emailTempleteCheck =  await emailTempleteModel.list(conn, 21);
                    
                     if(emailTempleteCheck != ''){
                             let emailContent = emailTempleteCheck[0].body;
                             var emailSubject = emailTempleteCheck[0].subject;
                         
                             const replacements = [
                                 { word: '{NAME}', replacement: listenerData[0].full_name },
                                 { word: '{CONTENT}', replacement: message },
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
                     var emailTo = listenerData[0].email;
                     
                     homeController.sendEmailData(res, emailTo, emailSubject, finalContent);
                    /**************************** End Email Send Code ***********************/

                    req.flash('success', 'Payout amount settle successfully.');
                    res.redirect('back');
                } catch (error) {
                    //console.log(error.message);
                    req.flash('error', 'Something went wrong.');
                    res.redirect('back');
                }
            }else{
                req.flash('error', 'Payout data is not found.');
                res.redirect('back');
            }
        }else{
            req.flash('error', 'Payout id is missing.');
            res.redirect('back');
        }
    },
}