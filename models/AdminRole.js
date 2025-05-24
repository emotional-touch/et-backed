module.exports = {
    insert : (conn,roleData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO admin_role set ?`, [roleData], function(err, result) {
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
                    * FROM admin_role WHERE
                deleted_at IS NULL` 
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    delete : (conn,roleId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE admin_role SET deleted_at = NOW() WHERE id = ?`, [roleId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,roleId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM admin_role WHERE id = ?`, [roleId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,roleData,roleId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE admin_role set ? WHERE id = ?`, [roleData,roleId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    
}