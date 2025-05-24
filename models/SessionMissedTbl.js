module.exports = {
    addMissedSession : (conn,missedSessionData) => {
        return new Promise(function(resolve,reject){
            conn.query(`INSERT INTO session_missed_tbl set ?`, [missedSessionData], function(err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            });
        })
    },

}