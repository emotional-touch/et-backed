module.exports = {
    insert : (conn,contactData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO contact_us set ?`, [contactData], function(err, result) {
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
                    contact_us
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
    delete : (conn,contactId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM contact_us WHERE id = ?`, [contactId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}