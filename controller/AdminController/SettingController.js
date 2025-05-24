var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var settingModel = require("../../models/Setting");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let settingList = await settingModel.list(conn);
        var currentPath = req.path;
        res.render("admin/setting/list", { settingList, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/setting/list');
        }else{
            if(req.body.settingId){
                const settingId = req.body.settingId;

                if (!req.files){
                    var value = req.body.value;
                }else if (req.files.image) {
                    const uploadedFile = req.files.image;
                    const imgName = 'cms_'+ Math.round(Math.random() * 1E9) + '_' + uploadedFile.name;
                    const uploadPath = paths.join(__dirname, '../..', 'public', 'uploads', 'setting', imgName);
                    var value = paths.join(process.env.WEB_URL, 'public', 'uploads', 'setting', imgName);
                    uploadedFile.mv(uploadPath); 
                }else{
                    var value = req.body.value;
                }

                let data = {
                    value: value,
                };

                try {
                    let resp = await settingModel.update(conn, data, settingId);
                    req.flash('success', 'Setting updated successfully.');
                    res.redirect('/admin/setting/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/setting/list');
                }
            }else{
                req.flash('error', 'SettingId is missing');
                res.redirect('/admin/setting/list');
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const settingId = req.params.id;
            let settingDetails = await settingModel.details(conn, settingId);
            if(settingDetails.length > 0){
                var settingInfo = settingDetails[0];
                res.render("admin/setting/add-setting", { settingInfo });
            }else{
                req.flash('error', 'Setting not found.');
                res.redirect('/admin/setting/list');
            }
        }else{
            req.flash('error', 'SettingId is missing.');
            res.redirect('/admin/setting/list');
        }
    }, 
}