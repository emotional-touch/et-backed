var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var chargeModel = require("../../models/Charge");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
const ExcelJS = require('exceljs');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var currentPath = req.path;
        res.render("admin/report-analysis/list", { currentPath });
    },
    export: async function (req, res) {
        if (req.params.type) {
            const usertype = req.params.type;
            //console.log(usertype);
            let exportList = await chargeModel.typeList(conn, usertype);
            if (exportList.length > 0) {
                var exportInfo = exportList[0];
    
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Sheet 1');
    
                const columns = Object.keys(exportList[0]);
                worksheet.addRow(columns);
    
                exportList.forEach((row) => {
                    const values = columns.map((col) => row[col]);
                    worksheet.addRow(values);
                });
    
                const tempFilePath = 'exported_data.xlsx';
                workbook.xlsx
                    .writeFile(tempFilePath)
                    .then(() => {
                        //console.log('Data exported successfully to ' + tempFilePath);
    
                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=exported_data.xlsx');
    
                        const fileStream = fs.createReadStream(tempFilePath);
                        fileStream.pipe(res);
    
                        fileStream.on('close', () => {
                            fs.unlinkSync(tempFilePath);
                        });
                    });
            } else {
                req.flash('error', 'Something went wrong.');
                res.redirect('/admin/report-analysis/list');
            }
        } else {
            req.flash('error', 'User type is missing.');
            res.redirect('/admin/report-analysis/list');
        }
    }, 
}