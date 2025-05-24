var conn = require("../../config/db");
const WalletTransaction = require("../../models/WalletTransaction");
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var getTotalCommission = await WalletTransaction.getTotalOfAdminCommission(conn);
        var getTotalGiftCommission = await WalletTransaction.getGiftTotalOfAdminCommission(conn);
        var getTotalChatCommission = await WalletTransaction.getChatCallTotalOfAdminCommission(conn);
        getTotalCommission = getTotalCommission[0].total_commission;
        getTotalGiftCommission = getTotalGiftCommission[0].total_commission;
        getTotalChatCommission = getTotalChatCommission[0].total_commission;
        var currentPath = req.path;
        res.render("admin/commission/commission", { currentPath, getTotalCommission, getTotalGiftCommission, getTotalChatCommission });
    },

    getCommissionList: async function(req, res) {
        var { page, pageSize, search } = req.query;
        var offset = (page - 1) * pageSize;
        var limit = parseInt(pageSize);
        if (limit === -1) {
            limit = null;  // Use null to indicate no limit
            offset = null; // Use null to indicate no offset
        }
        let commissionList = await WalletTransaction.getDataOfAdminCommission(conn, limit, offset, search);
        res.json(commissionList);
    },

    gstList: async function(req, res) {
        var startDate = req.query.start_date;
        var endDate = req.query.end_date;

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
     
        // Check if startDate is greater than endDate
        if (startDateObj > endDateObj) {
             req.flash('error', 'End date must be greater then start date');
             res.redirect('back'); // startDate is greater than endDate
        }

         
        let gstList = await WalletTransaction.getGstData(conn, startDate, endDate);

        var getTotalGST = await WalletTransaction.getTotalGST(conn, 0, startDate, endDate);
        var getTotalGiftGST = await WalletTransaction.getTotalGST(conn, 2, startDate, endDate);
        var getTotalRechargeGST = await WalletTransaction.getTotalGST(conn, 1, startDate, endDate);
        getTotalGST = getTotalGST[0].total_gst;
        getTotalGiftGST = getTotalGiftGST[0].total_gst;
        getTotalRechargeGST = getTotalRechargeGST[0].total_gst;
        var currentPath = req.path;
        res.render("admin/gst/gst", { gstList, currentPath, getTotalGST, getTotalGiftGST, getTotalRechargeGST, startDate, endDate });
    },
}