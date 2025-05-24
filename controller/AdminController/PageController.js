var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var pageModel = require("../../models/Page");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let pageList = await pageModel.list(conn);
        var currentPath = req.path;
        res.render("admin/page/list", { pageList, currentPath });
    },
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/page/add-page", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/page-management/list');
        }else{
            if(req.body.pageId){
                const pageId = req.body.pageId;

                if (!req.files){
                    var image_data = null;
                }else if (req.files.image) {
                    const uploadedFile = req.files.image;
                    const imgName = 'cms_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                    const uploadPath = paths.join(__dirname, '../..', 'public', 'uploads', 'cms', imgName);
                    var image_data = paths.join(process.env.WEB_URL, 'public', 'uploads', 'cms', imgName);
                    uploadedFile.mv(uploadPath); 
                }else{
                    var image_data = null;
                }

                let data = {
                    title: req.body.title,
                    description: req.body.description,
                    image: image_data,
                    meta_title: req.body.meta_title,
                    meta_keywords: req.body.meta_keywords,
                    meta_description: req.body.meta_description,
                };

                try {
                    let resp = await pageModel.update(conn, data, pageId);
                    req.flash('success', 'Page updated successfully.');
                    res.redirect('/admin/page-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/page-management/list');
                }
            }else{
                req.flash('error', 'PageId is missing');
                res.redirect('/admin/page-management/list');
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const pageId = req.params.id;
            let pageDetails = await pageModel.details(conn, pageId);
            if(pageDetails.length > 0){
                var pageInfo = pageDetails[0];
                res.render("admin/page/add-page", { pageInfo });
            }else{
                req.flash('error', 'Page not found.');
                res.redirect('/admin/page-management/list');
            }
        }else{
            req.flash('error', 'Page Id is missing.');
            res.redirect('/admin/page-management/list');
        }
    }, 
    pageStatusAction: async function(req, res) {
        if(req.body.pageId){
            const pageId = req.body.pageId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await pageModel.update(conn, data, pageId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Page status updated successfully',
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
                "message": 'PageId is missing',
            });
        }
    },
}