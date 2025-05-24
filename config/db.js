var mysql  = require('mysql');
require('dotenv').config();

var conn = mysql.createConnection({
  host:  process.env.DB_HOST,
  user:  process.env.DB_USERNAME,
  password :  process.env.DB_PASSWORD,
  database :  process.env.DB_DATABASE,
  charset: 'utf8mb4' 
})

conn.connect(() => {
  //console.log(`connected`)
})

module.exports = conn;