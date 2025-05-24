module.exports = {
    
    details: (conn,penaltyId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM penalty WHERE id = ?`, [penaltyId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,penaltyData,penaltyId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE penalty set ? WHERE id = ?`, [penaltyData,penaltyId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}