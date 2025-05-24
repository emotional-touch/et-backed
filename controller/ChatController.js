var conn = require("../config/db");
var reportModel = require("../models/Report");
var chatModel = require("../models/Chat");
var userModel = require("../models/User");
var activityLog = require("../models/ActivityLog");
var chargeModel = require("../models/Charge");
var serviceFeesModel = require("../models/ServiceFees");
var walletModel = require("../models/Wallet");
var sessionMissedTbl = require("../models/SessionMissedTbl");
var nickNameModel = require("../models/NickName");
var notificationModel = require("../models/Notification");
var activityLogModel = require("../models/ActivityLog");
var WalletTransaction = require("../models/WalletTransaction");
const helpers = require('../helpers');
const { check, validationResult } = require('express-validator');
const path = require('path');
require('dotenv').config();

module.exports = {
    getChatList:async function(data, socketId) {
        let userId = data.userId;
        let keyword = data.keyword;
        let userType = data.userType;
        let chatListType = data.chatListType;
        try {
            if(userType == 'user'){
                var listData = await chatModel.logList(conn, userId, keyword);
            }else{
                if(chatListType == 'inbox'){
                    var listData = await chatModel.inboxLogList(conn, userId, keyword);
                }else{
                    var listData = await chatModel.otherLogList(conn, userId, keyword);
                }
            }
            //let listData = await chatModel.logList(conn, userId, keyword);
            //---> let listData = await chatModel.list(conn, userId, keyword);
            return listData;
        } catch (error) {
            //console.log(error);
           return false;
        }
       
    },
    getChatMessage:async function(data) {
        let fromId = data.fromId;
        let toId = data.toId;
        try {
            let chatData = await chatModel.chatMessage(conn, fromId, toId);
            return chatData;
        } catch (error) {
           return false;
        }
       
    },
    readStatusUpdate:async function(data) {
        let fromId = data.fromId;
        let toId = data.toId;
        let updateData = {
            read_status: 1
        };
        try {
            let readData = await chatModel.readStatusUpdate(conn, updateData, fromId, toId);
            //---> let readData = await chatModel.readStatusUpdate(conn, updateData, fromId, toId);
            return readData;
        } catch (error) {
           return false;
        }
       
    },
    sendChatMessage:async function(data) {
        let sendMessageData = {
            from_id: data.fromId,
            to_id: data.toId,
            type: data.type,
            message: data.message,
            date: data.date,
            time: data.time,  
            ip: data.ip,
        };
        try {
            let sendData = await chatModel.sendChatMessage(conn, sendMessageData);
            let newMessage = await chatModel.getNewChatMessage(conn, sendData.insertId);
            return newMessage[0];
        } catch (error) {
           return false;
        }
    },
    socketConnect:async function(data, socketId) {
        let userId = data.userId;
        let socketData = {
            socket_id: socketId,
            online_status: 2,
            last_seen: null
        };
        try {
            let updateSocket = await chatModel.updateSocket(conn, socketData, userId);
            return updateSocket;
        } catch (error) {
           return false;
        }
    },
    sendServiceRequest:async function(data) {
        //console.log(data);
        var currentTimeDate = new Date();
        try {
            // balance check for request
            let userCheck = await userModel.list(conn, data.fromId);
            let receiverData = await userModel.list(conn, data.toId);
            var balanceCheck = await checkBalanceForRequest(conn, userCheck[0], receiverData[0], data.serviceType);
           
            var fromNickName = await nickNameModel.filterNameFind(conn, data.toId, data.fromId);
            var toNickName = await nickNameModel.filterNameFind(conn, data.fromId, data.toId);
            fromNickName = fromNickName[0].full_name;
            toNickName = toNickName[0].full_name;

            var checkBlockReport = await reportModel.checkBlockReport(conn, data.fromId, data.toId);
            if(checkBlockReport != ''){
                var typeUser = 'user';
                if(receiverData[0].user_type == 'listner'){
                    var typeUser = 'listener';
                }
                
                if(data.fromId  == checkBlockReport[0].report_by){
                    var errorMsg = 'This '+typeUser+' has been blocked by you';
                }else{
                    var errorMsg = 'You have been blocked by this '+typeUser;
                }
                var lowBalanceStatus = false;

                var returnFromUserData = {
                    'user_id': receiverData[0].id,
                    'full_name': toNickName,
                    'profile_photo':receiverData[0].profile_photo,
                    'service_type':data.serviceType,
                    'request_status': 'cancelled',
                    'request_id': null,
                    'error_msg': errorMsg,
                    'lowBalance': lowBalanceStatus
                } 
                var returnData = {
                    'returnFromUserData':returnFromUserData,
                    'returnError': 1
                }
                return returnData;
            }
            if(userCheck[0].wallet_freeze_status == 1 || receiverData[0].wallet_freeze_status == 1){
                if(userCheck[0].wallet_freeze_status == 1){
                    var errorMsg = 'Your wallet is frozen by the admin.';
                }else{
                    if(receiverData[0].user_type == 'user'){
                        var errorMsg = 'User wallet is frozen by the admin.';
                    }else{
                        var errorMsg = 'Listener wallet is frozen by the admin.'; 
                    }
                }
                var lowBalanceStatus = false;

                var returnFromUserData = {
                    'user_id': receiverData[0].id,
                    'full_name': toNickName,
                    'profile_photo':receiverData[0].profile_photo,
                    'service_type':data.serviceType,
                    'request_status': 'cancelled',
                    'request_id': null,
                    'error_msg': errorMsg,
                    'lowBalance': lowBalanceStatus
                } 
                var returnData = {
                    'returnFromUserData':returnFromUserData,
                    'returnError': 1
                }
                return returnData;
            }

            if(balanceCheck == 0){
                if(userCheck[0].user_type == 'listner' && receiverData[0].user_type == 'user'){
                    var storeActivityData = {
                        from_id:data.fromId,
                        to_id:data.toId,
                        text:'I tried calling you but your balance is low.',
                        log_type:'message'
                    };
                    let storeActivityLog = await activityLog.storeActivityLog(conn, storeActivityData);
                    var errorMsg = 'User have low balance for that request.';
                    var lowBalanceStatus = false;
                }else{
                    var errorMsg = 'You have low balance for that request.';
                    var lowBalanceStatus = true;
                }
                
                var returnFromUserData = {
                    'user_id': receiverData[0].id,
                    'full_name': toNickName,
                    'profile_photo':receiverData[0].profile_photo,
                    'service_type':data.serviceType,
                    'request_status': 'cancelled',
                    'request_id': null,
                    'error_msg': errorMsg,
                    'lowBalance': lowBalanceStatus
                } 
                var returnData = {
                    'returnFromUserData':returnFromUserData,
                    'returnError': 1
                }
                return returnData;
            }
            
            var message = '';
            if(receiverData[0].online_status != 2){
                var message = data.message;
            }
            let sendRequestData = {
                from_id: data.fromId,
                to_id: data.toId,
                service_type: data.serviceType,
                message: message,
                room_name: data.roomName,
                request_status: receiverData[0].online_status != 2 ? 'cancelled' : 'pending',
            };
            let sendServiceRequest = await chatModel.sendServiceRequestData(conn, sendRequestData);
            //var textMsgArray = getLogMessage(userCheck[0].full_name, data.serviceType, currentTimeDate);
           // var textMsg = fromNickName+' send '+textMsgArray.serviceName+' request at '+textMsgArray.formattedTime+' on '+textMsgArray.formattedDate;
            // var storeActivityData = {
            //     from_id:data.fromId,
            //     to_id:data.toId,
            //     text:textMsg,
            // };
            //let storeActivityLog = await activityLog.storeActivityLog(conn, storeActivityData);
            if(receiverData[0].online_status != 2){
                var storeOtherActivityData = {
                    from_id:data.fromId,
                    to_id:data.toId,
                    text:message,
                    log_type:'message'
                };
                let storeOtherActivityLog = await activityLog.storeActivityLog(conn, storeOtherActivityData);

                // notification code
                var storeNotificationData = {
                    user_id:data.toId,
                    name:fromNickName,
                    screen_type:'log',
                    message:'You have missed '+data.serviceType+' from '+fromNickName,
                    opponent_id: data.fromId,
                    online_notify: 1,
                    read_status: 0
                };
                let storeNotification = await notificationModel.insert(conn, storeNotificationData);
            }
            var returnToUserData = {
                'user_id': userCheck[0].id,
                'full_name': fromNickName,
                'profile_photo':userCheck[0].profile_photo,
                'service_type':data.serviceType,
                'request_status': receiverData[0].online_status != 2 ? 'cancelled' : 'pending',
                'request_id':sendServiceRequest.insertId,
            };
            var returnFromUserData = {
                'user_id': receiverData[0].id,
                'full_name': toNickName,
                'profile_photo':receiverData[0].profile_photo,
                'service_type':data.serviceType,
                'request_status': receiverData[0].online_status != 2 ? 'cancelled' : 'requested',
                'request_id':sendServiceRequest.insertId,
            } 
            var returnData = {
                'returnToUserData':returnToUserData,
                'returnFromUserData':returnFromUserData,
                'returnError': ''
            }
            return returnData;
        } catch (error) {
           return false;
        }
    },
    actionServiceRequest: async function(data) {
        //console.log(data);
        var fromNickName = await nickNameModel.filterNameFind(conn, data.toId, data.fromId);
        var toNickName = await nickNameModel.filterNameFind(conn, data.fromId, data.toId);
        var uData = fromNickName[0];
        fromNickName = fromNickName[0].full_name;
        toNickName = toNickName[0].full_name;
    
        var currentTimeDate = new Date();
        if(data.requestStatus == 'accepted'){
            var actionRequestData = {
                start_time: currentTimeDate,
                request_status: data.requestStatus,
            };
        }else if(data.requestStatus == 'completed'){
            var actionRequestData = {
                end_time: currentTimeDate,
                request_status: data.requestStatus,
            };
        }else{
            var actionRequestData = {
                request_status: data.requestStatus,
            };
        }
        try {
            let userCheck = await userModel.list(conn, data.fromId);
            let receiverData = await userModel.list(conn, data.toId);
            let actionRequest = await activityLog.editServiceRequestData(conn, data.requestId, actionRequestData);
            let activityData = await activityLog.getServiceRequest(conn, data.requestId);
            let activity = activityData[0];
           
            var textMsgArray = getLogMessage(userCheck[0].full_name, activity.service_type, currentTimeDate);
            var userLogName = 'Listener';
            if(uData.user_type == 'user'){
                var userLogName = 'User';
            }
            var textMsg = userLogName+' '+activity.request_status+' '+textMsgArray.serviceName+' request at '+textMsgArray.formattedTime+' on '+textMsgArray.formattedDate;
            var storeActivityData = {
                from_id:data.fromId,
                to_id:data.toId,
                text:textMsg,
                session_type: activity.service_type
            };
            if(data.requestStatus == 'accepted'){
                storeActivityData.type = 'accepted';
            }else if(data.requestStatus == 'declined'){
                if(userCheck[0].user_type == 'listner'){
                    var missedSessionData = {
                        user_id: userCheck[0].id,
                        activity_id: data.requestId,
                        session_date:currentTimeDate 
                    };
                    await sessionMissedTbl.addMissedSession(conn, missedSessionData);
                }
                storeActivityData.type = 'declined';
            }else if(data.requestStatus == 'missed'){
                if(receiverData[0].user_type == 'listner'){
                    var missedSessionData = {
                        user_id: receiverData[0].id,
                        activity_id: data.requestId,
                        session_date:currentTimeDate 
                    };
                    await sessionMissedTbl.addMissedSession(conn, missedSessionData);
                }

                var missedUserLogName = 'User';
                if(uData.user_type == 'user'){
                    var missedUserLogName = 'Listener';
                }
                var missedTextMsg = missedUserLogName+' '+activity.request_status+' '+textMsgArray.serviceName+' request at '+textMsgArray.formattedTime+' on '+textMsgArray.formattedDate;
                storeActivityData.text = missedTextMsg;
            }
            if(data.requestStatus != 'accepted' && data.requestStatus != 'completed'){
                let storeActivityLog = await activityLog.storeActivityLog(conn, storeActivityData);
            }
           

            var returnToUserData = {
                'from_id': data.fromId,
                'to_id': data.toId,
                'user_id': userCheck[0].id,
                'full_name':fromNickName,
                'profile_photo':userCheck[0].profile_photo,
                'service_type':activity.service_type,
                'request_status':activity.request_status,
                'request_id':activity.id,
            };
            var returnFromUserData = {
                'from_id': data.fromId,
                'to_id': data.toId,
                'user_id': receiverData[0].id,
                'full_name':toNickName,
                'profile_photo':receiverData[0].profile_photo,
                'service_type':activity.service_type,
                'request_status':activity.request_status,
                'request_id':activity.id,
            };

            if(data.requestStatus == 'completed'){
               
                var timeArray = getLogMessage(userCheck[0].full_name, activity.service_type, activity.start_time);
                const startTime = new Date(activity.start_time);
                // Calculate the time difference in milliseconds
                const timeDifferenceInMilliseconds = currentTimeDate - startTime;

                // Convert milliseconds to minutes
                const timeDifferenceInMinutes = timeDifferenceInMilliseconds / (1000 * 60);

                var editData = {
                    'duration': Math.ceil(timeDifferenceInMinutes),
                };
                let edit = await activityLog.editServiceRequestData(conn, data.requestId, editData);

                var textNewMsg = 'Call Session at '+timeArray.formattedTime+' on '+timeArray.formattedDate+' for '+Math.ceil(timeDifferenceInMinutes)+' minute';
                var storeActivityLogData = {
                    from_id:data.fromId,
                    to_id:data.toId,
                    text:textNewMsg,
                    session_type: activity.service_type
                };
                let storeActivityEvent= await activityLog.storeActivityLog(conn, storeActivityLogData);

                var sessionStatus = {
                    'session_status':0,
                    'read_status':1
                };
                let updateSessionStatus = await chatModel.sessionDataUpdate(conn,sessionStatus,data.fromId,data.toId);
                var updateWallet = await deductChargeAmount(conn, activity.id, activity.service_type, receiverData[0], userCheck[0], Math.ceil(timeDifferenceInMinutes), activity);
                var fromUser = receiverData[0];
                var toUser = userCheck[0];
                if(fromUser.user_type == 'listner' && toUser.user_type == 'user'){
                    // first two balance clear
                    returnToUserData.rating_status = 0;
                    returnFromUserData.rating_status = 1;
                }else if(fromUser.user_type == 'user' && toUser.user_type == 'listner'){
                    returnFromUserData.rating_status = 0;
                    returnToUserData.rating_status = 1;
                }else{
                    if(activity.from_id == fromUser.id){
                        returnToUserData.rating_status = 1;
                        returnFromUserData.rating_status = 0;
                    }else{
                        returnToUserData.rating_status = 0;
                        returnFromUserData.rating_status = 1;
                    }
                }
            }

           

            if(data.requestStatus == 'accepted'){
                var fromUser = receiverData[0];
                var toUser = userCheck[0];
                if(fromUser.user_type == 'listner' && toUser.user_type == 'user'){
                    var balanceUserId = toUser.id;
                    var chargeUserId = fromUser.id;
                    var userRes = 'to';
                }else if(fromUser.user_type == 'user' && toUser.user_type == 'listner'){
                    var balanceUserId = fromUser.id;
                    var chargeUserId = toUser.id;
                    var userRes = 'from';
                }else{
                    var balanceUserId = fromUser.id;
                    var chargeUserId = toUser.id;
                    var userRes = 'from';
                }
                var timerSeconds = await getTimerSeconds(conn, activity.service_type, balanceUserId, chargeUserId);
                var alertBuzzerTime = timerSeconds - 300;
                if(userRes == 'from'){
                    //returnToUserData.secoundsTimer = timerSeconds;
                    returnToUserData.alertBuzzerTimer = parseInt(alertBuzzerTime);
                }else{
                    //returnFromUserData.secoundsTimer = timerSeconds;
                    returnFromUserData.alertBuzzerTimer = parseInt(alertBuzzerTime);
                }
                returnFromUserData.secoundsTimer = timerSeconds - 3;
                returnToUserData.secoundsTimer = timerSeconds;

                var fromCommunicateStatus = await chatModel.firstCommunicateRequestFind(conn, data.fromId);
                if(fromCommunicateStatus != ''){
                    returnFromUserData.first_communication = 0;
                }else{
                    returnFromUserData.first_communication = 1;
                }

                var toCommunicateStatus = await chatModel.firstCommunicateRequestFind(conn, data.toId);
                if(toCommunicateStatus != ''){
                    returnToUserData.first_communication = 0;
                }else{
                    returnToUserData.first_communication = 1;
                }
               
            }
           
            if(data.requestStatus == 'accepted' && (activity.service_type == 'vcall' || activity.service_type == 'call')){
                returnToUserData.room_name =  activity.room_name;
                returnFromUserData.room_name =  activity.room_name;
            }
            if(data.requestStatus == 'completed' || data.requestStatus == 'cancelled' || data.requestStatus == 'declined' || data.requestStatus == 'missed'){
                var fromUserStatus = userCheck[0].socket_id == null ? 0 : 2;
                var toUserStatus = receiverData[0].socket_id == null ? 0 : 2;
                await userModel.update(conn, {'online_status':fromUserStatus}, userCheck[0].id);
                await userModel.update(conn, {'online_status':toUserStatus}, receiverData[0].id);
            }

            if(data.requestStatus == 'accepted'){
                await userModel.update(conn, {'online_status':1}, data.fromId);
                await userModel.update(conn, {'online_status':1}, data.toId);
            }
            var returnData = {
                'returnToUserData':returnToUserData,
                'returnFromUserData':returnFromUserData
            }
            //console.log('--------- return --------------');
            //console.log(returnData);
            return returnData;
        } catch (error) {
            //console.log(error);
           return false;
        }
    },
    getLogMessageData:async function(data) {
        let fromId = data.fromId;
        let toId = data.toId;
        try {
            let logData = await activityLog.logMessage(conn, fromId, toId);
            //console.log('------- Log Message 2 -----');
            //console.log(logData);
            return logData;
        } catch (error) {
           return false;
        }
       
    },
    getOnlineOflineStatus:async function(data) {
        let userId = data.userId;
        try {
            let statusData = await chatModel.getOnlineOflineStatus(conn, userId);
            return statusData;
        } catch (error) {
           return false;
        }
       
    },
    updateServiceToggleInfo:async function(data) {
        var userId = data.userId;
        let updateData = {
            service_toggle_status: data.serviceToggleStatus,
            service: data.service
        };
        try {
            let updateArrayData = await userModel.update(conn, updateData, userId);
            return updateArrayData;
        } catch (error) {
            //console.log(error);
           return false;
        }
    },
    dragOtherToInbox: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message":  errorMessages[0],
            });
        }else{
            let listenerId = req.authuser.id;
            let inboxUserId = req.query.inbox_user_id;
            try {
                let findData = await chatModel.dragOtherToInboxFind(conn, listenerId, inboxUserId);
                if (!findData) { 
                    let fieldData = {
                        listener_id: listenerId,
                        inbox_user_id: inboxUserId,
                    };
                    let storeData = await chatModel.dragOtherToInboxInsert(conn, fieldData);
                    return res.status(200).json({
                        "status": "success",   
                        "message": 'Transfer user to inbox successfully',
                    });
                }else{
                    return res.status(201).json({
                        "status": "error",   
                        "message": 'User already in inbox',
                    });
                }
               
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": 'Something went wrong',
                });
            }
        }
       
    },
    addNickname: async function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(201).json({
                "status": "error",   
                "message":  errorMessages[0],
            });
        }else{
            let listenerId = req.authuser.id;
            let userId = req.query.user_id;
            let nickName =  req.query.nick_name;
            try {
                var findData = await nickNameModel.nickNameFind(conn, listenerId, userId);
                if (findData != '') { 
                    var fieldData = {
                        nick_name: nickName,
                    };
                    var updateData = await nickNameModel.nickNameUpdate(conn, fieldData, findData[0].id);
                    return res.status(200).json({
                        "status": "success",   
                        "message": 'Nick name updated successfully',
                    });
                }else{
                    var fieldData = {
                        listener_id: listenerId,
                        user_id: userId,
                        nick_name: nickName,
                    };
                    var storeData = await nickNameModel.nickNameInsert(conn, fieldData);
                    return res.status(200).json({
                        "status": "success",   
                        "message": 'Nick name added successfully',
                    });
                }
            } catch (error) {
                return res.status(201).json({
                    "status": "error",   
                    "message": 'Something went wrong',
                });
            }
        }
       
    },
    
    deductCharge: async function(serviceReqId, serviceType, fromUser, toUser, duration, activity) {
        deductChargeAmount(conn, serviceReqId, serviceType, fromUser, toUser, duration, activity);
    },

    sendFreeMessage: async function(data) {
        var fromNickName = await nickNameModel.filterNameFind(conn, data.toId, data.fromId);
        fromNickName = fromNickName[0].full_name;
        try {
            var storeOtherActivityData = {
                from_id:data.fromId,
                to_id:data.toId,
                text:data.message,
                log_type:'message',
                free_msg: 1,
            };
            let storeOtherActivityLog = await activityLog.storeActivityLog(conn, storeOtherActivityData);
            // notification code
            var storeNotificationData = {
                user_id:data.toId,
                name:fromNickName,
                screen_type:'log',
                message:'You have new message from '+fromNickName,
                opponent_id: data.fromId,
                online_notify: 0,
                read_status: 0
            };
            let storeNotification = await notificationModel.insert(conn, storeNotificationData);
            let latestlogData = await activityLog.latestLogMessage(conn, storeOtherActivityLog.insertId);
            var fromFreeMsgStatus = false;
            var toFreeMsgStatus = false;
            var fromData = await userModel.list(conn, data.fromId);
            var toData = await userModel.list(conn, data.toId);
            if(fromData[0].user_type == 'listner'){
                let fromFreeMsgCount = await activityLogModel.freeMessageCount(conn, data.fromId, data.toId);
                if(fromFreeMsgCount[0].free_msg_count < 2){
                    var fromFreeMsgStatus = true;
                }
            }
            if(toData[0].user_type == 'listner'){
                let toFreeMsgCount = await activityLogModel.freeMessageCount(conn, data.toId, data.fromId);
                if(toFreeMsgCount[0].free_msg_count < 2){
                    var toFreeMsgStatus = true;
                }
            }

            var returnFromData = {
                'log_data': latestlogData[0],
                'free_msg_status': fromFreeMsgStatus,
            };

            var returnToData = {
                'log_data': latestlogData[0],
                'free_msg_status': toFreeMsgStatus,
            };
            var returnData = {
                'returnFromData':returnFromData,
                'returnToData':returnToData,
            }
            return returnData;
        } catch (error) {
           return false;
        }
    },
  

}

