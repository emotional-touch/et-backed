var conn = require("../../config/db");
var contactModel = require("../../models/Contact");
const { check, validationResult } = require('express-validator');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

module.exports = {
    contactRequestList: async function(req, res) {
        let contactList = await contactModel.list(conn);
        var currentPath = req.path;
        res.render("admin/contact/contact-list", { contactList, currentPath });
    },
    contactRequestDelete: async function(req, res) {
        const contactId = req.params.id;
        let contactDeleteCheck = await contactModel.delete(conn, contactId);
        if(contactDeleteCheck != ''){
            req.flash('success', 'Contact deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
}