var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var roleModel = require("../../models/AdminRole");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let roleList = await roleModel.list(conn);
        var currentPath = req.path;
        res.render("admin/role/list", { roleList, currentPath });
    },
    delete: async function(req, res) {
        const roleId = req.params.id;
        //console.log(roleId);
        let roleCheck = await roleModel.delete(conn, roleId);
        if(roleCheck != ''){
            req.flash('success', 'Role deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
    add: async function(req, res) {
        var currentPath = req.path;
        const permissionArray = ['User Management', 'Listener Account Request', 'Listener Profile Approval Request', 'Contact Management', 'Page Management', 'Email Management', 'Topic Management', 'Sub Admin Management', 'Role Management', 'Messages, Audio, Video', 'Coupon Management', 'Refer and Earn Management', 'Review Management', 'FAQ Category', 'FAQ Management', 'Report Management', 'Recharge Plan Management', 'Queries Management', 'Payment Management', 'Charge Management', 'Penalty Management', 'Reports and Analysis', 'Settings'];

        res.render("admin/role/add-role", { permissionArray, currentPath });
    },
    save: async function(req, res) {
        // validationResult function checks whether
        // any occurs or not and return an object
        const errors = validationResult(req);
    
        // If some error occurs, then this
        // block of code will run
        if (!errors.isEmpty()) {
                req.flash('error', errorMessages);
                res.redirect('/admin/role-management/list');
        }else{
            if(req.body.roleId){
                const roleId = req.body.roleId;

                var objectTest = req.body;
                const permissionArray = objectTest['permission[]'];
                var result_e = permissionArray.join(',');

                let data = {
                    name: req.body.name,
                    permission: result_e,
                };

                try {   
                    let resp = await roleModel.update(conn, data, roleId);
                    req.flash('success', 'Role updated successfully.');
                    res.redirect('/admin/role-management/list');
                } catch (error) {
                    req.flash('error', error);
                    res.redirect('/admin/role-management/list');
                }
            }else{

                var objectTest = req.body;
                const permissionArray = objectTest['permission[]'];
                var result_a = Array.isArray(permissionArray) ? permissionArray.join(',') : permissionArray;


                let data = {
                    name: req.body.name,
                    permission: result_a,
                };

                try {
                    let resp = await roleModel.insert(conn, data);
                    
                    req.flash('success', 'Role added successfully.');
                    res.redirect('/admin/role-management/list');
                } catch (error) {
                    req.flash('error', error);
                    //console.log(error);
                    res.redirect('/admin/role-management/list');
                }
            }
        }
    },
    edit: async function(req, res) {
        if(req.params.id){
            const roleId = req.params.id;
            let roleDetails = await roleModel.details(conn, roleId);

            const permissionArray = ['User Management', 'Listener Account Request', 'Listener Profile Approval Request', 'Contact Management', 'Page Management', 'Email Management', 'Topic Management', 'Sub Admin Management', 'Role Management', 'Messages, Audio, Video', 'Coupon Management', 'Refer and Earn Management', 'Review Management', 'FAQ Category', 'FAQ Management', 'Report Management', 'Recharge Plan Management', 'Queries Management', 'Payment Management', 'Charge Management', 'Penalty Management', 'Reports and Analysis', 'Settings'];

            if(roleDetails.length > 0){
                var roleInfo = roleDetails[0];
                res.render("admin/role/add-role", { permissionArray, roleInfo });
            }else{
                req.flash('error', 'Role not found.');
                res.redirect('/admin/role-management/list');
            }
        }else{
            req.flash('error', 'Role Id is missing.');
            res.redirect('/admin/role-management/list');
        }
    }, 
    
}