var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var faqCategoryModel = require("../../models/FaqCategory");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let faqCategoeyList = await faqCategoryModel.list(conn);
        var currentPath = req.path;
        res.render("admin/faq/category-list", { faqCategoeyList, currentPath });
    },
    delete: async function(req, res) {
        const faqCatId = req.params.id;
        //console.log(faqCatId);
        let faqCatCheck = await faqCategoryModel.delete(conn, faqCatId);
        if(faqCatCheck != ''){
            req.flash('success', 'FAQ Category deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/faq/category-new", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('erro', errorMessages);
                res.redirect('/admin/faq-category-management/list');
        }else{
            if(req.body.catId){
                const catId = req.body.catId;

                let data = {
                    name: req.body.name,
                };

                try {
                    let resp = await faqCategoryModel.update(conn, data, catId);
                    req.flash('success', 'FAQ Category updated successfully.');
                    res.redirect('/admin/faq-category-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/faq-category-management/list');
                }
            }else{
                let data = {
                    name: req.body.name,
                };
                try {
                    let resp = await faqCategoryModel.insert(conn, data);
                    
                    req.flash('success', 'FAQ Category added successfully.');
                    res.redirect('/admin/faq-category-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/faq-category-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const catId = req.params.id;
            let catDetails = await faqCategoryModel.details(conn, catId);
            if(catDetails.length > 0){
                var catInfo = catDetails[0];
                res.render("admin/faq/category-new", { catInfo });
            }else{
                req.flash('error', 'Category not found.');
                res.redirect('/admin/faq-category-management/list');
            }
        }else{
            req.flash('error', 'CategoryId is missing.');
            res.redirect('/admin/faq-category-management/list');
        }
    }, 
}