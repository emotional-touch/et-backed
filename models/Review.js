module.exports = {
    insert : (conn,reviewData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO review set ?`, [reviewData], function(err, result) {
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
            SELECT review.listner_id as l_id,
                users.full_name as user_name,
                ROUND(AVG(review.rating), 1)  as ratings,
                COUNT(review.id) as review_count
            FROM review
            LEFT JOIN users ON review.listner_id = users.id
            GROUP BY l_id, user_name`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,reviewData,reviewId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE review set ? WHERE id = ?`, [reviewData,reviewId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,userId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT review.listner_id as l_id,
                users.full_name as user_name,
                AVG(review.rating) as ratings,
                COUNT(review.id) as review_count
            FROM review
            LEFT JOIN users ON review.listner_id = users.id
            WHERE review.listner_id = ?`, [userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },

    givenReviewDetails: (conn,userId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT
            review.*,
            users.id as user_id,
            users.full_name as user_name,
            users.profile_photo,
            AVG(review.rating) OVER (PARTITION BY users.id) as avg_rating,
            COUNT(review.id) OVER (PARTITION BY users.id) as review_count
        FROM review
        LEFT JOIN users ON review.listner_id = users.id
        WHERE review.user_id = ? ORDER BY
        review.id DESC`, [userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    receivedReviewDetails: (conn,userId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT
            review.*,
            users.id as user_id,
            users.full_name as user_name,
            users.profile_photo,
            AVG(review.rating) OVER (PARTITION BY users.id) as avg_rating,
            COUNT(review.id) OVER (PARTITION BY users.id) as review_count
        FROM review
        LEFT JOIN users ON review.user_id = users.id
        WHERE review.listner_id = ? ORDER BY
        review.id DESC`, [userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    userDetails: (conn,userId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT 
                *
            FROM 
            users WHERE is_active = 1
            AND id = ?`, [userId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        });
    },
    delete : (conn,reviewId) => {
        return new Promise(function(resolve,reject){
            conn.query(`DELETE FROM review WHERE id = ?`, [reviewId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}