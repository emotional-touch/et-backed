conn = require("../config/db");
var RechargePlanModel = require("../models/RechargePlan");
var walletModel = require("../models/Wallet");
var serviceFeesModel = require("../models/ServiceFees");
const { check, validationResult } = require('express-validator');
require('dotenv').config();

module.exports = {
    getRechargePlan: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let gstFees = await serviceFeesModel.list(conn, 'gst');
                let gstFeesPercentage = gstFees[0].fees_percentage;
                let rechargePlanList = await RechargePlanModel.apiGetRechargePlan(conn, gstFeesPercentage);
                if(rechargePlanList != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'recharge_plan_list': rechargePlanList},
                        "message": 'success',
                    });
                }else{
                    return res.status(201).json({
                        "status": "success",   
                        "data": { 'recharge_plan_list': []},
                        "message": 'success',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },

    getTransactionHistory: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                var fromDate = req.query.from_date;
                var toDate = req.query.to_date;

                var fromDateObj = '';
                var toDateObj = '';
                if(fromDate != undefined && fromDate != null && fromDate != ''){
                    var fromDateObj = fromDate;
                }

                if(toDate != undefined && toDate != null && toDate != ''){
                    var toDateObj = toDate;
                }

                if(fromDateObj != '' && toDateObj != ''){
                    if (toDateObj <= fromDateObj) {
                        return res.status(201).json({
                            "status": "error",   
                            "message": 'To date is not less then or equal to from date',
                        });
                    } 
                }

                let transactionList = await walletModel.getTransactionHistory(conn, userId, fromDateObj, toDateObj);
                if(transactionList != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'transaction_list': transactionList},
                        "message": 'success',
                    });
                }else{
                    return res.status(201).json({
                        "status": "success",   
                        "data": { 'transaction_list': []},
                        "message": 'success',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },
}