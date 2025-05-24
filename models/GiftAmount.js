module.exports = {
    apiGetGiftAmount : (conn, gstFeesPercentage) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    id,
                    gift_amount,
                    ROUND((gift_amount * ${gstFeesPercentage} / 100)) AS gst_amount,
                    ${gstFeesPercentage} as gst_percentage
                FROM 
                    gift_amount
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
    insert : (conn,giftData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO gift_amount set ?`, [giftData], function(err, result) {
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
                gift_amount
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
    delete : (conn,giftId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE gift_amount SET deleted_at = NOW() WHERE id = ?`, [giftId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,giftId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM gift_amount WHERE id = ?`, [giftId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,giftData,giftId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE gift_amount set ? WHERE id = ?`, [giftData,giftId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}