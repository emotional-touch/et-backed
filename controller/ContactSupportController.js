conn = require("../config/db");
var faqModel = require("../models/Faq");
var queryModel = require("../models/Query");
const { check, validationResult } = require('express-validator');
require('dotenv').config();

module.exports = {
    getSupportCategory: async function(req, res) {
        try {
            let userId = req.authuser.id;
            let userType = req.authuser.user_type;
            let categoryList = await faqModel.getSupportCategory(conn, userType);
            let queriesCount = await queryModel.queryCountGet(conn, userId);
            if(categoryList != ''){
                return res.status(200).json({
                    "status": "success",   
                    "data": { 'category_list': categoryList, 'query_count': queriesCount[0]},
                    "message": 'success',
                });
            }else{
                return res.status(201).json({
                    "status": "success",   
                    "data": { 'category_list': []},
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

    getCategoryQuestion: async function(req, res) {
          // validationResult function checks whether
       // any occurs or not and return an object
       const errors = validationResult(req);
   
       // If some error occurs, then this
       // block of code will run
       if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message": errorMessages[0],
            });
       }else{
            try {
                let categoryId = req.query.category_id;
                let userId = req.authuser.id;
                if (!isNaN(categoryId)){
                    var categoryQuestionList = await faqModel.getCategoryQuestion(conn, categoryId);
                }else{
                    if(categoryId == 'open'){
                        var queryType = '0';
                    }else{  
                        var queryType = '1';
                    }
                    var categoryQuestionList = await queryModel.queryListGet(conn, userId, queryType);
                }
                if(categoryQuestionList != ''){
                    return res.status(200).json({
                        "status": "success",   
                        "data": { 'category_question_list': categoryQuestionList},
                        "message": 'success',
                    });
                }else{
                    return res.status(201).json({
                        "status": "success",   
                        "data": { 'category_question_list': []},
                        "message": 'success',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": error,
                });
            } 
        }
    }, 
}