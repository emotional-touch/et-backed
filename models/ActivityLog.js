module.exports = {
    storeActivityLog: (conn,storeActivityData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO activity_log set ?`, [storeActivityData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    editServiceRequestData: (conn,id,actionRequestData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE activity_request set ? WHERE id = ?`, [actionRequestData,id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    getServiceRequest: (conn,request_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    activity_request
                WHERE 
                    id = ${request_id}
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
    logMessage: (conn, fromId, toId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                id as _id,
                from_id,
                to_id,
                text,
                created_at as createdAt,
                type,
                log_type,
                session_type
            FROM
                activity_log
            WHERE
                ((from_id = ${fromId} AND to_id = ${toId}) OR (from_id = ${toId} AND to_id = ${fromId}))
            ORDER BY
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
    latestLogMessage: (conn, logId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                id as _id,
                from_id,
                to_id,
                text,
                created_at as createdAt,
                type,
                log_type
            FROM
                activity_log
            WHERE
                id = ${logId}
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
    sessionClosedChange: (conn,userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    activity_request
                WHERE 
                    request_status  = 'accepted'
                AND    
                    (from_id = ${userId}  OR to_id = ${userId})
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
    editPendingRquestData:(conn,id,pendingData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE activity_request set ?  
            WHERE 
                request_status  = 'pending'
            AND    
                (from_id = ?  OR to_id = ?)`, [pendingData,id,id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    listPendingRquestUser:(conn,userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    activity_request
                WHERE 
                    request_status  = 'pending'
                AND    
                    (from_id = ${userId}  OR to_id = ${userId})
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
    totalListingHoursGet: (conn, listner_id) =>  {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT 
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
                (to_id = ? OR from_id = ?)`, [listner_id, listner_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    freeMessageCount: (conn, from_id, to_id) =>  {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT 
                COUNT(id)
            AS 
                free_msg_count
            FROM 
                activity_log
            WHERE
                free_msg = 1
            AND
                DATE(created_at) = CURDATE()        
            AND    
                (from_id = ? AND to_id = ?)`, [from_id, to_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    checkExistRequest: (conn,fromId, toId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    activity_request
                WHERE 
                    (request_status = 'pending' OR request_status = 'accepted')
                    AND
                    ((from_id = ${fromId} AND to_id = ${toId})
                        OR
                    (from_id = ${toId} AND to_id = ${fromId}))
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
}