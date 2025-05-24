module.exports = {
    list: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                u.id AS listener_id,
                COALESCE(w.balance, 0) AS payout_amount,
                COALESCE(llp.penalty_amt, 0) AS leave_panelty_amt,
                COALESCE(lsp.penalty_amt, 0) AS session_miss_panelty_amt
            FROM 
                users u
            LEFT JOIN 
                wallet w ON u.id = w.user_id
            LEFT JOIN 
                listener_leave_penalty llp ON u.id = llp.listener_id
                    AND llp.panelty_date >= DATE_FORMAT(NOW(), '%Y-%m-24')
            LEFT JOIN 
                listener_session_missed_penalty lsp ON u.id = lsp.listener_id
                    AND lsp.panelty_date >= DATE_FORMAT(NOW(), '%Y-%m-24')
            WHERE 
                u.user_type = 'listner'
                AND u.listner_status = 2
                AND u.profile_status = 2`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    payoutList: (conn, limit = 0, offset = 5, search) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as total_records
                FROM 
                    payout_table pt
                JOIN 
                    users u ON pt.listener_id = u.id
                WHERE
                    pt.net_payout_amount != 0     
            `
            if (search && search.value) {
                query += ` AND (u.full_name LIKE '%${search.value}%' OR u.email LIKE '%${search.value}%' OR u.upi_id LIKE '%${search.value}%')`; // Adjust according to your database
            }

            conn.query(query, function(error, rows) {
                if (error) {
                    reject(error);
                } else {
                    let totalRecords = rows[0].total_records;
                    query = `
                    SELECT 
                        pt.*, u.full_name, u.email, u.upi_id
                    FROM 
                        payout_table pt
                    JOIN 
                        users u ON pt.listener_id = u.id 
                    WHERE
                        pt.net_payout_amount != 0 `;
                    if (search && search.value) {
                        query += ` AND (u.full_name LIKE '%${search.value}%' OR u.email LIKE '%${search.value}%' OR u.upi_id LIKE '%${search.value}%')`; // Adjust according to your database
                    }        
                    query += ` ORDER BY
                        pt.id ASC LIMIT ${limit} OFFSET ${offset}      
                    `;
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
    insert : (conn, data) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO payout_table set ?`, [data], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    payoutEntryCheck : (conn, listenerId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                *
            FROM 
                payout_table
            WHERE 
                listener_id = ${listenerId}
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
    payoutInfo :  (conn, payoutId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                *
            FROM 
                payout_table
            WHERE 
                id = ${payoutId}
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
    update : (conn,payoutData,listenerId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE payout_table set ? WHERE listener_id = ?`, [payoutData,listenerId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}