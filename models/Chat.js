module.exports = {
    list: (conn, user_id, keyword = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                u.id AS user_id,
                u.full_name,
                u.profile_photo,
                u.online_status,
                m.message AS last_msg,
                m.time,
                (
                    SELECT COUNT(*)
                    FROM messages
                    WHERE from_id = u.id 
                    AND to_id =  ${user_id}
                    AND read_status = 0
                ) AS unread_messages_count
            FROM
                users u
            JOIN (
                SELECT
                    MAX(id) AS max_message_id,
                    from_id,
                    to_id
                FROM
                    messages
                WHERE
                    (from_id = ${user_id} OR to_id = ${user_id})
                GROUP BY
                    CASE
                        WHEN from_id = ${user_id} THEN to_id
                        WHEN to_id = ${user_id} THEN from_id
                    END
            ) latest_message ON
                u.id = CASE
                    WHEN latest_message.from_id = ${user_id} THEN latest_message.to_id
                    WHEN latest_message.to_id = ${user_id} THEN latest_message.from_id
                END
            JOIN messages m ON
                m.id = latest_message.max_message_id
            `
            if(keyword) {
                query += ` WHERE u.full_name LIKE '%${keyword}%'`
            }
            query += `ORDER BY
                m.date DESC, m.time DESC
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    logList: (conn, user_id, keyword = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                u.id AS user_id,
                (
                    SELECT
                        CASE
                            WHEN u.user_type = 'listner' AND (u.display_name IS NOT NULL AND u.display_name <> '') THEN u.display_name
                            ELSE u.full_name 
                        END
                ) AS full_name,
                u.profile_photo,
                u.online_status,
                al.text AS last_msg,
                al.created_at as time,
                (
                    SELECT COUNT(*)
                    FROM activity_log
                    WHERE from_id = u.id 
                    AND to_id =  ${user_id}
                    AND read_status = 0
                ) AS unread_messages_count
            FROM
                users u
            JOIN (
                SELECT
                    MAX(id) AS max_message_id,
                    from_id,
                    to_id
                FROM
                    activity_log
                WHERE
                    (from_id = ${user_id} OR to_id = ${user_id})
                GROUP BY
                    CASE
                        WHEN from_id = ${user_id} THEN to_id
                        WHEN to_id = ${user_id} THEN from_id
                    END
            ) latest_message ON
                u.id = CASE
                    WHEN latest_message.from_id = ${user_id} THEN latest_message.to_id
                    WHEN latest_message.to_id = ${user_id} THEN latest_message.from_id
                END
            JOIN activity_log al ON
                al.id = latest_message.max_message_id
            WHERE u.deleted_at IS NULL`
            if(keyword) {
                query += ` AND u.full_name LIKE '%${keyword}%'`
            }
            query += ` ORDER BY
                al.id DESC
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    inboxLogList: (conn, user_id, keyword = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                u.id AS user_id,
                u.user_type,
                (
                    SELECT
                        CASE
                            WHEN n.nick_name IS NOT NULL THEN n.nick_name
                            WHEN u.user_type = 'user' THEN 'Anonymous' 
                            WHEN u.user_type = 'listner' AND (u.display_name IS NOT NULL AND u.display_name <> '') THEN u.display_name
                            ELSE u.full_name 
                        END
                ) AS full_name,
                u.profile_photo,
                u.online_status,
                al.text AS last_msg,
                al.created_at as time,
                (
                    SELECT COUNT(*)
                    FROM activity_log
                    WHERE from_id = u.id 
                    AND to_id =  ${user_id}
                    AND read_status = 0
                ) AS unread_messages_count,
                liu.listener_id IS NOT NULL AS is_in_listener_inbox
            FROM
                users u
            JOIN (
                SELECT
                    MAX(id) AS max_message_id,
                    from_id,
                    to_id
                FROM
                    activity_log
                WHERE
                    (from_id = ${user_id} OR to_id = ${user_id})
                GROUP BY
                    CASE
                        WHEN from_id = ${user_id} THEN to_id
                        WHEN to_id = ${user_id} THEN from_id
                    END
            ) latest_message ON
                u.id = CASE
                    WHEN latest_message.from_id = ${user_id} THEN latest_message.to_id
                    WHEN latest_message.to_id = ${user_id} THEN latest_message.from_id
                END
            JOIN activity_log al ON
                al.id = latest_message.max_message_id
            JOIN listener_inbox_users liu ON
                liu.listener_id = ${user_id} AND liu.inbox_user_id = u.id
            LEFT JOIN nick_name n ON
                n.user_id = u.id AND n.listener_id = ${user_id}
            WHERE u.deleted_at IS NULL
            `
            if(keyword) {
                query += ` AND u.full_name LIKE '%${keyword}%'`
            }
            query += ` ORDER BY
                al.id DESC
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    otherLogList: (conn, user_id, keyword = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                u.id AS user_id,
                (
                    SELECT
                        CASE
                            WHEN n.nick_name IS NOT NULL THEN n.nick_name
                            WHEN u.user_type = 'user' THEN 'Anonymous' 
                            WHEN u.user_type = 'listner' AND (u.display_name IS NOT NULL AND u.display_name <> '') THEN u.display_name
                            ELSE u.full_name 
                        END
                ) AS full_name,
                u.profile_photo,
                u.online_status,
                al.text AS last_msg,
                al.created_at as time,
                (
                    SELECT COUNT(*)
                    FROM activity_log
                    WHERE from_id = u.id 
                    AND to_id = ${user_id}
                    AND read_status = 0
                ) AS unread_messages_count
            FROM
                users u
            JOIN (
                SELECT
                    MAX(id) AS max_message_id,
                    from_id,
                    to_id
                FROM
                    activity_log
                WHERE
                    (from_id = ${user_id} OR to_id = ${user_id})
                GROUP BY
                    CASE
                        WHEN from_id = ${user_id} THEN to_id
                        WHEN to_id = ${user_id} THEN from_id
                    END
            ) latest_message ON
                u.id = CASE
                    WHEN latest_message.from_id = ${user_id} THEN latest_message.to_id
                    WHEN latest_message.to_id = ${user_id} THEN latest_message.from_id
                END
            JOIN activity_log al ON
                al.id = latest_message.max_message_id
            LEFT JOIN nick_name n ON
                n.user_id = u.id AND n.listener_id = ${user_id}
            WHERE NOT EXISTS (
                SELECT 1
                FROM listener_inbox_users liu
                WHERE liu.listener_id = ${user_id} AND liu.inbox_user_id = u.id
            )
            AND u.deleted_at IS NULL
            `
            if(keyword) {
                query += ` AND u.full_name LIKE '%${keyword}%'`
            }
            query += ` ORDER BY
                al.id DESC
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    chatMessage: (conn, fromId, toId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                from_user.id AS from_user_id,
                from_user.full_name AS from_user_name,
                from_user.profile_photo AS from_user_profile_photo,
                from_user.socket_id AS from_socket_id,
                to_user.id AS to_user_id,
                to_user.full_name AS to_user_name,
                to_user.profile_photo AS to_user_profile_photo,
                to_user.socket_id AS to_socket_id,
                m.id as message_id,
                m.message,
                m.time,
                m.type,
                m.read_status
            FROM
                messages m
            JOIN
                users from_user ON m.from_id = from_user.id
            JOIN
                users to_user ON m.to_id = to_user.id
            WHERE
                ((m.from_id = ${fromId} AND m.to_id = ${toId}) OR (m.from_id = ${toId} AND m.to_id = ${fromId}))
            AND
                session_status = 1
            ORDER BY
                m.id DESC
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    updateSocket : (conn,socketData,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE users set ? WHERE id = ?`, [socketData,user_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    findUserIdBySocketId: (conn,socketId) => {
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                * 
            FROM 
                users
            WHERE 
                socket_id = '${socketId}'
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    findUserIdById: (conn,userId) => {
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                * 
            FROM 
                users
            WHERE 
                id = '${userId}'
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    readStatusUpdate : (conn,updateData,fromId,toId) => {
        return new Promise(function(resolve,reject){
            //---> conn.query(`UPDATE messages set ? WHERE from_id = ? AND to_id = ?`, [updateData,fromId,toId], function(err, result) {
            conn.query(`UPDATE activity_log set ? WHERE from_id = ? AND to_id = ?`, [updateData,fromId,toId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    sessionDataUpdate : (conn,updateData,fromId,toId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE messages set ? WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)`, [updateData,fromId,toId,toId,fromId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    sendChatMessage: (conn,sendMessageData) => {
        //console.log(sendMessageData);
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO messages set ?`, [sendMessageData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    getNewChatMessage: (conn,messageId) => {
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                from_user.id AS from_user_id,
                from_user.full_name AS from_user_name,
                from_user.profile_photo AS from_user_profile_photo,
                from_user.socket_id AS from_socket_id,
                to_user.id AS to_user_id,
                to_user.full_name AS to_user_name,
                to_user.profile_photo AS to_user_profile_photo,
                to_user.socket_id AS to_socket_id,
                m.id as message_id,
                m.message,
                m.time,
                m.type,
                m.read_status
            FROM
                messages m
            JOIN
                users from_user ON m.from_id = from_user.id
            JOIN
                users to_user ON m.to_id = to_user.id
            WHERE
                m.id = ${messageId}
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    connectedUsers: (conn,userId) => {
        return new Promise(function(resolve,reject){
            let query = `
                SELECT DISTINCT CASE
                WHEN from_id = ${userId} THEN to_id
                WHEN to_id = ${userId} THEN from_id
                END AS connected_user
                FROM activity_request
                WHERE from_id = ${userId} OR to_id = ${userId};
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    sendServiceRequestData: (conn,sendRequestData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO activity_request set ?`, [sendRequestData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    if(sendRequestData.request_status == 'cancelled'){
                        resolve(result);
                    }else{
                        const additionalUpdateData = {
                            online_status: 1
                        };
        
                        conn.query(`UPDATE users SET ? WHERE id IN (?,?) AND (socket_id != null OR socket_id != '')`, [additionalUpdateData,sendRequestData.from_id,sendRequestData.to_id], function (updateErr, updateResult) {
                            if (updateErr) {
                                // Handle the error from the update query
                                resolve(result);
                            } else {
                                // Both queries were successful
                                resolve(result);
                            }
                        });
                    }
                   
                    //resolve(result)
                }
            });
        })
    },
    sessionClosedDataUpdate : (conn,updateData,userId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE messages set ? WHERE from_id = ? OR to_id = ?`, [updateData,userId,userId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    getOnlineOflineStatus:  (conn, userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                id as user_id,
                online_status,
                service_toggle_status,
                service as service_availability,
                CASE 
                    WHEN last_seen IS NULL THEN NULL
                    WHEN TIMESTAMPDIFF(SECOND, FROM_UNIXTIME(last_seen / 1000), NOW()) < 60 THEN 'Just now'
                    WHEN TIMESTAMPDIFF(MINUTE, FROM_UNIXTIME(last_seen / 1000), NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, FROM_UNIXTIME(last_seen / 1000), NOW()), ' minute(s) ago')
                    WHEN TIMESTAMPDIFF(HOUR, FROM_UNIXTIME(last_seen / 1000), NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, FROM_UNIXTIME(last_seen / 1000), NOW()), ' hour(s) ago')
                    ELSE CONCAT(TIMESTAMPDIFF(DAY, FROM_UNIXTIME(last_seen / 1000), NOW()), ' day(s) ago')
                END AS last_seen
            FROM
                users
            WHERE
                id = ${userId}
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    dragOtherToInboxFind: (conn,listenerId,inboxUserId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM listener_inbox_users WHERE listener_id = ? AND inbox_user_id = ?`, [listenerId,inboxUserId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result.length)
                }
            });
        })
    },
    dragOtherToInboxInsert: (conn,fieldData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO listener_inbox_users set ?`, [fieldData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    firstCommunicateRequestFind: (conn,userId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM activity_request WHERE request_status = 'completed' AND (from_id = ? OR to_id = ?)`, [userId,userId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result.length)
                }
            });
        })
    },
}