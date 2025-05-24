module.exports = {
    nickNameFind: (conn,listenerId,userId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM nick_name WHERE listener_id = ? AND user_id = ?`, [listenerId,userId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    nickNameInsert: (conn,fieldData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO nick_name set ?`, [fieldData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    nickNameUpdate: (conn,fieldData, id) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE nick_name set ? WHERE id = ?`, [fieldData, id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    }, 
    filterNameFind: (conn, listenerId, userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                (
                    SELECT
                        CASE
                            WHEN n.nick_name IS NOT NULL THEN n.nick_name
                            WHEN u.user_type = 'user' THEN 'Anonymous' 
                            WHEN u.user_type = 'listner' AND (u.display_name IS NOT NULL AND u.display_name <> '') THEN u.display_name
                            ELSE u.full_name 
                        END
                ) AS full_name,
                user_type
            FROM
                users u
            LEFT JOIN nick_name n ON
                n.listener_id = ${listenerId} AND n.user_id = ${userId}
            WHERE
                u.id = ${userId}
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