conn = require("../config/db");
var couponModel = require("../models/Coupon");
var userModel = require("../models/User");
const { check, validationResult } = require('express-validator');
require('dotenv').config();

module.exports = {
    getOffers: async function(req, res) {
        const errors = validationResult(req);
        try {
            const userId = req.authuser.id;
            var userCouponStatus = await userModel.list(conn, userId);
            var couponStatus = userCouponStatus[0].welcome_coupon_status;
            let offerList = await couponModel.apiGetCoupon(conn,couponStatus);
            if(offerList != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'offer_list': offerList},
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "success",   
                    "data": { 'offer_list': []},
                    "message": 'success',
                });
            }
        } catch (error) {
            return res.status(201).json({
                "status": "error",   
                "message": error,
            });
        } 
    },
}