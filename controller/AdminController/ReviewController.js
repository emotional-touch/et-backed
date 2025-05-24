var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var reviewModel = require("../../models/Review");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const paths = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        let reviewList = await reviewModel.list(conn);
        var currentPath = req.path;
        res.render("admin/review/list", { reviewList, currentPath });
    },
    reviewStatusAction: async function(req, res) {
        if(req.body.reviewId){
            const reviewId = req.body.reviewId;
            const status = req.body.status;
            let data = {
                status: status,
            };
            try {
                let resp = await reviewModel.update(conn, data, reviewId);
                return res.status(200).json({
                 "status": "success",   
                 "message": 'Status updated successfully',
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
    details: async function(req, res) {
        if(req.params.id){
            const userId = req.params.id;
            let reviewReceived = await reviewModel.receivedReviewDetails(conn, userId);
            let reviewGiven = await reviewModel.givenReviewDetails(conn, userId);
            let listenerDetails = await reviewModel.userDetails(conn, userId);
            
            //if(reviewGiven.length > 0){
                var listenerInfo = listenerDetails[0];
                var reviewGivenInfo = reviewGiven[0];
                var reviewReceivedInfo = reviewReceived[0];
                res.render("admin/review/view-review", { reviewReceivedInfo, reviewGivenInfo, listenerInfo, reviewGiven, reviewReceived });
            //}else{
                //req.flash('error', 'Review not found.');
               // res.redirect('/admin/review-management/list');
            //}/
        }else{
            req.flash('error', 'Review Id is missing.');
            res.redirect('/admin/review-management/list');
        }
    }, 
    deleteReview: async function(req, res) {
        const reviewId = req.params.id;
        let reviewCheck = await reviewModel.delete(conn, reviewId);
        if(reviewCheck != ''){
            req.flash('success', 'Review deleted successfully.');
            res.redirect('back');
        }else{
            req.flash('error', 'Something went wrong.');
            res.redirect('back');
        }
    },  
}