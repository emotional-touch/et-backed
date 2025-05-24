module.exports = {
    apiGetRechargePlan : (conn, gstFeesPercentage) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    id,
                    recharge_amount,
                    ROUND((recharge_amount * ${gstFeesPercentage} / 100)) AS gst_amount,
                    ${gstFeesPercentage} as gst_percentage,
                    highlight_status
                FROM 
                    recharge_plan
                WHERE
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
    insert : (conn,rechargeData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO recharge_plan set ?`, [rechargeData], function(err, result) {
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
                recharge_plan
                WHERE
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
    delete : (conn,rechargeId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE recharge_plan SET deleted_at = NOW() WHERE id = ?`, [rechargeId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,rechargeId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM recharge_plan WHERE id = ?`, [rechargeId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,rechargeData,rechargeId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE recharge_plan set ? WHERE id = ?`, [rechargeData,rechargeId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}