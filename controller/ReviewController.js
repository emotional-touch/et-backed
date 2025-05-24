conn = require("../config/db");
var reviewRatingModel = require("../models/ReviewRating");
var userModel = require("../models/User");
const { check, validationResult } = require('express-validator');
require('dotenv').config();

module.exports = {
    writeReview: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                let findReview = await reviewRatingModel.findReview(conn, userId, req.body.listener_id);
                var reviewData = {
                    'user_id': userId,
                    'listner_id': req.body.listener_id,
                    'rating': req.body.rating,
                    'review': req.body.review,
                };
                let writeReview = await reviewRatingModel.insert(conn, reviewData);
                return res.status(200).json({
                    "status": "success",   
                    "message": 'Thank you for your feedback.',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },
    getReceivedReview: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let userId = req.authuser.id;
                let reviewListing = await userModel.listenerReviewList(conn, userId);
                return res.status(200).json({
                    "status": "success",   
                    "data": {'reviewListing':reviewListing},
                    "message": 'success',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },
    deleteReview: async function(req, res) {
        const errors = validationResult(req);
   
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let reviewId = req.body.review_id;
                let deleteReview = await reviewRatingModel.apiDeleteReview(conn, reviewId);
                return res.status(200).json({
                    "status": "success",   
                    "message": 'Review deleted successfully',
                });
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    },
}