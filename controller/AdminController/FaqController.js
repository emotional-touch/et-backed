var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var faqCategoryModel = require("../../models/FaqCategory");
var faqModel = require("../../models/Faq");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let faqList = await faqModel.list(conn);
        var currentPath = req.path;
        res.render("admin/faq/list", { faqList, currentPath });
    },
    delete: async function(req, res) {
        const faqId = req.params.id;
        //console.log(faqId);
        let faqCatCheck = await faqModel.delete(conn, faqId);
        if(faqCatCheck != ''){
            req.flash('success', 'FAQ deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        let faqCategoryList = await faqCategoryModel.list(conn);
        res.render("admin/faq/add-faq", { currentPath, faqCategoryList });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/faq-management/list');
        }else{
            if(req.body.faqId){
                const faqId = req.body.faqId;

                let data = {
                    category_id: req.body.category_id,
                    user_type: req.body.user_type,
                    question: req.body.question,
                    answer: req.body.answer,
                };

                try {
                    let resp = await faqModel.update(conn, data, faqId);
                    req.flash('success', 'FAQ updated successfully.');
                    res.redirect('/admin/faq-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/faq-management/list');
                }
            }else{
                let data = {
                    category_id: req.body.category_id,
                    user_type: req.body.user_type,
                    question: req.body.question,
                    answer: req.body.answer,
                };
                try {
                    let resp = await faqModel.insert(conn, data);
                    
                    req.flash('success', 'FAQ added successfully.');
                    res.redirect('/admin/faq-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/faq-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const faqId = req.params.id;
            let faqDetails = await faqModel.details(conn, faqId);
            let faqCategoryList = await faqCategoryModel.list(conn);
            if(faqDetails.length > 0){
                var faqInfo = faqDetails[0];
                res.render("admin/faq/add-faq", { faqInfo, faqCategoryList });
            }else{
                req.flash('error', 'FAQ not found.');
                res.redirect('/admin/faq-management/list');
            }
        }else{
            req.flash('error', 'FAQ Id is missing.');
            res.redirect('/admin/faq-management/list');
        }
    }, 
    faqStatusAction: async function(req, res) {
        if(req.body.faqId){
            const faqId = req.body.faqId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await faqModel.update(conn, data, faqId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'FAQ status updated successfully',
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
                "message": 'FaqId is missing',
            });
        }
    },
    details: async function(req, res) {
        if(req.params.id){
            const faqId = req.params.id;
            let faqDetails = await faqModel.details(conn, faqId);
            if(faqDetails.length > 0){
                var faqInfo = faqDetails[0];
                res.render("admin/faq/view-faq", { faqInfo });
            }else{
                req.flash('error', 'FAQ not found.');
                res.redirect('/admin/faq-management/list');
            }
        }else{
            req.flash('error', 'FAQ Id is missing.');
            res.redirect('/admin/faq-management/list');
        }
    }, 
}