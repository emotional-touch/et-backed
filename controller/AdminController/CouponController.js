var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var faqCategoryModel = require("../../models/FaqCategory");
var couponModel = require("../../models/Coupon");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let couponList = await couponModel.list(conn);
        var currentPath = req.path;
        res.render("admin/coupon/list", { couponList, currentPath });
    },
    delete: async function(req, res) {
        const couponId = req.params.id;
        //console.log(couponId);
        let couponCheck = await couponModel.delete(conn, couponId);
        if(couponCheck != ''){
            req.flash('success', 'Coupon deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/coupon/add-coupon", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/coupon-management/list');
        }else{
            if(req.body.couponId){
                const couponId = req.body.couponId;

                if (req.body.type == 'per') {
                    var discount_per = req.body.discount_per;
                    var discount_amount = 0;
                }else{
                    var discount_per = 0;
                    var discount_amount = req.body.discount_amount;
                }

                let data = {
                    code: req.body.code,
                    type: req.body.type,
                    min_amount: req.body.min_amount,
                    user_limit: req.body.user_limit,
                    discount_per: discount_per,
                    discount_amount: discount_amount,
                    description: req.body.description,
                    expiry_date: req.body.expiry_date,
                };

                try {
                    let resp = await couponModel.update(conn, data, couponId);
                    req.flash('success', 'Coupon updated successfully.');
                    res.redirect('/admin/coupon-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/coupon-management/list');
                }
            }else{

                if (req.body.type == 'per') {
                    var discount_per = req.body.discount_per;
                    var discount_amount = 0;
                }else{
                    var discount_per = 0;
                    var discount_amount = req.body.discount_amount;
                }

                let data = {
                    code: req.body.code,
                    type: req.body.type,
                    min_amount: req.body.min_amount,
                    user_limit: req.body.user_limit,
                    discount_per: discount_per,
                    discount_amount: discount_amount,
                    description: req.body.description,
                    expiry_date: req.body.expiry_date,
                    created_by_admin_id: req.session.admin.id,
                };

                try {
                    let resp = await couponModel.insert(conn, data);
                    
                    req.flash('success', 'Coupon added successfully.');
                    res.redirect('/admin/coupon-management/list');
                } catch (error) {
                    req.flash('error', error);
                    //console.log(error);
                    res.redirect('/admin/coupon-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const couponId = req.params.id;
            let couponDetails = await couponModel.details(conn, couponId);
            if(couponDetails.length > 0){
                var couponInfo = couponDetails[0];
                res.render("admin/coupon/add-coupon", { couponInfo });
            }else{
                req.flash('error', 'Coupon not found.');
                res.redirect('/admin/coupon-management/list');
            }
        }else{
            req.flash('error', 'Coupon Id is missing.');
            res.redirect('/admin/coupon-management/list');
        }
    }, 
    details: async function(req, res) {
        if(req.params.id){
            const couponId = req.params.id;
            let couponDetails = await couponModel.details(conn, couponId);
            if(couponDetails.length > 0){
                var couponInfo = couponDetails[0];
                res.render("admin/coupon/view-coupon", { couponInfo });
            }else{
                req.flash('error', 'Coupon not found.');
                res.redirect('/admin/coupon-management/list');
            }
        }else{
            req.flash('error', 'Coupon Id is missing.');
            res.redirect('/admin/coupon-management/list');
        }
    }, 
}