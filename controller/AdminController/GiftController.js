var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var giftModel = require("../../models/GiftAmount");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let giftList = await giftModel.list(conn);
        var currentPath = req.path;
        res.render("admin/gift/list", { giftList, currentPath });
    },
    delete: async function(req, res) {
        const giftId = req.params.id;
        //console.log(giftId);
        let giftCheck = await giftModel.delete(conn, giftId);
        if(giftCheck != ''){
            req.flash('success', 'Gift Amount deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/gift/add-gift", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/gift-management/list');
        }else{
            if(req.body.giftId){
                const giftId = req.body.giftId;

                let data = {
                    gift_amount: req.body.gift_amount,
                };

                try {
                    let resp = await giftModel.update(conn, data, giftId);
                    req.flash('success', 'Gift Amount updated successfully.');
                    res.redirect('/admin/gift-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/gift-management/list');
                }
            }else{

                let data = {
                    gift_amount: req.body.gift_amount,
                };

                try {
                    let resp = await giftModel.insert(conn, data);
                    
                    req.flash('success', 'Gift Amount added successfully.');
                    res.redirect('/admin/gift-management/list');
                } catch (error) {
                    req.flash('error', error);
                    //console.log(error);
                    res.redirect('/admin/gift-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const giftId = req.params.id;
            let giftDetails = await giftModel.details(conn, giftId);
            if(giftDetails.length > 0){
                var giftInfo = giftDetails[0];
                res.render("admin/gift/add-gift", { giftInfo });
            }else{
                req.flash('error', 'Gift Amount not found.');
                res.redirect('/admin/gift-management/list');
            }
        }else{
            req.flash('error', 'Gift Id is missing.');
            res.redirect('/admin/gift-management/list');
        }
    }, 
}