function getLogMessage(name, serviceType, currentTimeDate){
    var serviceName = 'chat';
    if(serviceType == 'call'){
        serviceName = 'call';
    }else if(serviceType == 'vcall'){
        serviceName = 'video call';
    }
    // Format the time with AM/PM
    const formattedTime = currentTimeDate.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true });
    // Get the current date
    const day = currentTimeDate.getDate().toString().padStart(2, '0');
    const month = (currentTimeDate.getMonth() + 1).toString().padStart(2, '0');
    const year = currentTimeDate.getFullYear();
    
    // Format the date in "DD-MM-YYYY" format
    const formattedDate = `${day}-${month}-${year}`;
    var arrayData = {
        'name':name,
        'serviceName':serviceName,
        'formattedTime':formattedTime,
        'formattedDate':formattedDate
    };
    return arrayData;
}

async function checkBalanceForRequest(conn, own, other, serviceType){
    if(own.user_type == 'user'){
        var serviceCharge =  await chargeModel.getListenerCharge(conn, other.id);
        var walletBalance = await walletModel.walletBalance(conn, own.id);
        var Balance = parseInt(walletBalance[0].balance);
    }else if(own.user_type == 'listner' && other.user_type == 'user'){
        var serviceCharge =  await chargeModel.getListenerCharge(conn, own.id);
        var walletBalance = await walletModel.walletBalance(conn, other.id);
        var Balance = parseInt(walletBalance[0].balance);
    }else{
        var serviceCharge =  await chargeModel.getListenerCharge(conn, other.id);
        var walletBalance = await walletModel.walletBalance(conn, own.id);
        var Balance = parseInt(walletBalance[0].balance);
    } 

    if(serviceType == 'chat'){
        var minimumBalance = parseInt(serviceCharge[0].chat_charge)*5;
    }else if(serviceType == 'call'){
        var minimumBalance = parseInt(serviceCharge[0].call_charge)*5;
    }else{
        var minimumBalance = parseInt(serviceCharge[0].vcall_charge)*5;
    }
    var chargeStatus = 0;

    if(Balance >= minimumBalance){
        chargeStatus = 1;
    }

   return chargeStatus;
}

