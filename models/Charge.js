module.exports = {
    insert : (conn,rechargeData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO charge set ?`, [rechargeData], function(err, result) {
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
            SELECT charge.*, users.full_name as user_name FROM charge LEFT JOIN users ON charge.user_id = users.id`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    delete : (conn,chargeId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM charge WHERE id = ?`, [chargeId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,chargeId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT charge.*, users.full_name as user_name FROM charge LEFT JOIN users ON charge.user_id = users.id WHERE charge.id = ?`, [chargeId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,chargeData,chargeId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE charge set ? WHERE id = ?`, [chargeData,chargeId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    detailsByUserId: (conn,userId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM charge WHERE user_id = ?`, [userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    listListeners: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    users WHERE user_type = 'listner' AND is_active = 1
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
    listUsers: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    *
                FROM 
                    users WHERE user_type = 'user' AND is_active = 1
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
    typeList: (conn,usertype = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE is_active = 1 AND user_type = ?`, [usertype],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    getListenerCharge: (conn,userId) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM charge WHERE user_id = ?
                OR (user_id = 0 AND NOT EXISTS (SELECT 1 FROM charge WHERE user_id = ?))`, [userId,userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
}