module.exports = {
    totalSales: (conn, timePeriod) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN activity_request IS NOT NULL AND transaction_type = 'debit' THEN amount
                        ELSE amount + gst
                    END
                ), 0) AS total_amount_gst
            FROM 
                wallet_transaction
            WHERE
                transaction_status='success'
            AND    
            (
                CASE 
                    WHEN '${timePeriod}' = 'daily' THEN DATE(created_at) = CURDATE()
                    WHEN '${timePeriod}' = 'monthly' THEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
                    WHEN '${timePeriod}' = 'yearly' THEN YEAR(created_at) = YEAR(CURDATE())
                END
            )`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    totalDateWiseSales: (conn, startDate = '', endDate = '') =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN activity_request IS NOT NULL AND transaction_type = 'debit' THEN amount
                        ELSE amount + gst
                    END
                ), 0) AS total_amount_gst
            FROM 
                wallet_transaction
            WHERE
                transaction_status='success'`;

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

    totalGST: (conn, timePeriod) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN activity_request IS NOT NULL AND transaction_type = 'debit' THEN 0
                        ELSE gst
                    END
                ), 0) AS total_gst
            FROM 
                wallet_transaction
            WHERE
                transaction_status='success'
            AND    
            (
                CASE 
                    WHEN '${timePeriod}' = 'daily' THEN DATE(created_at) = CURDATE()
                    WHEN '${timePeriod}' = 'monthly' THEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())
                    WHEN '${timePeriod}' = 'yearly' THEN YEAR(created_at) = YEAR(CURDATE())
                END
            )`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    totalDateWiseGST:(conn, startDate = '', endDate = '') =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN activity_request IS NOT NULL AND transaction_type = 'debit' THEN 0
                        ELSE gst
                    END
                ), 0) AS total_gst
            FROM 
                wallet_transaction
            WHERE
                transaction_status='success'`;

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

    totalListenerRevenue: (conn, timePeriod) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN wt.entry_type = 2 THEN wt.amount
                        ELSE (wt.amount - wt.service_fee)
                    END
                ), 0) AS total_listener_revenue
            FROM 
                wallet_transaction wt
            JOIN
                users u
            ON 
                wt.user_id = u.id      
            WHERE
                wt.transaction_status='success'
            AND
                wt.transaction_type='credit'
            AND
                u.user_type = 'listner'
            AND
                wt.entry_type != 1
            AND
                wt.entry_type != 3     
            AND
            (
                CASE 
                    WHEN '${timePeriod}' = 'daily' THEN DATE(wt.created_at) = CURDATE()
                    WHEN '${timePeriod}' = 'monthly' THEN YEAR(wt.created_at) = YEAR(CURDATE()) AND MONTH(wt.created_at) = MONTH(CURDATE())
                    WHEN '${timePeriod}' = 'yearly' THEN YEAR(wt.created_at) = YEAR(CURDATE())
                END
            )`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    totalDateWiseListenerRevenue: (conn, startDate = '', endDate = '') =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN wt.entry_type = 2 THEN wt.amount
                        ELSE (wt.amount - wt.service_fee)
                    END
                ), 0) AS total_listener_revenue
            FROM 
                wallet_transaction wt
            JOIN
                users u
            ON 
                wt.user_id = u.id      
            WHERE
                wt.transaction_status='success'
            AND
                wt.transaction_type='credit'
            AND
                u.user_type = 'listner'
            AND
                wt.entry_type != 1
            AND
                wt.entry_type != 3`;

            if(startDate != ''){
                query += ` AND wt.created_at >= '${startDate}'`;
            }    
            if(endDate != ''){
                query += ` AND wt.created_at <= '${endDate}'`;
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
}