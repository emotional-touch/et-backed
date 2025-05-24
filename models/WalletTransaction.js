module.exports = {
    listUsers: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    users WHERE is_active = 1
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

    getData: (conn, user = null, type = null) => {
        return new Promise(function(resolve, reject) {
            let query = `SELECT wallet_transaction.*, users.full_name as paid_by_user, users.user_type 
                        FROM wallet_transaction
                        LEFT JOIN users ON users.id = wallet_transaction.user_id
                        WHERE 1`;

            let queryParams = [];

            if (user != '') {
                query += ` AND wallet_transaction.user_id = ?`;
                queryParams.push(user);
            }

            if (type != '') {
                query += ` AND wallet_transaction.transaction_type = ?`;
                queryParams.push(type);
            }

            query += ` ORDER BY wallet_transaction.id DESC`;

            conn.query(query, queryParams, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    details: (conn,tId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT wallet_transaction.*, users.full_name as paid_by_user 
            FROM wallet_transaction
            LEFT JOIN users ON users.id = wallet_transaction.user_id WHERE wallet_transaction.id = ?`, [tId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    transactionDetails:(conn,transactionId) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * 
            FROM wallet_transaction
            WHERE wallet_transaction_id = ?`, [transactionId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    getDataOfAdminCommission: async (conn, limit = 0, offset = 5, search) => {
        return new Promise(function(resolve,reject){
            let query = `
                SELECT COUNT(*) as total_records
                    FROM wallet_transaction wt 
                LEFT JOIN activity_request ar ON ar.id = wt.activity_request 
                LEFT JOIN users u_from ON u_from.id = ar.from_id 
                LEFT JOIN users u_to ON u_to.id = ar.to_id 
                LEFT JOIN users u ON u.id = wt.user_id 
                WHERE ((wt.entry_type = 2 AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
                OR(wt.entry_type = 0 AND ar.request_status = 'completed' 
                    AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0))) 
                AND wt.transaction_type = 'credit'     
            `
            if (search && search.value) {
                query += ` AND (u_from.full_name LIKE '%${search.value}%' OR wt.wallet_transaction_id LIKE '%${search.value}%'  OR u_to.full_name LIKE '%${search.value}%' OR wt.description LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%')`; // Adjust according to your database
            }
            
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT wt.*, ar.*, wt.id as wt_id, u_from.full_name AS from_full_name, u_to.full_name AS to_full_name, u.full_name as full_name,  (wt.amount + COALESCE(wt.service_fee, 0)) AS gift_total,
                        (wt.amount - COALESCE(wt.service_fee, 0)) AS received_amount,
                        SUBSTRING(wt.description, LOCATE('FROM', wt.description) + LENGTH('FROM') + 1) AS last_word
                            FROM wallet_transaction wt 
                        LEFT JOIN activity_request ar ON ar.id = wt.activity_request 
                        LEFT JOIN users u_from ON u_from.id = ar.from_id 
                        LEFT JOIN users u_to ON u_to.id = ar.to_id 
                        LEFT JOIN users u ON u.id = wt.user_id 
                        WHERE ((wt.entry_type = 2 AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
                        OR(wt.entry_type = 0 AND ar.request_status = 'completed' 
                            AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0))) 
                        AND wt.transaction_type = 'credit'     
                    `;
                    if (search && search.value) {
                        query += ` AND (u_from.full_name LIKE '%${search.value}%' OR wt.wallet_transaction_id LIKE '%${search.value}%' OR u_to.full_name LIKE '%${search.value}%' OR wt.description LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%')`; // Adjust according to your database
                    }

                    if (limit !== null && offset !== null) {
                        query += ` ORDER BY
                            wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                        `;
                    }else {
                        query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
                    }

                    conn.query(query, function(error, rows) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve({ recordsTotal: totalRecords, recordsFiltered: totalRecords, data: rows });
                        }
                    });
                }
            })
        })
    },

    getTotalOfAdminCommission: async (conn) => {
        return new Promise(function(resolve,reject){
            let query = `SELECT SUM(wt.service_fee) AS total_commission 
                FROM wallet_transaction wt 
            LEFT JOIN activity_request ar ON ar.id = wt.activity_request 
            LEFT JOIN users u_from ON u_from.id = ar.from_id 
            LEFT JOIN users u_to ON u_to.id = ar.to_id 
            LEFT JOIN users u ON u.id = wt.user_id 
            WHERE (wt.entry_type = 2 AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
            OR(wt.entry_type = 0 AND ar.request_status = 'completed' 
                AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
            AND wt.transaction_type = 'credit' 
            ;`;
            
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },


    getGiftTotalOfAdminCommission: async (conn) => {
        return new Promise(function(resolve,reject){
            let query = `SELECT SUM(wt.service_fee) AS total_commission 
                FROM wallet_transaction wt 
            LEFT JOIN activity_request ar ON ar.id = wt.activity_request 
            LEFT JOIN users u_from ON u_from.id = ar.from_id 
            LEFT JOIN users u_to ON u_to.id = ar.to_id 
            LEFT JOIN users u ON u.id = wt.user_id 
            WHERE (wt.entry_type = 2 AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
            AND wt.transaction_type = 'credit' 
            ;`;
            
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    getChatCallTotalOfAdminCommission: async (conn) => {
        return new Promise(function(resolve,reject){
            let query = `SELECT SUM(wt.service_fee) AS total_commission 
                FROM wallet_transaction wt 
            LEFT JOIN activity_request ar ON ar.id = wt.activity_request 
            LEFT JOIN users u_from ON u_from.id = ar.from_id 
            LEFT JOIN users u_to ON u_to.id = ar.to_id 
            LEFT JOIN users u ON u.id = wt.user_id 
            WHERE (wt.entry_type = 0 AND ar.request_status = 'completed' 
                AND (wt.service_fee IS NOT NULL AND wt.service_fee != 0)) 
            AND wt.transaction_type = 'credit' 
            ;`;
            
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    getGstData: async (conn, startDate = '', endDate = '') => {
        return new Promise(function(resolve,reject){
            let query = `SELECT wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, COALESCE(wt.transaction_id, '--------------------') AS payment_id, COALESCE(u.full_name, 'Record Deleted') AS full_name
            FROM 
                wallet_transaction wt 
            LEFT JOIN 
                users u ON u.id = wt.user_id 
            WHERE 
                (wt.entry_type = 1 OR wt.entry_type = 2)  
            AND 
                wt.transaction_status = 'success' 
            AND  
                wt.gst > 0`;

            if(startDate != ''){
                query += ` AND wt.created_at >= '${startDate}'`;
            }    
            if(endDate != ''){
                query += ` AND wt.created_at <= '${endDate}'`;
            }

            query += ` ORDER BY 
                wt.id DESC;`;
            
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    getTotalGST: async (conn, entityType, startDate = '', endDate = '') => {
        return new Promise(function(resolve,reject){
            let query = `SELECT COALESCE(SUM(gst), 0)  AS total_gst
            FROM 
                wallet_transaction 
            WHERE 
                transaction_status = 'success'
            AND
                (
                    CASE 
                        WHEN ${entityType} = 0 THEN (entry_type = 1 OR entry_type = 2)
                        ELSE entry_type = ${entityType}
                    END
                )`;
            
            if(startDate != ''){
                query += ` AND created_at >= '${startDate}'`;
            }    
            if(endDate != ''){
                query += ` AND created_at <= '${endDate}'`;
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

    getRechargeTransaction: (conn, userId, limit = 0, offset = 5, search, startDateRecharge, endDateRecharge) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.user_id    
                WHERE
                    wt.user_id = '${userId}'
                AND
                    wt.entry_type = 1       
            `
            if (startDateRecharge != '' && startDateRecharge != null && startDateRecharge != undefined) {
                query += ` AND wt.created_at >= '${startDateRecharge} 00:00:00'`;
            }

            if (endDateRecharge != '' && endDateRecharge != null && endDateRecharge != undefined) {
                query += ` AND wt.created_at <= '${endDateRecharge} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.country, users.state 
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.user_id    
                        WHERE
                            wt.user_id = '${userId}'
                        AND
                            wt.entry_type = 1`;

                        if (startDateRecharge != '' && startDateRecharge != null && startDateRecharge != undefined) {
                            query += ` AND wt.created_at >= '${startDateRecharge} 00:00:00'`;
                        }
            
                        if (endDateRecharge != '' && endDateRecharge != null && endDateRecharge != undefined) {
                            query += ` AND wt.created_at <= '${endDateRecharge} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        }   
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else {
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getGiftTransaction: (conn, userId, limit = 0, offset = 5, search, startDateGift, endDateGift) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.gift_person_id 
                LEFT JOIN
                    users owner_user ON owner_user.id = wt.user_id    
                WHERE
                    wt.user_id = '${userId}'
                AND
                    wt.entry_type = 2       
            `

            if (startDateGift != '' && startDateGift != null && startDateGift != undefined) {
                query += ` AND wt.created_at >= '${startDateGift} 00:00:00'`;
            }

            if (endDateGift != '' && endDateGift != null && endDateGift != undefined) {
                query += ` AND wt.created_at <= '${endDateGift} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name as gift_person_name, users.id as user_key, owner_user.country, owner_user.state  
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.gift_person_id 
                        LEFT JOIN
                            users owner_user ON owner_user.id = wt.user_id 
                        WHERE
                            wt.user_id = '${userId}'
                        AND
                            wt.entry_type = 2`;

                        if (startDateGift != '' && startDateGift != null && startDateGift != undefined) {
                            query += ` AND wt.created_at >= '${startDateGift} 00:00:00'`;
                        }
            
                        if (endDateGift != '' && endDateGift != null && endDateGift != undefined) {
                            query += ` AND wt.created_at <= '${endDateGift} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        } 
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getServiceTransaction: (conn, userId, limit = 0, offset = 5, search, startDateService, endDateService) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.session_user_id 
                LEFT JOIN 
                    activity_request ON activity_request.id = wt.activity_request 
                WHERE
                    wt.user_id = '${userId}'
                AND
                    wt.charge_type IS NOT NULL    
            `
            if (startDateService != '' && startDateService != null && startDateService != undefined) {
                query += ` AND wt.created_at >= '${startDateService} 00:00:00'`;
            }

            if (endDateService != '' && endDateService != null && endDateService != undefined) {
                query += ` AND wt.created_at <= '${endDateService} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.charge_type LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name as session_user_name, users.id as user_key, activity_request.duration as minutes
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.session_user_id 
                        LEFT JOIN 
                            activity_request ON activity_request.id = wt.activity_request 
                        WHERE
                            user_id = '${userId}'
                        AND
                            wt.charge_type IS NOT NULL`;

                        if (startDateService != '' && startDateService != null && startDateService != undefined) {
                            query += ` AND wt.created_at >= '${startDateService} 00:00:00'`;
                        }
            
                        if (endDateService != '' && endDateService != null && endDateService != undefined) {
                            query += ` AND wt.created_at <= '${endDateService} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.charge_type LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        }  
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getRefundTransaction: (conn, userId, limit = 0, offset = 5, search, startDateRefund, endDateRefund) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction
                WHERE
                    user_id = '${userId}'
                AND
                    entry_type = 4       
            `
            if (startDateRefund != '' && startDateRefund != null && startDateRefund != undefined) {
                query += ` AND created_at >= '${startDateRefund} 00:00:00'`;
            }

            if (endDateRefund != '' && endDateRefund != null && endDateRefund != undefined) {
                query += ` AND created_at <= '${endDateRefund} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wallet_transaction_id LIKE '%${search.value}%' OR amount LIKE '%${search.value}%' OR transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            *, DATE_FORMAT(created_at, '%d %M, %Y %h:%i %p') AS created_date_time 
                        FROM 
                            wallet_transaction  
                        WHERE
                            user_id = '${userId}'
                        AND
                            entry_type = 4`;

                        if (startDateRefund != '' && startDateRefund != null && startDateRefund != undefined) {
                            query += ` AND created_at >= '${startDateRefund} 00:00:00'`;
                        }
            
                        if (endDateRefund != '' && endDateRefund != null && endDateRefund != undefined) {
                            query += ` AND created_at <= '${endDateRefund} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wallet_transaction_id LIKE '%${search.value}%' OR amount LIKE '%${search.value}%' OR transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
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

    getPayoutRecordTransaction: (conn, userId, limit = 0, offset = 5, search, startDatePayout, endDatePayout) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction
                WHERE
                    user_id = '${userId}'
                AND
                    transaction_type = 'withdraw'      
            `

            if (startDatePayout != '' && startDatePayout != null && startDatePayout != undefined) {
                query += ` AND created_at >= '${startDatePayout} 00:00:00'`;
            }

            if (endDatePayout != '' && endDatePayout != null && endDatePayout != undefined) {
                query += ` AND created_at <= '${endDatePayout} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wallet_transaction_id LIKE '%${search.value}%' OR amount LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            *, DATE_FORMAT(created_at, '%d %M, %Y %h:%i %p') AS created_date_time
                        FROM 
                            wallet_transaction
                        WHERE
                            user_id = '${userId}'
                        AND
                            transaction_type = 'withdraw'`;

                        if (startDatePayout != '' && startDatePayout != null && startDatePayout != undefined) {
                            query += ` AND created_at >= '${startDatePayout} 00:00:00'`;
                        }
            
                        if (endDatePayout != '' && endDatePayout != null && endDatePayout != undefined) {
                            query += ` AND created_at <= '${endDatePayout} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wallet_transaction_id LIKE '%${search.value}%' OR amount LIKE '%${search.value}%')`; // Adjust according to your database
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


    getPaymentRechargeTransaction: (conn, limit = 0, offset = 5, search, startDateRecharge, endDateRecharge) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.user_id 
                WHERE
                    wt.entry_type = 1       
            `
            if (startDateRecharge != '' && startDateRecharge != null && startDateRecharge != undefined) {
                query += ` AND wt.created_at >= '${startDateRecharge} 00:00:00'`;
            }

            if (endDateRecharge != '' && endDateRecharge != null && endDateRecharge != undefined) {
                query += ` AND wt.created_at <= '${endDateRecharge} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name as full_name, users.id as user_key, users.country, users.state  
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.user_id 
                        WHERE
                            wt.entry_type = 1`;

                        if (startDateRecharge != '' && startDateRecharge != null && startDateRecharge != undefined) {
                            query += ` AND wt.created_at >= '${startDateRecharge} 00:00:00'`;
                        }
            
                        if (endDateRecharge != '' && endDateRecharge != null && endDateRecharge != undefined) {
                            query += ` AND wt.created_at <= '${endDateRecharge} 23:59:59'`;
                        }
                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        }
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else {
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getPaymentGiftTransaction: (conn, limit = 0, offset = 5, search, startDateGift, endDateGift) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.user_id
                LEFT JOIN
                    users owner_user ON owner_user.id = wt.user_id     
                WHERE
                    wt.entry_type = 2       
            `

            if (startDateGift != '' && startDateGift != null && startDateGift != undefined) {
                query += ` AND wt.created_at >= '${startDateGift} 00:00:00'`;
            }

            if (endDateGift != '' && endDateGift != null && endDateGift != undefined) {
                query += ` AND wt.created_at <= '${endDateGift} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name as gift_person_name, users.id as user_key, owner_user.country, owner_user.state  
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.user_id
                        LEFT JOIN
                            users owner_user ON owner_user.id = wt.user_id       
                        WHERE
                            wt.entry_type = 2`;

                        if (startDateGift != '' && startDateGift != null && startDateGift != undefined) {
                            query += ` AND wt.created_at >= '${startDateGift} 00:00:00'`;
                        }
            
                        if (endDateGift != '' && endDateGift != null && endDateGift != undefined) {
                            query += ` AND wt.created_at <= '${endDateGift} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        }      
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getPaymentServiceTransaction: (conn, limit = 0, offset = 5, search, startDateService, endDateService) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN 
                    users ON users.id = wt.user_id 
                LEFT JOIN 
                    activity_request ON activity_request.id = wt.activity_request 
                WHERE
                    wt.charge_type IS NOT NULL    
            `
            if (startDateService != '' && startDateService != null && startDateService != undefined) {
                query += ` AND wt.created_at >= '${startDateService} 00:00:00'`;
            }

            if (endDateService != '' && endDateService != null && endDateService != undefined) {
                query += ` AND wt.created_at <= '${endDateService} 23:59:59'`;
            }
            
            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.charge_type LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name as session_user_name, users.id as user_key, activity_request.duration as minutes
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN 
                            users ON users.id = wt.user_id 
                        LEFT JOIN 
                            activity_request ON activity_request.id = wt.activity_request 
                        WHERE
                            wt.charge_type IS NOT NULL`;

                        if (startDateService != '' && startDateService != null && startDateService != undefined) {
                            query += ` AND wt.created_at >= '${startDateService} 00:00:00'`;
                        }
            
                        if (endDateService != '' && endDateService != null && endDateService != undefined) {
                            query += ` AND wt.created_at <= '${endDateService} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%' OR wt.charge_type LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR wt.gst LIKE '%${search.value}%' OR wt.service_fee LIKE '%${search.value}%' OR wt.transaction_status LIKE '%${search.value}%')`; // Adjust according to your database
                        }
                        
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    getPaymentPayoutRecordTransaction: (conn, limit = 0, offset = 5, search, startDatePayout, endDatePayout) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    wallet_transaction wt
                LEFT JOIN
                    users ON users.id = wt.user_id 
                WHERE
                    wt.transaction_type = 'withdraw'      
            `
            if (startDatePayout != '' && startDatePayout != null && startDatePayout != undefined) {
                query += ` AND wt.created_at >= '${startDatePayout} 00:00:00'`;
            }

            if (endDatePayout != '' && endDatePayout != null && endDatePayout != undefined) {
                query += ` AND wt.created_at <= '${endDatePayout} 23:59:59'`;
            }

            if (search && search.value) {
                query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%')`; // Adjust according to your database
            }
            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                        SELECT 
                            wt.*, DATE_FORMAT(wt.created_at, '%d %M, %Y %h:%i %p') AS created_date_time, users.full_name, users.id as user_key
                        FROM 
                            wallet_transaction wt
                        LEFT JOIN
                            users ON users.id = wt.user_id 
                        WHERE
                            wt.transaction_type = 'withdraw'`;

                        if (startDatePayout != '' && startDatePayout != null && startDatePayout != undefined) {
                            query += ` AND wt.created_at >= '${startDatePayout} 00:00:00'`;
                        }
            
                        if (endDatePayout != '' && endDatePayout != null && endDatePayout != undefined) {
                            query += ` AND wt.created_at <= '${endDatePayout} 23:59:59'`;
                        }

                        if (search && search.value) {
                            query += ` AND (wt.wallet_transaction_id LIKE '%${search.value}%' OR wt.amount LIKE '%${search.value}%' OR users.full_name LIKE '%${search.value}%')`; // Adjust according to your database
                        }  
                        if (limit !== null && offset !== null) {
                            query += ` ORDER BY
                                wt.id DESC LIMIT ${limit} OFFSET ${offset}      
                            `;
                        }else{
                            query += ` ORDER BY wt.id DESC`; // No LIMIT and OFFSET for "All"
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

    delete : (conn,walletTransactionId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM wallet_transaction WHERE wallet_transaction_id = ?`, [walletTransactionId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    walletEntryCheck:(conn,serviceReqId) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * 
            FROM wallet_transaction
            WHERE activity_request = ?`, [serviceReqId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows.length)
                }
            })
        })
    },
}