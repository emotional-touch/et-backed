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
    findReview: (conn,userId,listenerId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM review WHERE user_id = ? AND listner_id = ?`, [userId, listenerId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    apiDeleteReview: (conn,reviewId) => {
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