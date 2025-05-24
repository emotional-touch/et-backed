module.exports = {
    
    filterChat: (conn, user = false, listener = false, startdate = false, enddate = false) =>{
        let query = `SELECT messages.id, messages.from_id as fromUserId, messages.to_id as toUserId, messages.message, messages.time, messages.date, users.full_name as user_name, users.profile_photo 
        FROM messages
        LEFT JOIN users ON users.id = messages.from_id
        WHERE ((messages.from_id = ${user} AND messages.to_id = ${listener}) OR (messages.from_id = ${listener} AND messages.to_id = ${user}))`;
        if(startdate && enddate){
            query += ` AND (messages.date >= '${startdate}' AND messages.date <= '${enddate}')`;
        }else if(startdate){
            query += ` AND (messages.date >= '${startdate}')`;
        }else if(enddate){
            query += ` AND (messages.date <= '${enddate}')`;
        }
        query += ` ORDER BY messages.id ASC`;
        return new Promise(function(resolve,reject){
            conn.query(query,function (error, rows) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(rows);
                    }
                }
            )
        });
    },
    
}