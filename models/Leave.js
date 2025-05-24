module.exports = {
    leaveDetails: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    DATE_FORMAT(leave_date, '%d-%m-%Y') AS leave_date, time_duration
                FROM 
                    leave_tbl
                WHERE 
                    user_id = ${user_id}
                AND   
                    leave_date >= DATE_FORMAT(NOW(), '%Y-%m-25') - INTERVAL 1 MONTH
                AND 
                    leave_date < DATE_FORMAT(NOW(), '%Y-%m-26')  
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

    missedSessionDetails: (conn,user_id = false, session_missed_no_for_penalty) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    user_id, activity_id, session_date
                FROM 
                    session_missed_tbl 
                WHERE 
                    user_id = ${user_id}
                AND 
                    session_date >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-26')
                AND 
                    session_date <= DATE_FORMAT(NOW(), '%Y-%m-25')
                GROUP BY 
                    session_date 
                HAVING 
                    COUNT(session_date) > ${session_missed_no_for_penalty}
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

    
    listenerWithLeave: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
            INSERT INTO leave_tbl (user_id, leave_date, time_duration)
            SELECT 
                ldm.listener_id AS user_id,
                DATE_SUB(CURDATE(), INTERVAL 1 DAY) AS leave_date,
                SEC_TO_TIME(SUM(TIME_TO_SEC(TIMEDIFF(ldm.end_time, ldm.start_time)))) AS time_duration
            FROM 
                leave_daily_manage ldm
            WHERE 
                DATE(ldm.date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            AND
                ldm.end_time IS NOT NULL
            AND
                ldm.end_time != ''    
            GROUP BY 
                ldm.listener_id
            HAVING 
                SUM(TIME_TO_SEC(TIMEDIFF(ldm.end_time, ldm.start_time))) < (120 * 60)
            AND NOT EXISTS (
                    SELECT 1 
                    FROM leave_tbl lt 
                    WHERE lt.user_id = ldm.listener_id 
                    AND lt.leave_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                );
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    let insertUsersTblQuery = `INSERT INTO leave_tbl (user_id, leave_date, time_duration)
                    SELECT u.id, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '00:00:00'
                    FROM users u
                    LEFT JOIN leave_daily_manage ldm ON u.id = ldm.listener_id
                    WHERE u.user_type = 'listner' 
                    AND u.deleted_at IS NULL 
                    AND ldm.listener_id IS NULL
                    AND u.listner_status = 2
                    AND u.profile_status = 2;`;
                    conn.query(insertUsersTblQuery, function(insertUsersTblError, insertUsersTblResult) {
                        if (insertUsersTblError) {
                            reject(error); // If deletion fails, reject with the deletion error
                        } else {
                            let deleteQuery = `TRUNCATE TABLE leave_daily_manage;`;
                            conn.query(deleteQuery, function(delError, delResult) {
                                if (delError) {
                                    resolve(rows); // If deletion fails, reject with the deletion error
                                } else {
                                    resolve(rows); // If deletion is successful, resolve with the result of the insert query
                                }
                            });
                        }
                    });
                }
            })
        })
    },

    listenerWithMonthlyLeave:  (conn, penalty, freeLeaveCount) =>{
        return new Promise(function(resolve,reject){
            let query = `
            INSERT INTO listener_leave_penalty (listener_id, penalty_amt, penalty_days_count, panelty_date)
            SELECT
                user_id AS listener_id,
                (COUNT(*) - ${freeLeaveCount}) * ${penalty} AS penalty_amt,
                (COUNT(*) - ${freeLeaveCount}) AS penalty_days_count,
                DATE_SUB(CURDATE(), INTERVAL 1 DAY) AS panelty_date
            FROM
                leave_tbl
            WHERE
                leave_date >= DATE_FORMAT(NOW(), '%Y-%m-25') - INTERVAL 1 MONTH
                AND leave_date < DATE_FORMAT(NOW(), '%Y-%m-26')    
            GROUP BY
                user_id
            HAVING
                COUNT(*) > ${freeLeaveCount};
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows); 
                }
            })
        })
    },

    listenerWithMonthlyMissedSession: (conn, penalty, sessionCount) =>{
        return new Promise(function(resolve,reject){
            let query = `
            INSERT INTO listener_session_missed_penalty (listener_id, penalty_amt, panelty_date)
            SELECT 
                user_id AS listener_id,
                SUM(CASE WHEN session_missed_total_count > ${sessionCount} THEN ${penalty} ELSE 0 END) AS penalty_amt,
                CURRENT_DATE() AS penalty_date
            FROM (
                SELECT 
                    user_id,
                    session_date,
                    COUNT(*) AS session_missed_total_count
                FROM session_missed_tbl
                WHERE 
                    session_date >= DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-26')
                    AND session_date <= DATE_FORMAT(NOW(), '%Y-%m-25')
                GROUP BY 
                    user_id,
                    session_date
            ) AS subquery
            GROUP BY 
                user_id
            HAVING penalty_amt > 0
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows); 
                }
            })
        })
    },

    listenerListenTime: (conn, user_id) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                u.id AS user_id,
                COALESCE(a.start_time, CURDATE()) AS activity_date,
                COALESCE(SUM(a.duration), 0) AS total_duration
            FROM
                users u
            LEFT JOIN
                activity_request a ON (
                    u.user_type = 'listner' AND
                    (u.id = a.to_id OR u.id = a.from_id) AND
                    DATE_FORMAT(a.start_time, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') AND
                    a.request_status = 'completed' AND
                    DATE(a.start_time) = CURDATE()
                )
            WHERE
                u.id = ${user_id}
            GROUP BY
                u.id
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

    dailyListenerActivityTime: (conn, user_id) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT listener_id,
            COALESCE(SUM(TIMESTAMPDIFF(MINUTE, 
                    STR_TO_DATE(start_time, '%H:%i:%s'), 
                    IFNULL(STR_TO_DATE(end_time, '%H:%i:%s'), NOW())
                )), 0
           ) AS total_time_difference_minutes
            FROM leave_daily_manage
            WHERE listener_id = ${user_id}
            AND DATE(date) = CURDATE()
            AND end_time IS NOT NULL;
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

    findListenerWithLeave: (conn, user_id, leave_date) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
               *
            FROM
                leave_tbl
            WHERE
                user_id = ${user_id}
            AND
                leave_date = '${leave_date}'
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

    addLeave : (conn,leaveData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO leave_tbl set ?`, [leaveData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    updateLeave : (conn,leaveId,leaveData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE leave_tbl set ? WHERE id = ?`, [leaveData,leaveId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    onlineTimeNote : (conn,onlineTimeNoteData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO leave_daily_manage set ?`, [onlineTimeNoteData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    onlineTimeNoteUpdate : (conn,socketId,userId,onlineTimeNoteUpdateData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE leave_daily_manage set ? WHERE listener_id = ? AND socket_id = ? AND end_time IS NULL`, [onlineTimeNoteUpdateData,userId,socketId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    getLeavePenaltyRecord : (conn, userId, limit = 0, offset = 5, search, startDateLeavePenalty, endDateLeavePenalty) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    leave_tbl
                WHERE
                    user_id = '${userId}'     
            `
            if (startDateLeavePenalty != '' && startDateLeavePenalty != null && startDateLeavePenalty != undefined) {
                query += ` AND created_at >= '${startDateLeavePenalty} 00:00:00'`;
            }

            if (endDateLeavePenalty != '' && endDateLeavePenalty != null && endDateLeavePenalty != undefined) {
                query += ` AND created_at <= '${endDateLeavePenalty} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (DATE_FORMAT(leave_date, '%d %M, %Y') LIKE '%${search.value}%' OR time_duration LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            *, DATE_FORMAT(leave_date, '%d %M, %Y') AS penalty_leave_date
                        FROM 
                            leave_tbl
                        WHERE
                            user_id = '${userId}'`;

                        if (startDateLeavePenalty != '' && startDateLeavePenalty != null && startDateLeavePenalty != undefined) {
                            query += ` AND created_at >= '${startDateLeavePenalty} 00:00:00'`;
                        }
            
                        if (endDateLeavePenalty != '' && endDateLeavePenalty != null && endDateLeavePenalty != undefined) {
                            query += ` AND created_at <= '${endDateLeavePenalty} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (DATE_FORMAT(leave_date, '%d %M, %Y') LIKE '%${search.value}%' OR time_duration LIKE '%${search.value}%')`; // Adjust according to your database
                        } 
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY id DESC`; // No LIMIT and OFFSET for "All"
                        } 

                    conn.query(query, function(error, rows) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({ recordsTotal: totalRecords, recordsFiltered: totalRecords, data: rows });
                        }
                    });
                }
            });
        })
    },

    getMissedPenaltyRecord: (conn, userId, limit = 0, offset = 5, search, startDateMissedSessionPenalty, endDateMissedSessionPenalty) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    session_missed_tbl
                WHERE
                    user_id = '${userId}'     
            `
            if (startDateMissedSessionPenalty != '' && startDateMissedSessionPenalty != null && startDateMissedSessionPenalty != undefined) {
                query += ` AND created_at >= '${startDateMissedSessionPenalty} 00:00:00'`;
            }

            if (endDateMissedSessionPenalty != '' && endDateMissedSessionPenalty != null && endDateMissedSessionPenalty != undefined) {
                query += ` AND created_at <= '${endDateMissedSessionPenalty} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (DATE_FORMAT(session_date, '%d %M, %Y') LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            sm.*, 
                            DATE_FORMAT(sm.session_date, '%d %M, %Y') AS penalty_session_date,
                            ar.service_type,
                            CASE
                                WHEN ar.from_id = '${userId}' THEN IFNULL(to_user.full_name, 'N/A')
                                WHEN ar.to_id = '${userId}' THEN IFNULL(from_user.full_name, 'N/A')
                            END AS user_full_name
                        FROM 
                            session_missed_tbl sm
                        LEFT JOIN 
                            activity_request ar ON sm.activity_id = ar.id
                        LEFT JOIN 
                            users from_user ON ar.from_id = from_user.id
                        LEFT JOIN 
                            users to_user ON ar.to_id = to_user.id
                        WHERE
                            sm.user_id = '${userId}'`;

                        if (startDateMissedSessionPenalty != '' && startDateMissedSessionPenalty != null && startDateMissedSessionPenalty != undefined) {
                            query += ` AND sm.created_at >= '${startDateMissedSessionPenalty} 00:00:00'`;
                        }
            
                        if (endDateMissedSessionPenalty != '' && endDateMissedSessionPenalty != null && endDateMissedSessionPenalty != undefined) {
                            query += ` AND sm.created_at <= '${endDateMissedSessionPenalty} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (DATE_FORMAT(sm.session_date, '%d %M, %Y') LIKE '%${search.value}%')`; // Adjust according to your database
                        } 
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                sm.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY id DESC`; // No LIMIT and OFFSET for "All"
                        } 

                    conn.query(query, function(error, rows) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({ recordsTotal: totalRecords, recordsFiltered: totalRecords, data: rows });
                        }
                    });
                }
            });
        })
    },
}