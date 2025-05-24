module.exports = {
    insert : (conn,pageData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO pages set ?`, [pageData], function(err, result) {
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
                pages
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
    delete : (conn,pageId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM pages WHERE id = ?`, [pageId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,pageId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM pages WHERE id = ?`, [pageId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,pageData,pageId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE pages set ? WHERE id = ?`, [pageData,pageId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}