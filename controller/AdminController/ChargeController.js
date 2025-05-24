var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var settingModel = require("../../models/Setting");
var chargeModel = require("../../models/Charge");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let settingList = await settingModel.chargelist(conn);
        let chargeList = await chargeModel.list(conn);
        var currentPath = req.path;
        res.render("admin/charge/list", { settingList, chargeList, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/charge-management/list');
        }else{
            if(req.body.settingId){
                const settingId = req.body.settingId;

                let data = {
                    value: req.body.value,
                };

                try {
                    let resp = await settingModel.update(conn, data, settingId);
                    req.flash('success', 'Setting updated successfully.');
                    res.redirect('/admin/charge-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/charge-management/list');
                }
            }else{
                req.flash('error', 'ChargeId is missing');
                res.redirect('/admin/charge-management/list');
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const settingId = req.params.id;
            let settingDetails = await settingModel.details(conn, settingId);
            if(settingDetails.length > 0){
                var settingInfo = settingDetails[0];
                res.render("admin/charge/add-setting", { settingInfo });
            }else{
                req.flash('error', 'Charge not found.');
                res.redirect('/admin/charge-management/list');
            }
        }else{
            req.flash('error', 'ChargeId is missing.');
            res.redirect('/admin/charge-management/list');
        }
    }, 

    deleteUserCharge: async function(req, res) {
        const chargeId = req.params.id;
        //console.log(chargeId);
        let chargeCheck = await chargeModel.delete(conn, chargeId);
        if(faqCatCheck != ''){
            req.flash('success', 'User Charge deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    addUserCharge: async function(req, res) {
        var currentPath = req.path;
        let userList = await chargeModel.listListeners(conn);
        res.render("admin/charge/add-user-charge", { currentPath, userList });
    },
    saveUserCharge: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/charge-management/list');
        }else{
            if(req.body.chargeId){
                const chargeId = req.body.chargeId;

                let data = {
                    call_charge: req.body.call_charge,
                    chat_charge: req.body.chat_charge,
                    vcall_charge: req.body.vcall_charge,
                };

                try {
                    let resp = await chargeModel.update(conn, data, chargeId);
                    req.flash('success', 'User Charge updated successfully.');
                    res.redirect('/admin/charge-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/charge-management/list');
                }
            }else{

                const userId = req.body.user_id;
                let chargeCheck = await chargeModel.detailsByUserId(conn, userId);
                if(chargeCheck != ''){
                    var chargeInf = chargeCheck[0];
                    const chargeId = chargeInf.id;

                    let data = {
                        call_charge: req.body.call_charge,
                        chat_charge: req.body.chat_charge,
                        vcall_charge: req.body.vcall_charge,
                    };

                    try {
                        let resp = await chargeModel.update(conn, data, chargeId);
                        req.flash('success', 'User Charge updated successfully.');
                        res.redirect('/admin/charge-management/list');
                    } catch (error) {
                        req.flash('erro', error);
                        res.redirect('/admin/charge-management/list');
                    }
                }else{
                    let data = {
                        user_id: req.body.user_id,
                        call_charge: req.body.call_charge,
                        chat_charge: req.body.chat_charge,
                        vcall_charge: req.body.vcall_charge,
                    };
                    try {
                        let resp = await chargeModel.insert(conn, data);
                        
                        req.flash('success', 'User Charge added successfully.');
                        res.redirect('/admin/charge-management/list');
                    } catch (error) {
                        req.flash('error', error);
                        res.redirect('/admin/charge-management/list');
                    }
                }
            }
        }
    },
    editUserCharge: async function(req, res) {
        if(req.params.id){
            const chargeId = req.params.id;
            let chargeDetails = await chargeModel.details(conn, chargeId);
            let userList = await chargeModel.listListeners(conn);
            if(chargeDetails.length > 0){
                var chargeInfo = chargeDetails[0];
                res.render("admin/charge/add-user-charge", { chargeInfo, userList });
            }else{
                req.flash('error', 'User Charge not found.');
                res.redirect('/admin/charge-management/list');
            }
        }else{
            req.flash('error', 'Charge Id is missing.');
            res.redirect('/admin/charge-management/list');
        }
    }, 
    gstSave: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/charge-management/list');
        }else{
            if(req.body.settingId){
                const settingId = req.body.settingId;

                let data = {
                    value: req.body.value,
                };

                try {
                    let resp = await settingModel.update(conn, data, settingId);
                    req.flash('success', 'GST updated successfully.');
                    res.redirect('/admin/charge-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/charge-management/list');
                }
            }else{
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/charge-management/list');
            }
        }
    },
    gstEdit: async function(req, res) {
        let gstList = await settingModel.gstdetails(conn);
        var gstInfo = gstList[0];
        res.render("admin/charge/add-setting", { gstInfo });
    }, 
}