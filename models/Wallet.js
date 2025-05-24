module.exports = {
    storeWalleteBalance: (conn,walleteData) =>{
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO wallet set ?`, [walleteData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    storeWalleteTransaction: (conn,walleteTransactionData) =>{
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO wallet_transaction set ?`, [walleteTransactionData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    storeActivityWalleteTransaction: (conn,walleteTransactionData, balance) =>{
        return new Promise(function(resolve,reject){
            conn.query(`
                INSERT INTO wallet_transaction (wallet_id, wallet_transaction_id, service_fee, user_id, amount, transaction_type, description, activity_request, session_user_id, charge_type, per_minute_charge, transaction_status)
                    SELECT 
                        ? AS wallet_id, 
                        ? AS wallet_transaction_id, 
                        ? AS service_fee, 
                        ? AS user_id, 
                        ? AS amount, 
                        ? AS transaction_type, 
                        ? AS description, 
                        ? AS activity_request, 
                        ? AS session_user_id, 
                        ? AS charge_type, 
                        ? AS per_minute_charge, 
                        ? AS transaction_status
                    FROM dual
                    WHERE NOT EXISTS (
                        SELECT 1
                        FROM wallet_transaction
                        WHERE activity_request = ? AND transaction_type = ?
                    ) `, [walleteTransactionData.wallet_id, walleteTransactionData.wallet_transaction_id, walleteTransactionData.service_fee, walleteTransactionData.user_id, walleteTransactionData.amount, walleteTransactionData.transaction_type, walleteTransactionData.description, walleteTransactionData.activity_request, walleteTransactionData.session_user_id, walleteTransactionData.charge_type, walleteTransactionData.per_minute_charge, walleteTransactionData.transaction_status, walleteTransactionData.activity_request, walleteTransactionData.transaction_type], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    if (result.affectedRows > 0) {
                        query = `UPDATE wallet SET balance = '${balance}' WHERE id = '${walleteTransactionData.wallet_id}'`;
                        conn.query(query, function(error, resultData) {
                            if (error) {
                                reject(error);
                            } else {
                                resolve(resultData);
                            }
                        });
                    }else{
                        resolve(result)
                    }
                }
            });
        })
    },

    walletBalance: (conn,user_id) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    wallet
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

    getTransactionHistory:  (conn,user_id,fromDateObj,toDateObj) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    CASE 
                        WHEN wt.transaction_type = 'credit' AND wt.service_fee > 0 AND wt.entry_type != 2 THEN wt.amount - wt.service_fee
                        ELSE wt.amount
                        END AS amount, wt.transaction_type, wt.charge_type, wt.per_minute_charge, wt.transaction_status, wt.description, wt.entry_type,
                    CASE
                        WHEN TIMESTAMPDIFF(SECOND, wt.created_at, NOW()) < 60 THEN
                        CONCAT(TIMESTAMPDIFF(SECOND, wt.created_at, NOW()), ' seconds ago')
                        WHEN TIMESTAMPDIFF(MINUTE, wt.created_at, NOW()) < 60 THEN
                        CONCAT(TIMESTAMPDIFF(MINUTE, wt.created_at, NOW()), ' minutes ago')
                        WHEN TIMESTAMPDIFF(HOUR, wt.created_at, NOW()) < 24 THEN
                        CONCAT(TIMESTAMPDIFF(HOUR, wt.created_at, NOW()), ' hours ago')
                        ELSE
                        CONCAT(TIMESTAMPDIFF(DAY, wt.created_at, NOW()), ' days ago')
                    END AS time_ago
                FROM 
                    wallet_transaction wt   
                WHERE
                    user_id = ${user_id}`
                if(fromDateObj != '') {
                        query += ` AND created_at >= '${fromDateObj}'`
                } 
                if(toDateObj != '') {
                    query += ` AND created_at <= '${toDateObj}'`
                }
                query += ` ORDER BY
                    id DESC       
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

    update : (conn,walletData,wallet_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE wallet set ? WHERE id = ?`, [walletData,wallet_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    listnerBalanceList: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    wt.*, u.full_name, u.email
                FROM 
                    wallet wt 
                JOIN
                    users u
                ON 
                    wt.user_id = u.id      
                WHERE
                    u.user_type = 'listner'       
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

    getWalletData: (conn,wallet_id) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    wallet
                WHERE
                    id = ${wallet_id}    
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

    totalWalletBalance: (conn,usertype) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    SUM(wt.balance) as totalAmount
                FROM 
                    wallet wt
                JOIN
                    users u
                ON 
                    wt.id = u.id      
                WHERE
                    u.user_type = '${usertype}'  
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

    totalBonusIssued: (conn,usertype) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    SUM(amount) as totalBonusAmount
                FROM 
                    wallet_transaction
                WHERE
                    entry_type = 3
                AND
                    transaction_status = 'success'         
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