module.exports = {
    insert : (conn,reportData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO report set ?`, [reportData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    findReport :  (conn, reportBy, reportFor) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM report WHERE report_by = ? AND report_for = ? AND status = '0'`, [reportBy, reportFor], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    findBlockedUser: (conn, userId) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT report_for as user_id FROM report WHERE report_by = ? AND status = '0'`, [userId], function(err, result) {
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
            SELECT report.*, 
                report_for_user.full_name AS report_for_name, 
                report_by_user.full_name AS report_by_name 
            FROM report 
            LEFT JOIN users AS report_for_user ON report.report_for = report_for_user.id 
            LEFT JOIN users AS report_by_user ON report.report_by = report_by_user.id 
            WHERE report.status = '0'`
            conn.query(query,function(error,rows) {
                if(error) {
                    reject(error)
                } else {
                    resolve(rows)
                }
            })
        })
    },
    update : (conn,reportData,reportId) => {
        return new Promise(function(resolve,reject){
            conn.query(`UPDATE report set ? WHERE id = ?`, [reportData,reportId], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
    checkBlockReport :  (conn, reportBy, reportFor) => {
        return new Promise(function(resolve,reject){
            conn.query(`SELECT * FROM report WHERE status = '0' AND ((report_by = ? AND report_for = ?) OR (report_by = ? AND report_for = ?))`, [reportBy, reportFor, reportFor, reportBy], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },
}