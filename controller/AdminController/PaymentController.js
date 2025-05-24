var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var transactionModel = require("../../models/WalletTransaction");
var walletModel = require("../../models/Wallet");
var WalletTransaction = require("../../models/WalletTransaction");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let userList = await transactionModel.listUsers(conn);
        var currentPath = req.path;
        res.render("admin/payment/list", { userList, currentPath });
    },
    getData: async function(req, res) {
        var user = req.body.user;
        var type = req.body.type;
        

        let getData = await transactionModel.getData(conn, user, type);
        if(getData.length > 0){
            let htmlContent = "";
            for (let data of getData) {
                if(data.transaction_id != '' && data.transaction_id != null && data.transaction_id != undefined){
                    var transactionId = data.transaction_id;
                }else{
                    var transactionId = '-----';
                }

                var paidUser = '<span style="color:red;">Record Deleted</span>';
                if(data.paid_by_user != null && data.paid_by_user != undefined && data.paid_by_user != ''){
                    paidUser = data.paid_by_user;
                }

                var transactionAmount = data.amount;
                if(data.transaction_type == 'credit' && (data.activity_request != '' && data.activity_request != null && data.activity_request != undefined) && (data.service_fee > 0)){
                    transactionAmount = parseInt(data.amount) - parseInt(data.service_fee);
                }
                htmlContent += `<tr>
                                    <td>${transactionId}</td>
                                    <td>${paidUser}</td>
                                    <td>${transactionAmount}</td>
                                    <td>${formatTime(data.created_at, "DD MMM, Y")}</td>
                                    <td>
                                        <p class="status_${data.transaction_status} active">${data.transaction_status.toUpperCase()}</p>
                                        <p class="status_failed">Failed</p>
                                    </td>
                                    <td>
                                        <a href="/admin/payment-management/details/${data.id}" class="action_btn"><i class="fa fa-eye"></i></a>
                                    </td>
                                </tr>`;
            }

            return res.status(200).json({
                "status": "success",   
                "data": htmlContent,
                });
        }else{
            return res.status(201).json({
                "status": "error",   
                "message": "No data found.",
            });
        }
        
    },
    details: async function(req, res) {
        if(req.params.id){
            const tId = req.params.id;
            let transactionDetails = await transactionModel.details(conn, tId);
            if(transactionDetails.length > 0){
                var transactionInfo = transactionDetails[0];
                var transactionAmount = transactionInfo.amount;
                if(transactionInfo.transaction_type == 'credit' && (transactionInfo.activity_request != '' && transactionInfo.activity_request != null && transactionInfo.activity_request != undefined) && (transactionInfo.service_fee > 0)){
                    transactionAmount = parseInt(transactionInfo.amount) - parseInt(transactionInfo.service_fee);
                }
                res.render("admin/payment/view-payment", { transactionInfo, transactionAmount });
            }else{
                req.flash('error', 'Transaction not found.');
                res.redirect('/admin/payment-management/list');
            }
        }else{
            req.flash('error', 'Transaction Id is missing.');
            res.redirect('/admin/payment-management/list');
        }
    }, 

    deleteTransaction: async function(req, res) {
        const transactionId = req.params.id;
        let transactionDetails = await transactionModel.transactionDetails(conn, transactionId);
        var deleteEntry = 'yes';
        if(transactionDetails.length == 2){
            if(transactionDetails[0].transaction_type == 'credit'){
               var transactionData = transactionDetails[0];
            }else{
               var transactionData = transactionDetails[1];
            }
        }else{
            if(transactionDetails[0].transaction_type == 'credit'){
                var transactionData = transactionDetails[0];
            }else{
                var deleteEntry = 'no';
            }
        }
        if(deleteEntry == 'yes'){
            if(transactionData.transaction_status != 'success'){
                req.flash('error', 'This transaction status is failed so that is not deleted by the system.');
                res.redirect('back');
            }
            var walletId = transactionData.wallet_id; 
            var walletBalance = await walletModel.getWalletData(conn, walletId);
            walletBalance = parseInt(walletBalance[0].balance);
            var chargeAmt = parseInt(transactionData.amount) - parseInt(transactionData.service_fee);
            if(walletBalance < chargeAmt){
                req.flash('error', 'Listener wallete has not sufficent balance to deduct the transaction amount.');
                res.redirect('back');
            }else{
                var newWalleteBalance = walletBalance - chargeAmt;
                var walletData = {
                    'balance': parseInt(newWalleteBalance),
                };
                var updateBalance = await walletModel.update(conn, walletData, walletId); 
                var deleteEntry = await WalletTransaction.delete(conn, transactionId);
                req.flash('success', 'Transaction entry deleted successfully.');
                res.redirect('back');
            }
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
}

function formatTime(date, format) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}