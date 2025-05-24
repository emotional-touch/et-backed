var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var rechargeModel = require("../../models/RechargePlan");
var serviceFeesModel = require("../../models/ServiceFees");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let rechargeList = await rechargeModel.list(conn);
        let serviceFees = await serviceFeesModel.list(conn, 'service_fees');
        let gst = await serviceFeesModel.list(conn, 'gst');
        var serviceAmt = serviceFees[0].fees_percentage;
        var gstAmt = gst[0].fees_percentage;
        var currentPath = req.path;
        res.render("admin/recharge/list", { rechargeList, currentPath, serviceAmt, gstAmt });
    },
    delete: async function(req, res) {
        const rechargeId = req.params.id;
        //console.log(rechargeId);
        let rechargeCheck = await rechargeModel.delete(conn, rechargeId);
        if(rechargeCheck != ''){
            req.flash('success', 'Recharge deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/recharge/add-recharge", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/recharge-management/list');
        }else{
            if(req.body.rechargeId){
                const rechargeId = req.body.rechargeId;

                let data = {
                    recharge_amount: req.body.recharge_amount,
                    //gst_percentage: req.body.gst_percentage,
                };

                try {
                    let resp = await rechargeModel.update(conn, data, rechargeId);
                    req.flash('success', 'Recharge updated successfully.');
                    res.redirect('/admin/recharge-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/recharge-management/list');
                }
            }else{

                let data = {
                    recharge_amount: req.body.recharge_amount,
                    //gst_percentage: req.body.gst_percentage,
                };

                try {
                    let resp = await rechargeModel.insert(conn, data);
                    
                    req.flash('success', 'Recharge added successfully.');
                    res.redirect('/admin/recharge-management/list');
                } catch (error) {
                    req.flash('error', error);
                    //console.log(error);
                    res.redirect('/admin/recharge-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const rechargeId = req.params.id;
            let rechargeDetails = await rechargeModel.details(conn, rechargeId);
            if(rechargeDetails.length > 0){
                var rechargeInfo = rechargeDetails[0];
                res.render("admin/recharge/add-recharge", { rechargeInfo });
            }else{
                req.flash('error', 'Recharge not found.');
                res.redirect('/admin/recharge-management/list');
            }
        }else{
            req.flash('error', 'Recharge Id is missing.');
            res.redirect('/admin/recharge-management/list');
        }
    },
    
    editServiceFees: async function(req, res) {
        var currentPath = req.path;
        var fieldName = 'service_fees';
        let serviceFees = await serviceFeesModel.list(conn, fieldName);
        var serviceFeesData = serviceFees[0];
        res.render("admin/recharge/edit-service-fees", { currentPath, serviceFeesData });
    },

    updateServiceFees: async function(req, res) {
        const feesPercentage = req.body.fees_percentage;
        let feesData = {
            fees_percentage: feesPercentage,
        };
        var fieldName = 'service_fees';

        try {
            let resp = await serviceFeesModel.update(conn, feesData, fieldName);
            req.flash('success', 'Admin Commission updated successfully.');
            res.redirect('/admin/recharge-management/list');
        } catch (error) {
            req.flash('error', error);
            res.redirect('/admin/recharge-management/list');
        }
    },

    editGST: async function(req, res) {
        var currentPath = req.path;
        var fieldName = 'gst';
        let gst = await serviceFeesModel.list(conn, fieldName);
        var gstData = gst[0];
        res.render("admin/recharge/edit-gst", { currentPath, gstData });
    },

    updateGst: async function(req, res) {
        const feesPercentage = req.body.fees_percentage;
        let feesData = {
            fees_percentage: feesPercentage,
        };
        var fieldName = 'gst';

        try {
            let resp = await serviceFeesModel.update(conn, feesData, fieldName);
            req.flash('success', 'GST updated successfully.');
            res.redirect('/admin/recharge-management/list');
        } catch (error) {
            req.flash('error', error);
            res.redirect('/admin/recharge-management/list');
        }
    },

    highlightAction: async function(req, res) {
        if(req.body.rechargePlanId){
            const rechargePlanId = req.body.rechargePlanId;
            const status = req.body.status;
            var data = {
                highlight_status: status,
            };
            try {
                let resp = await rechargeModel.update(conn, data, rechargePlanId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Data Updated Successfully.',
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
                "message": 'Recharge plan is missing',
            });
        }
    },
}