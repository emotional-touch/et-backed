module.exports = {
    insert : (conn,faqData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO faqs set ?`, [faqData], function(err, result) {
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
                    faqs.*, faq_category.name as category_name FROM faqs LEFT JOIN faq_category ON faqs.category_id = faq_category.id WHERE
                    faqs.deleted_at IS NULL` 
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    delete : (conn,faqId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE faqs SET deleted_at = NOW() WHERE id = ?`, [faqId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,faqId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT faqs.*, faq_category.name as category_name FROM faqs LEFT JOIN faq_category ON faqs.category_id = faq_category.id WHERE faqs.id = ?`, [faqId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,faqData,faqId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE faqs set ? WHERE id = ?`, [faqData,faqId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

    apiGetFaqs: (conn) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    faqs.*, faq_category.name as category_name 
                FROM 
                    faqs 
                LEFT JOIN 
                    faq_category ON faqs.category_id = faq_category.id
                WHERE
                    faqs.status = 1
                AND
                    faqs.user_type  != 'user'  
                AND
                    faqs.deleted_at IS NULL` 
                conn.query(query,function(error,rows) {
                    if(error) {
                        reject(error)
                    } else {
                        resolve(rows)
                    }
                })
        })
    },

    getSupportCategory: (conn, userType) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    faq_category.id, faq_category.name as category_name 
                FROM 
                    faq_category  
                JOIN 
                    faqs ON faq_category.id = faqs.category_id
                WHERE
                    faq_category.deleted_at IS NULL
                AND
                    faqs.user_type = '${userType}'
                AND
                    faqs.status = 1 
                AND
                    faqs.deleted_at IS NULL
                GROUP BY 
                    faq_category.id` 
                conn.query(query,function(error,rows) {
                    if(error) {
                        reject(error)
                    } else {
                        resolve(rows)
                    }
                })
        })
    }, 

    getCategoryQuestion: (conn, categoryId) =>{
        return new Promise(function(resolve,reject){
            let query = `
                SELECT 
                    id, question, answer 
                FROM 
                    faqs  
                WHERE
                    category_id = ${categoryId}
                AND
                    faqs.status = 1 
                AND
                    faqs.deleted_at IS NULL` 
                conn.query(query,function(error,rows) {
                    if(error) {
                        reject(error)
                    } else {
                        resolve(rows)
                    }
                })
        })
    },
    
    contactBoatQuestion: (conn, userType) =>{
        return new Promise(function(resolve,reject){
            let query = `
            SELECT
                fc.id AS category_id,
                fc.name AS category_name,
                JSON_ARRAYAGG(JSON_OBJECT('id', f.id, 'question', f.question, 'answer', f.answer)) AS faqs
            FROM
                faq_category fc
            JOIN
                faqs f ON fc.id = f.category_id
            WHERE
                fc.deleted_at IS NULL
                AND f.deleted_at IS NULL
                AND f.status = 1
                AND f.user_type = '${userType}'
            GROUP BY
                fc.id, fc.name; ` 
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