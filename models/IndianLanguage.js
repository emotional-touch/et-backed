module.exports = {
    list: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT 
                *
            FROM 
                indian_languages`
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