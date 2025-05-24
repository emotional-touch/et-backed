var conn = require("../../config/db");
var adminModel = require("../../models/Admin");
var userModel = require("../../models/User");
var walletModel = require("../../models/Wallet");
var revenueModel = require("../../models/Revenue");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

module.exports = {
    dashboard: async function(req, res) {
        var currentPath = req.path;
        var listnerCount = await userModel.userTypeCount(conn, 'listner');
        var userCount = await userModel.userTypeCount(conn, 'user');
        let userList = await userModel.recentUserDashboard(conn);
        var listnerTotalAmount = await walletModel.totalWalletBalance(conn, 'listner');
        var listnerTotalAmt = listnerTotalAmount[0].totalAmount;
        var totalBonusIssued = await walletModel.totalBonusIssued(conn);
        var totalBonusIssuedAmt = totalBonusIssued[0].totalBonusAmount;
        res.render("admin/dashboard/dashboard", { userCount, listnerCount, userList, listnerTotalAmt, totalBonusIssuedAmt, currentPath });
    },

    revenueInfo: async function(req, res) {
        var currentPath = req.path;
        const timePeriod = req.params.timeperiod;
        var totalSales = 0;
        var totalGST = 0;

        var totalSales = await revenueModel.totalSales(conn, timePeriod);
        totalSales = totalSales[0].total_amount_gst;
        var totalGST = await revenueModel.totalGST(conn, timePeriod);
        totalGST = totalGST[0].total_gst;
        var totalListenerRevenue = await revenueModel.totalListenerRevenue(conn, timePeriod);
        totalListenerRevenue = totalListenerRevenue[0].total_listener_revenue;
        var companyRevenue = totalSales - totalGST - totalListenerRevenue;

        var startDate = '';
        var endDate = '';
        
        res.render("admin/dashboard/revenue", { totalSales, totalGST, totalListenerRevenue, companyRevenue, timePeriod, startDate, endDate, currentPath });
    },

    revenueInfoDate: async function(req, res) {
        var currentPath = req.path;
        var startDate = req.query.start_date;
        var endDate = req.query.end_date;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        var timePeriod = '';
    
        // Check if startDate is greater than endDate
        if (startDateObj > endDateObj) {
            req.flash('error', 'End date must be greater then start date');
            res.redirect('back'); // startDate is greater than endDate
        }

        var totalSales = 0;
        var totalGST = 0;

        var totalSales = await revenueModel.totalDateWiseSales(conn, startDate, endDate);
        totalSales = totalSales[0].total_amount_gst;
        var totalGST = await revenueModel.totalDateWiseGST(conn, startDate, endDate);
        totalGST = totalGST[0].total_gst;
        var totalListenerRevenue = await revenueModel.totalDateWiseListenerRevenue(conn, startDate, endDate);
        totalListenerRevenue = totalListenerRevenue[0].total_listener_revenue;
        var companyRevenue = totalSales - totalGST - totalListenerRevenue;
        res.render("admin/dashboard/revenue", { totalSales, totalGST, totalListenerRevenue, companyRevenue, startDate, endDate, currentPath });

    },

    pushNotificationSent: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/push-notification/push-notification", { currentPath });
    },

    sentPushNotification: async function(req, res) {
        try {
            var titleMessage = req.body.title;
            var bodyMessage = req.body.message;
            let users = await userModel.pushNotificationUserList(conn, 'user');
            //console.log(path.join(__dirname, '..', '..', 'public', 'apk', 'serviceAccountKey.json'));
            if (!admin.apps.length) {
                var serviceAccount = require(path.join(__dirname, '..', '..', 'public', 'apk', 'serviceAccountKey.json'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });
            }
            users.forEach(user => {
                // Perform operations with user data here
                //console.log(user.device_token);
                var message = {
                    notification: {
                        title: titleMessage,
                        body: bodyMessage,
                    },
                    token: user.device_token, // Provide the device token here
                    android: {
                        priority: 'high' // Set the priority to 'high'
                    },
                    apns: {
                        payload: {
                            aps: {
                            contentAvailable: true, // This is equivalent to high priority for iOS
                            },
                        },
                    },
                };
                // Send the notification
                var sendnoti = admin.messaging().send(message)
                .then((response) => {
                    //console.log('Successfully sent message:', response);
                })
                .catch((error) => {
                    console.error('Error sending message:', error);
                });
                //console.log(sendnoti);
            });
            req.flash('success', 'Push Notification sent successfully.');
            res.redirect('/admin/push-notification/sent');
        } catch (error) {
            req.flash('erro', error);
            res.redirect('/admin/push-notification/sent');
        }

    },
}