var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var penaltyModel = require("../../models/Penalty");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let sessionDetails = await penaltyModel.details(conn, '1');
        let leaveDetails = await penaltyModel.details(conn, '2');
        var leaveInfo = leaveDetails[0];
        var sessionInfo = sessionDetails[0];
        var currentPath = req.path;
        res.render("admin/penalty/penalty-edit", { sessionInfo, leaveInfo, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/penalty-management/list');
        }else{
            if(req.body.penaltyId){
                const penaltyId = req.body.penaltyId;

                let data = {
                    no: req.body.no,
                    penalty_amount: req.body.penalty_amount,
                };

                try {
                    let resp = await penaltyModel.update(conn, data, penaltyId);
                    req.flash('success', 'Penalty updated successfully.');
                    res.redirect('/admin/penalty-management/list');
                } catch (error) {
                    req.flash('erro', error);
                    res.redirect('/admin/penalty-management/list');
                }
            }else{
                req.flash('error', 'PenaltyId is missing');
                res.redirect('/admin/penalty-management/list');
            }
        }
    },
    
}