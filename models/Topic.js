module.exports = {
    list: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    topic
                WHERE 
                    status = 1
                AND
                    deleted_at IS NULL    
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
    find: (conn,topic_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    topic
                WHERE 
                    id = ${topic_id}
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
    insert : (conn,topicData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO topic set ?`, [topicData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    delete : (conn,topicId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE topic SET deleted_at = NOW() WHERE id = ?`, [topicId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,topicId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM topic WHERE id = ?`, [topicId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,topicData,topicId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE topic set ? WHERE id = ?`, [topicData,topicId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}