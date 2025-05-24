module.exports = {
    adminAuthCheck: (conn,email) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT admins.*,admin_role.permission FROM admins LEFT JOIN admin_role ON admins.role_id = admin_role.id WHERE admins.email = ?`, [email],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    adminTokenAuthCheck: (conn,token) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM admins WHERE reset_token = ?`, [token],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    adminPasswordReset: (conn,admin_id,password) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE admins set password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?`, [password, admin_id],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,adminData,admin_id) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE admins set ? WHERE id = ?`, [adminData,admin_id], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    insert : (conn,adminData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO admins set ?`, [adminData], function(err, result) {
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
                admins.*, admin_role.name as role FROM admins LEFT JOIN admin_role ON admins.role_id = admin_role.id WHERE admins.admin_type = 'sub-admin'
                AND admins.deleted_at IS NULL` 
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    delete : (conn,adminId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE admins SET deleted_at = NOW() WHERE id = ?`, [adminId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,adminId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM admins WHERE id = ?`, [adminId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
}