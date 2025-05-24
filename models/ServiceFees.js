module.exports = {
    list: (conn, fieldName) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    * 
                FROM 
                    service_fees
                WHERE
                    field_name = '${fieldName}'   
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

    update : (conn,feesData,fieldName) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE service_fees set ? WHERE field_name = '${fieldName}'`, [feesData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}