module.exports = {
    insert : (conn,faqCategoryData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO faq_category set ?`, [faqCategoryData], function(err, result) {
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
                faq_category
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
    delete : (conn,faqCategoryId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM faq_category WHERE id = ?`, [faqCategoryId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,faqCategoryId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM faq_category WHERE id = ?`, [faqCategoryId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    update : (conn,catData,faqCategoryId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE faq_category set ? WHERE id = ?`, [catData,faqCategoryId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}