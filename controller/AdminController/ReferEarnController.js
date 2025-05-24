var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var settingModel = require("../../models/Setting");
var referearnModel = require("../../models/ReferEarn");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let referearnList = await referearnModel.list(conn);
        var currentPath = req.path;
        res.render("admin/refer-earn/list", { referearnList, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/refer-earn-management/list');
        }else{
            if(req.body.refAmtId){
                const refAmtId = req.body.refAmtId;

                let data = {
                    value: req.body.referral_amount,
                };

                try {
                    let resp = await settingModel.update(conn, data, refAmtId);
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/refer-earn-management/list');
                }
            }else{
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/refer-earn-management/list');
            }

            if(req.body.refPerId){
                const refPerId = req.body.refPerId;

                let data = {
                    value: req.body.referral_percentage,
                };

                try {
                    let resp = await settingModel.update(conn, data, refPerId);
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/refer-earn-management/list');
                }
            }else{
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/refer-earn-management/list');
            }

            req.flash('success', 'Referral settings updated successfully.');
            res.redirect('/admin/refer-earn-management/list'); 
        }
    },
    setReferralAmount: async function(req, res) {
        let referralAmt = await settingModel.referralAmt(conn);
        let referralPer = await settingModel.referralPer(conn);

        var referralAmtInfo = referralAmt[0];
        var referralPerInfo = referralPer[0];
        res.render("admin/refer-earn/set-referral-amount", { referralAmtInfo, referralPerInfo });
    }, 
}