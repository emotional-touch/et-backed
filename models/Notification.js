module.exports = {
    insert : (conn,notificationData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO notification set ?`, [notificationData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    list: (conn, userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    n.id,n.name,n.screen_type,n.message,n.opponent_id,n.read_status,
                    u.profile_photo,
                    CASE
                        WHEN TIMESTAMPDIFF(SECOND, n.created_at, NOW()) < 60 THEN
                            CONCAT(TIMESTAMPDIFF(SECOND, n.created_at, NOW()), ' seconds ago')
                        WHEN TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) < 60 THEN
                            CONCAT(TIMESTAMPDIFF(MINUTE, n.created_at, NOW()), ' minutes ago')
                        WHEN TIMESTAMPDIFF(HOUR, n.created_at, NOW()) < 24 THEN
                            CONCAT(TIMESTAMPDIFF(HOUR, n.created_at, NOW()), ' hours ago')
                        ELSE
                            CONCAT(TIMESTAMPDIFF(DAY, n.created_at, NOW()), ' days ago')
                    END AS time_ago
                FROM 
                    notification AS n
                JOIN 
                    users AS u ON n.opponent_id = u.id
                WHERE
                    n.user_id = ${userId}
                ORDER BY
                    n.id DESC        
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
    listCount: (conn, userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    COUNT(*) as count
                FROM 
                    notification n
                JOIN 
                    users AS u ON n.opponent_id = u.id
                WHERE
                    n.user_id = ${userId}
                AND 
                    n.read_status = 0
                ORDER BY
                    n.id DESC        
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
    update : (conn,notificationId,notificationData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE notification set ? WHERE id = ?`, [notificationData,notificationId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    getNotifyUser: (conn, userId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    opponent_id
                FROM 
                    notification
                WHERE
                    user_id = ${userId}
                AND
                    online_notify = 1
                GROUP BY 
                    opponent_id            
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
    updateNotify: (conn,userId,notificationData) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE notification set ? WHERE user_id = ?`, [notificationData,userId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}