async function getTimerSeconds(conn, serviceType, balanceUserId, chargeUserId){
    var serviceCharge =  await chargeModel.getListenerCharge(conn, chargeUserId);
    var walletBalance = await walletModel.walletBalance(conn, balanceUserId);
    var Balance = parseInt(walletBalance[0].balance);

    if(serviceType == 'chat'){
        var chargePerSecond = parseInt(serviceCharge[0].chat_charge)/60;
    }else if(serviceType == 'call'){
        var chargePerSecond = parseInt(serviceCharge[0].call_charge)/60;
    }else{
        var chargePerSecond = parseInt(serviceCharge[0].vcall_charge)/60;
    }

    var numberOfSeconds = Balance/chargePerSecond; 
    var minutes = Math.floor(numberOfSeconds / 60);
    var finalSeconds = minutes*60;

    return finalSeconds;
}

async function deductChargeAmount(conn, serviceReqId, serviceType, fromUser, toUser, duration, activity){
    if((toUser.id != 3831 && toUser.id != 3832 && fromUser.id != 3831 && fromUser.id != 3832)){
        let walletEntryCheck = await WalletTransaction.walletEntryCheck(conn, serviceReqId);
        if(walletEntryCheck == 0){
            if(fromUser.user_type == 'listner' && toUser.user_type == 'user'){
                var balanceUserId = toUser.id;
                var chargeUserId = fromUser.id;
                var chargeNickName = await nickNameModel.filterNameFind(conn, balanceUserId, chargeUserId);
                var deductNickName = await nickNameModel.filterNameFind(conn, chargeUserId, balanceUserId);
                var chargeUserName = chargeNickName[0].full_name;
                var deductUserName = deductNickName[0].full_name;
            }else if(fromUser.user_type == 'user' && toUser.user_type == 'listner'){
                var balanceUserId = fromUser.id;
                var chargeUserId = toUser.id;
                var chargeNickName = await nickNameModel.filterNameFind(conn, balanceUserId, chargeUserId);
                var deductNickName = await nickNameModel.filterNameFind(conn, chargeUserId, balanceUserId);
                var chargeUserName = chargeNickName[0].full_name;
                var deductUserName = deductNickName[0].full_name;
            }else{
                var balanceUserId = activity.from_id;
                var chargeUserId = activity.to_id;
                if(toUser.id == activity.from_id){
                    var chargeNickName = await nickNameModel.filterNameFind(conn, fromUser.id, toUser.id);
                    var chargeUserName = chargeNickName[0].full_name;
                }else{
                    var chargeNickName = await nickNameModel.filterNameFind(conn, toUser.id, fromUser.id);
                    var chargeUserName = chargeNickName[0].full_name;
                }
                if(toUser.id == activity.to_id){
                    var deductNickName = await nickNameModel.filterNameFind(conn, fromUser.id, toUser.id);
                    var deductUserName = deductNickName[0].full_name;
                }else{
                    var deductNickName = await nickNameModel.filterNameFind(conn, toUser.id, fromUser.id);
                    var deductUserName = deductNickName[0].full_name;
                }
            }
    
            var serviceCharge =  await chargeModel.getListenerCharge(conn, chargeUserId);
            var walletBalance = await walletModel.walletBalance(conn, balanceUserId);
            var Balance = parseInt(walletBalance[0].balance);
    
            if(serviceType == 'chat'){
                var perMinuteCharge = parseInt(serviceCharge[0].chat_charge);
                var charge = parseInt(serviceCharge[0].chat_charge)*duration;
            }else if(serviceType == 'call'){
                var perMinuteCharge = parseInt(serviceCharge[0].call_charge);
                var charge = parseInt(serviceCharge[0].call_charge)*duration;
            }else{
                var perMinuteCharge = parseInt(serviceCharge[0].vcall_charge);
                var charge = parseInt(serviceCharge[0].vcall_charge)*duration;
            }
            var chargeAmt = parseInt(charge);
            if(Balance <= 0){
                return true;
            }
    
            if(Balance < chargeAmt){
                chargeAmt = Balance;
            }
            
            var leftBalance = Balance - chargeAmt;
    
            if(leftBalance < 0){
                leftBalance = 0;
            }
            // var walletData = {
            //     'balance': leftBalance,
            // };
            // var updateBalance = await walletModel.update(conn, walletData, walletBalance[0].id);
    
            var listnerWalletBalance = await walletModel.walletBalance(conn, chargeUserId);
            var listnerBalance = parseInt(listnerWalletBalance[0].balance);
    
            /* 
            * Admin Commission Calculate Start
            */
            let adminCommission = await serviceFeesModel.list(conn, 'service_fees');
            var adminCommissionPercentage = adminCommission[0].fees_percentage;
            let adminCommissionAmount = parseInt((parseInt(chargeAmt) * adminCommissionPercentage) / 100);
            let finalAmountCredited = (parseInt(chargeAmt) - adminCommissionAmount);
            /* 
            * Admin Commission Calculate End
            */
    
            var newBalance = listnerBalance + finalAmountCredited;
            // var listnerWalletData = {
            //     'balance': newBalance,
            // };
            // var updateListnerBalance = await walletModel.update(conn, listnerWalletData, listnerWalletBalance[0].id);
    
            var transactionNumber = await helpers.transactionIdGenerator();
            var transactionData = {
                'wallet_id':walletBalance[0].id,
                'wallet_transaction_id': transactionNumber,
                'service_fee': adminCommissionAmount,
                'user_id':balanceUserId,
                'amount':chargeAmt,
                'transaction_type':'debit',
                'description': 'Listening session with '+chargeUserName+' for '+ duration+' minutes',
                'activity_request':serviceReqId,
                'session_user_id':chargeUserId,
                'charge_type':serviceType,
                'per_minute_charge':perMinuteCharge,
                'transaction_status': 'success'
            };
            var transactionEntry = await walletModel.storeActivityWalleteTransaction(conn, transactionData, leftBalance);
    
            var listnerTransactionData = {
                'wallet_id':listnerWalletBalance[0].id,
                'wallet_transaction_id': transactionNumber,
                'service_fee': adminCommissionAmount,
                'user_id':chargeUserId,
                'amount':chargeAmt,
                'transaction_type':'credit',
                'description': 'Listening session with '+deductUserName+' for '+ duration+' minutes',
                'activity_request':serviceReqId,
                'session_user_id':balanceUserId,
                'charge_type':serviceType,
                'per_minute_charge':perMinuteCharge,
                'transaction_status': 'success'
            };
            var listnerTransactionEntry = await walletModel.storeActivityWalleteTransaction(conn, listnerTransactionData, newBalance);
        }
    }
    return true;

}