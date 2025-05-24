module.exports = {
    insert : (conn,queryData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO queries set ?`, [queryData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    list: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                queries
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
    listenerlist: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                queries.*,users.full_name as submitted_by_name 
                FROM 
                queries LEFT JOIN users ON queries.submited_by = users.id WHERE queries.user_type = 'listner'
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
    userlist: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                queries.*,users.full_name as submitted_by_name 
                FROM 
                queries LEFT JOIN users ON queries.submited_by = users.id WHERE queries.user_type = 'user'
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
    details: (conn,queryId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT 
            queries.*,users.id as u_id,users.full_name as submitted_by_name, users.email 
            FROM 
            queries LEFT JOIN users ON queries.submited_by = users.id WHERE queries.id = ?`, [queryId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,queryData,queryId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE queries set ? WHERE id = ?`, [queryData,queryId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    queryCountGet: (conn,userId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT
                            COALESCE(SUM(CASE WHEN status = '0' THEN 1 ELSE 0 END), 0) AS open_count,
                            COALESCE(SUM(CASE WHEN status = '1' THEN 1 ELSE 0 END), 0) AS replied_count
                        FROM 
                            queries
                        WHERE 
                            submited_by = ?`, [userId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    queryListGet: (conn,userId, queryType) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT
                            id, query as question, reply as answer
                        FROM 
                            queries
                        WHERE 
                            submited_by = ?
                        AND
                            status = ?`, [userId, queryType], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

}