module.exports = {
    insert : (conn,couponData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO coupon set ?`, [couponData], function(err, result) {
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
                    * FROM coupon WHERE
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
    delete : (conn,couponId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE coupon SET deleted_at = NOW() WHERE id = ?`, [couponId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    details: (conn,couponId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM coupon WHERE id = ?`, [couponId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,couponData,couponId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE coupon set ? WHERE id = ?`, [couponData,couponId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    apiGetCoupon : (conn, couponStatus) =>{
        const currentDate = new Date().toISOString().split('T')[0];
        return new Promise(function(resolve,reject){
            var query = `
                SELECT 
                    id,
                    code,
                    type, 
                    discount_per,
                    CAST(discount_amount AS SIGNED) AS discount_amount,
                    min_amount,
                    CASE
                        WHEN type = 'per' THEN CONCAT('Get ', discount_per, '% off on recharge of ', min_amount, ' rupees and above')
                        ELSE CONCAT('Get ', discount_amount, ' rupees off on recharge of ', min_amount, ' rupees and above')
                    END AS description
                FROM 
                    coupon
                WHERE
                    deleted_at IS NULL
                AND
                    (coupon_used_count < user_limit OR user_limit = 0)     
                AND
                    expiry_date >= '${currentDate}'
                AND  (id != 8 OR ${couponStatus} != 1)` 
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    }, 
    welcomeCouponDetails : (conn, userId) =>{
        const currentDate = new Date().toISOString().split('T')[0];
        return new Promise(function(resolve,reject){
            var query = `
                SELECT 
                    id,
                    code,
                    type, 
                    discount_per,
                    CAST(discount_amount AS SIGNED) AS discount_amount,
                    min_amount,
                    CASE
                        WHEN type = 'per' THEN CONCAT('Get ', discount_per, '% off on recharge of ', min_amount, ' rupees and above')
                        ELSE CONCAT('Get ', discount_amount, ' rupees off on recharge of ', min_amount, ' rupees and above')
                    END AS description
                FROM 
                    coupon
                WHERE
                    deleted_at IS NULL
                AND
                    (coupon_used_count < user_limit OR user_limit = 0)     
                AND
                    expiry_date >= '${currentDate}'
                AND  id = 8` 
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    }, 
    couponCountAdd : (conn,couponId = false) =>{
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE coupon SET coupon_used_count = coupon_used_count + 1 WHERE id = ?`, [couponId],function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
}