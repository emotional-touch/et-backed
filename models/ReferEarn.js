module.exports = {
    findReferCode :  (conn, referCode) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM users WHERE referral_code = ?`, [referCode], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    insert :  (conn, referData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO refer_earn set ?`, [referData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    update :  (conn, referData, referId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE refer_earn set ? WHERE id = ?`, [referData,referId], function(err, result) {
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
            SELECT refer_earn.*, 
                refer_from_user.full_name AS refer_from_name, 
                refer_from_user.referral_code AS referral_code, 
                refer_to_user.full_name AS refer_to_name 
            FROM refer_earn 
            LEFT JOIN users AS refer_from_user ON refer_earn.refer_from = refer_from_user.id 
            LEFT JOIN users AS refer_to_user ON refer_earn.refer_to = refer_to_user.id 
            WHERE refer_earn.deleted_at IS NULL`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },

    findReferalData: (conn, userId) => {
        return new Promise(function(resolve,reject){
            let query = `Select * FROM refer_earn WHERE refer_to = ${userId} AND referral_status = 'pending'`
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