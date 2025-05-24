var conn = require("../../config/db");
const homeController = require("../../controller/HomeController");
var chargeModel = require("../../models/Charge");
var messageModel = require("../../models/Message");
var userModel = require("../../models/User");
var emailTempleteModel = require("../../models/EmailTemplete");
const { check, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

module.exports = {
    list: async function(req, res) {
        var currentPath = req.path;
        let listenerList = await chargeModel.listListeners(conn);
        let userList = await chargeModel.listUsers(conn);
        res.render("admin/message/list", { listenerList, userList, currentPath });
    },
    filter: async function(req, res) {
        var user = req.body.user;
        var listener = req.body.listener;
        var service = req.body.service;
        var startdate = req.body.startdate;
        var enddate = req.body.enddate;

        if(service == 'chat'){
            let getMessage = await messageModel.filterChat(conn, user, listener, startdate, enddate);
            if(getMessage.length > 0){
                let htmlContent = "";
                let currentDate = null;
                for (let message of getMessage) {
                    let messageType = message.fromUserId == user ? 'sender' : 'repaly';
                    var profilePhoto = message.profile_photo; 
                    if(profilePhoto != '' && profilePhoto != null && profilePhoto != undefined){
                        var profilePhoto = profilePhoto.replace('https:/', 'https://');
                    }else{
                        var profilePhoto = '/images/default-profile.jpg';
                    }
                    var profilePhoto = profilePhoto.replace('https:/', 'https://');
                    // Check for date change
                    if (formatDate(message.date, "DD MMM, Y") != formatDate(currentDate, "DD MMM, Y")) {
                        htmlContent += `<li>
                                            <div class="divider">
                                                <h6>${formatDate(message.date, "DD MMM, Y")}</h6>
                                            </div>
                                        </li>`;
                        currentDate = message.date;
                    }
                    
                    if(messageType == 'sender'){
                        htmlContent += `<li class="${messageType}">
                                        <div class="chating">
                                            <img class="pro-img" src="${profilePhoto}" alt="">
                                        </div>
                                        <div class="txt">
                                            <p>${message.message}</p>
                                            <div class="other_data"> 
                                                <span class="${messageType}name">${message.user_name}</span>
                                                <span class="time">${formatTime(message.time)}</span>
                                            </div>
                                        </div>
                                    </li>`;
                    }else{
                        htmlContent += `<li class="${messageType}">
                                        <div class="txt">
                                            <p>${message.message}</p>
                                            <div class="other_data"> 
                                                <span class="${messageType}name">${message.user_name}</span>
                                                <span class="time">${formatTime(message.time)}</span>
                                            </div>
                                        </div>
                                        <div class="chating">
                                            <img class="pro-img" src="${profilePhoto}" alt="">
                                        </div>
                                    </li>`;
                    }
                }

                return res.status(200).json({
                    "status": "success",   
                    "data": htmlContent,
                });
            } else {
                return res.status(201).json({
                    "status": "error",   
                    "message": "No data found.",
                });
            }
        }
    },
    userDetails: async function(req, res) {
        var user = req.body.user;
        var listener = req.body.listener;

        let userDetails = await userModel.userDetailsPanel(conn, user);
        let listenerDetails = await userModel.userDetailsPanel(conn, listener);

        if(userDetails.length > 0 && listenerDetails.length > 0){
            var userInfo = userDetails[0];
            var listenerInfo = listenerDetails[0];
            let htmlContent = "";
            var userProfilePhoto = userInfo.profile_photo;
            var listenerProfilePhoto =  listenerInfo.profile_photo;
            if(userProfilePhoto != '' && userProfilePhoto != null && userProfilePhoto != undefined){
                var userProfilePhoto = userProfilePhoto.replace('https:/', 'https://');
            }else{
                var userProfilePhoto = '/images/default-profile.jpg';
            }
           
            if(listenerProfilePhoto != '' && listenerProfilePhoto != null && listenerProfilePhoto != undefined){
                var listenerProfilePhoto =  listenerProfilePhoto.replace('https:/', 'https://');
            }else{
                var listenerProfilePhoto = '/images/default-profile.jpg';
            }

            htmlContent += `<div class="row">
                                <div class="col-md-8 col-12">
                                    <div class="msg-profile">
                                        <div class="user-profile">
                                            <div class="headprofile_img">
                                                <img class="pro-img" src="${userProfilePhoto}" alt="">
                                            </div>
                                            <div class="user_names">
                                                <h3 class="pro-name">${userInfo.full_name}</h3>
                                                <p class="position">User</p>
                                            </div>
                            
                                        </div>
                                        <div class="listner-profile">
                                            <div class="headprofile_img">
                                                <img class="pro-img" src="${listenerProfilePhoto}" alt="">
                                            </div>
                                            <div class="user_names">
                                                <h3 class="pro-name">${listenerInfo.full_name}</h3>
                                                <p class="position">Listener</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                  
            return res.status(200).json({
                "status": "success",   
                "data": htmlContent,
            });
        } else {
            return res.status(201).json({
                "status": "error",   
                "message": "No data found.",
            });
        }
    },
}

function formatTime(date) {
    const options = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true };
    return new Date(date).toLocaleTimeString('en-US', options);
}

function formatDate(date, format) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}