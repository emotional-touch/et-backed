module.exports = {
    insert : (conn,settingData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO settings set ?`, [settingData], function(err, result) {
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
                    settings
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
    delete : (conn,settingId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM settings WHERE id = ?`, [settingId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,settingId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM settings WHERE id = ?`, [settingId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,settingData,settingId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE settings set ? WHERE id = ?`, [settingData,settingId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    chargelist: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                settings WHERE field IN ('call_charge','chat_charge','video_charge') 
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
    versionlist: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    field,value 
                FROM 
                settings WHERE field IN ('android_version','ios_version','is_force_update') 
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
    gstdetails: (conn) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM settings WHERE field = 'gst_charge'`, function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    referralAmt: (conn) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM settings WHERE field = 'referral_amount'`, function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    referralPer: (conn) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM settings WHERE field = 'referral_percentage'`, function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
}