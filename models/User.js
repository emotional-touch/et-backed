module.exports = {
    insert : (conn,userData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO users set ?`, [userData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    list: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    users
            `
            if(user_id) {
                query += ` WHERE id = ${user_id}`
            }
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    update : (conn,userData,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE users set ? WHERE id = ?`, [userData,user_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    delete : (conn,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM users WHERE id = ?`, [user_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    deletedUserSettlement: (conn) => {
        return new Promise(function(resolve,reject){
            let query = `
                DELETE FROM users
                WHERE deleted_at IS NOT NULL
                AND deleted_at > DATE_ADD(NOW(), INTERVAL 3 MONTH)
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

    findUserByEmail: (conn,email,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE (email = ? AND id != ? AND is_verify = 1) OR (email = ? AND register_from = 2)`, [email, user_id, email],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },

    findUserByMobile: (conn,mobile,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE (phone_number = ? AND id != ? AND is_verify = 1) OR (phone_number = ? AND register_from = 2)`, [mobile, user_id, mobile],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },

    findWebUserByEmail: (conn,email,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE email = ? AND id != ?`, [email, user_id],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },

    findWebUserByMobile: (conn,mobile,user_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE phone_number = ? AND id != ?`, [mobile, user_id],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },

    reRegisterCheck: (conn,mobile,email) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE phone_number = ? OR email = ?`, [mobile, email],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    loginAuth: (conn,field) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE phone_number = ? OR email = ?`, [field, field],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    apiTokenAuth: (conn,token) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE api_token = ?`, [token],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    recentUserDashboard: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    users 
                ORDER BY 
                    id DESC
                LIMIT 
                    7     
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
    userListPanel: (conn,userType, limit = 0, offset = 5, search, startDateUser, endDateUser) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    users
                WHERE
                    user_type = '${userType}'     
            `
            if (startDateUser != '' && startDateUser != null && startDateUser != undefined) {
                query += ` AND created_at >= '${startDateUser} 00:00:00'`;
            }

            if (endDateUser != '' && endDateUser != null && endDateUser != undefined) {
                query += ` AND created_at <= '${endDateUser} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (full_name LIKE '%${search.value}%' OR email LIKE '%${search.value}%' OR phone_number LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            u.*, DATE_FORMAT(u.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, wallet.balance as wallet_balance
                        FROM 
                            users u
                        LEFT JOIN 
                            wallet ON wallet.user_id = u.id 
                        WHERE
                            u.user_type = '${userType}'`;

                        if (startDateUser != '' && startDateUser != null && startDateUser != undefined) {
                            query += ` AND u.created_at >= '${startDateUser} 00:00:00'`;
                        }
            
                        if (endDateUser != '' && endDateUser != null && endDateUser != undefined) {
                            query += ` AND u.created_at <= '${endDateUser} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (u.full_name LIKE '%${search.value}%' OR email LIKE '%${search.value}%' OR u.phone_number LIKE '%${search.value}%')`; // Adjust according to your database
                        } 
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                u.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY u.id DESC`; // No LIMIT and OFFSET for "All"
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

    userDetailsPanel: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users  WHERE id = ?`, [user_id],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    adminUserDetailsPanel: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT *,  (
                SELECT 
                GROUP_CONCAT(t.name) AS topic_name
                FROM users u
                LEFT JOIN topic t ON FIND_IN_SET(t.id, u.topic_id) > 0 
                WHERE u.id = users.id 
            ) as topic_name  FROM users  WHERE id = ?`, [user_id],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    listnerAccountRequestData: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    users
                WHERE
                    is_active = 1
                AND
                    listner_status != 2
                AND
                    listner_status != 3    
                AND
                    google_docs_status = 2
                ORDER BY 
                    docs_responce_date DESC                
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

    profileApprovalRequestData: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    users
                WHERE
                    is_active = 1
                AND
                    profile_status != 0
                AND
                    listner_status = 2  
                ORDER BY
                    CASE WHEN profile_status = 1 THEN 0 ELSE 1 END, id DESC         
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

    userTypeCount: (conn,user_type = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE user_type = ?`, [user_type], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result.length)
                }
            });
        })
    },

    activeListenerPaginate: (conn,user_id = false, filterArray, whereClause = '', secondwhereClause = '') =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    users.id, users.profile_photo, users.full_name, users.gender, users.age,  users.story, users.message, users.exp_hours, users.online_status, users.service_toggle_status, users.service as service_availability, 
                    (
                        SELECT
                        CASE
                            WHEN COUNT(*) > 0 THEN 1
                            ELSE 0
                            END AS result_flag
                        FROM
                            report
                        WHERE
                            report_by = ${user_id} AND report_for = users.id
                        AND
                            status = '0'  
                    ) as block_status,
                    (
                        SELECT 
                        t.name
                        FROM users u
                        LEFT JOIN topic t ON FIND_IN_SET(t.id, SUBSTRING_INDEX(u.topic_id, ',', 1)) 
                        WHERE u.id = users.id 
                    ) as topic_name,  
                    (
                        SELECT COUNT(id) as total_reviews
                        FROM review
                        WHERE listner_id = users.id
                        AND status = '1'
                    ) AS total_reviews,
                    (
                        SELECT ROUND(AVG(rating), 1) as average_rating
                        FROM review
                        WHERE listner_id = users.id
                        AND status = '1'
                    ) AS average_rating
                FROM 
                    users
                WHERE
                    users.is_active = 1
                AND
                    users.profile_status = 2
                AND
                    users.listner_status = 2
                AND
                    users.user_type = 'listner'
                AND
                    users.deleted_at IS NULL         
                AND 
                    users.id != ${user_id}
            `
            // if(filterArray.search != '') {
            //     query += ` AND (users.full_name LIKE '%${filterArray.search}%' OR  users.display_name LIKE '%${filterArray.search}%')`
            // }  

            if(filterArray.search != '') {
                query += ` AND ( (users.display_name IS NOT NULL AND users.display_name != '' AND users.display_name LIKE '%${filterArray.search}%') OR ((users.display_name IS NULL OR users.display_name = '') AND users.full_name LIKE '%${filterArray.search}%') )`
            } 
            
            if(filterArray.gender != '') {
                query += ` AND users.gender = '${filterArray.gender}'`
            } 

            if(filterArray.language != '') {
                query += ` AND users.language LIKE '%${filterArray.language}%'`
            } 

            if(filterArray.age_from != ''){
                query += ` AND users.age >= ${filterArray.age_from}`
            }

            if(filterArray.age_to != ''){
                query += ` AND users.age <= ${filterArray.age_to}`
            }

            if(whereClause != ''){
                query += ` AND ${whereClause}`
            }

            if(secondwhereClause != ''){
                query += ` AND ${secondwhereClause}`
            }
              
            query +=  ` ORDER BY 
                    users.id DESC           
            `
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },

    activeListenerList: (conn,user_id = false, filterArray,  whereClause = '', secondwhereClause = '') =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    users.id, users.profile_photo, 
                    (
                        SELECT
                            CASE
                                WHEN users.user_type = 'user' THEN 'Anonymous' 
                                WHEN users.user_type = 'listner' AND (users.display_name IS NOT NULL AND users.display_name <> '') THEN users.display_name
                                ELSE users.full_name 
                            END
                    ) AS full_name,
                    users.gender, users.age, users.story, users.message, users.exp_hours, users.online_status, users.service_toggle_status, users.service as service_availability, 
                    (
                        SELECT
                        CASE
                            WHEN COUNT(*) > 0 THEN 1
                            ELSE 0
                            END AS result_flag
                        FROM
                            report
                        WHERE
                            report_by = ${user_id} AND report_for = users.id
                        AND
                            status = '0'  
                    ) as block_status,
                    (
                        SELECT 
                            t.name
                        FROM users u
                        LEFT JOIN topic t ON FIND_IN_SET(t.id, SUBSTRING_INDEX(u.topic_id, ',', 1)) 
                        WHERE u.id = users.id 
                    ) as topic_name,  
                    (
                        SELECT COUNT(id) as total_reviews
                        FROM review
                        WHERE listner_id = users.id
                        AND status = '1'
                    ) AS total_reviews,
                    (
                        SELECT ROUND(AVG(rating), 1) as average_rating
                        FROM review
                        WHERE listner_id = users.id
                        AND status = '1'
                    ) AS average_rating,
                    (
                        SELECT 
                            ROUND(IFNULL(SUM(duration / 60), 0)) 
                        AS 
                            total_exp
                        FROM 
                            activity_request
                        WHERE
                            request_status = 'completed'
                        AND
                            duration IS NOT NULL        
                        AND    
                            (to_id = users.id OR from_id = users.id)
                    ) AS total_exp
                FROM 
                    users
                WHERE
                    users.is_active = 1
                AND
                    users.profile_status = 2
                AND
                    users.listner_status = 2
                AND
                    users.user_type = 'listner'
                AND
                    users.deleted_at IS NULL         
                AND 
                    users.id != ${user_id}
            `
            // if(filterArray.search != '') {
            //     query += ` AND (users.full_name LIKE '%${filterArray.search}%' OR  users.display_name LIKE '%${filterArray.search}%')`
            // }  

            if(filterArray.search != '') {
                query += ` AND ( (users.display_name IS NOT NULL AND users.display_name != '' AND users.display_name LIKE '%${filterArray.search}%') OR ((users.display_name IS NULL OR users.display_name = '') AND users.full_name LIKE '%${filterArray.search}%') )`
            } 
            
            if(filterArray.gender != '') {
                query += ` AND users.gender = '${filterArray.gender}'`
            } 

            if(filterArray.language != '') {
                query += ` AND users.language LIKE '%${filterArray.language}%'`
            } 

            if(filterArray.age_from != ''){
                query += ` AND users.age >= ${filterArray.age_from}`
            }

            if(filterArray.age_to != ''){
                query += ` AND users.age <= ${filterArray.age_to}`
            }

            if(whereClause != ''){
                query += ` AND ${whereClause}`
            }

            if(secondwhereClause != ''){
                query += ` AND ${secondwhereClause}`
            }
              
            query +=  ` ORDER BY 
                            CASE WHEN users.online_status = 2 THEN -average_rating ELSE NULL END DESC,
                            CASE WHEN users.online_status = 2 THEN 0 ELSE 1 END,
                            CASE WHEN users.online_status = 1 THEN 0 ELSE 1 END,
                            CASE WHEN users.online_status = 0 THEN 0 ELSE 1 END,
                        users.id ASC
                LIMIT 
                    ${filterArray.limit} 
                OFFSET 
                    ${filterArray.offset}            
            `
            ////console.log(query);
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    listenerDetails: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    users.id, users.profile_photo, users.email, users.full_name, users.display_name, users.gender, users.age, users.online_status, users.service_toggle_status, users.service as service_availability, users.block_status,
                    users.language, users.about, users.device_token, GROUP_CONCAT(topic.name) AS topic_name    
                FROM 
                    users
                LEFT JOIN 
                    topic 
                ON 
                    FIND_IN_SET(topic.id, users.topic_id) > 0
                WHERE 
                    users.id = ${user_id}
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

    listenerReviewDetails: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(id) as total_reviews, AVG(rating) as average_rating    
                FROM 
                    review
                WHERE 
                    listner_id = ${user_id}
                AND
                    status = '1'  
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

    listenerReviewSeprateCount: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    rating,  COUNT(id) as total_count 
                FROM 
                    review
                WHERE 
                    listner_id = ${user_id}
                AND
                    status = '1'
                GROUP BY
                    rating 
               
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

    listenerReviewList: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    review.id,users.full_name, users.profile_photo, review.rating, review.review, DATE_FORMAT(review.created_at, '%d-%m-%Y %h:%i %p') AS review_date
                FROM 
                    review
                LEFT JOIN 
                    users 
                ON 
                    review.user_id = users.id
                WHERE 
                    review.listner_id = ${user_id}
                AND
                    review.status = '1'
                ORDER BY
                    review.id DESC         
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

    chargeDetails: (conn,user_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    call_charge, chat_charge, vcall_charge
                FROM 
                    charge
                WHERE
                    user_id = ${user_id}   
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

    apiGetDataFromReferalCode: (conn,urlId = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    full_name, email, phone_number
                FROM 
                    users
                WHERE
                    referral_code = '${urlId}'
                AND
                    google_docs_status != 2      
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

    pushNotificationUserList: (conn,user_type = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE user_type = ? AND is_active = 1 AND deleted_at IS NULL AND device_token IS NOT NULL`, [user_type], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    }, 

    getFrontListenerData:  (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    display_name as full_name, profile_photo, story
                FROM 
                    users
                WHERE
                    user_type = 'listner'
                AND
                    profile_photo IS NOT NULL
                AND
                    display_name IS NOT NULL
                AND
                    display_name != ''
                AND
                    story IS NOT NULL
                AND 
                    story != ''
                AND    
                    is_active = 1
                AND
                    profile_status = 2
                AND
                    listner_status = 2
                AND
                    deleted_at IS NULL
                ORDER BY
                    id DESC
                LIMIT 4       
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

}