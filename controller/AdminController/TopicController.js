var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var topicModel = require("../../models/Topic");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let topicList = await topicModel.list(conn);
        var currentPath = req.path;
        res.render("admin/topic/list", { topicList, currentPath });
    },
    delete: async function(req, res) {
        const topicId = req.params.id;
        //console.log(topicId);
        let topicCheck = await topicModel.delete(conn, topicId);
        if(topicCheck != ''){
            req.flash('success', 'Topic deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/topic/add-topic", { currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('erro', errorMessages);
                res.redirect('/admin/topic-management/list');
        }else{
            if(req.body.topicId){
                const topicId = req.body.topicId;

                let data = {
                    name: req.body.name,
                };

                try {
                    let resp = await topicModel.update(conn, data, topicId);
                    req.flash('success', 'Topic updated successfully.');
                    res.redirect('/admin/topic-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/topic-management/list');
                }
            }else{
                let data = {
                    name: req.body.name,
                    status: 1,
                };
                try {
                    let resp = await topicModel.insert(conn, data);
                    
                    req.flash('success', 'Topic added successfully.');
                    res.redirect('/admin/topic-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/topic-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const topicId = req.params.id;
            let topicDetails = await topicModel.details(conn, topicId);
            if(topicDetails.length > 0){
                var topicInfo = topicDetails[0];
                res.render("admin/topic/add-topic", { topicInfo });
            }else{
                req.flash('error', 'Topic not found.');
                res.redirect('/admin/topic-management/list');
            }
        }else{
            req.flash('error', 'TopicId is missing.');
            res.redirect('/admin/topic-management/list');
        }
    }, 
    topicStatusAction: async function(req, res) {
        if(req.body.topicId){
            const topicId = req.body.topicId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await topicModel.update(conn, data, topicId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Topic status updated successfully',
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
                "message": 'TopicId is missing',
            });
        }
    },
}