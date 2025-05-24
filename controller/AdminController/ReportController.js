var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var reportModel = require("../../models/Report");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let reportList = await reportModel.list(conn);
        var currentPath = req.path;
        res.render("admin/report/list", { reportList, currentPath });
    },
    reportStatusAction: async function(req, res) {
        if(req.body.reportId){
            const reportId = req.body.reportId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await reportModel.update(conn, data, reportId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'User unblocked successfully',
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
                "message": 'ReportId is missing',
            });
        }
    },
}