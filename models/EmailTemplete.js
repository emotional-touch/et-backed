module.exports = {
    list: (conn,temp_id = false) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    email_template
            `
            if(temp_id) {
                query += ` WHERE id = ${temp_id}`
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
    insert : (conn,tempData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO email_template set ?`, [tempData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    delete : (conn,tempId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM email_template WHERE id = ?`, [tempId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,tempId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM email_template WHERE id = ?`, [tempId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,tempData,tempId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE email_template set ? WHERE id = ?`, [tempData,tempId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}