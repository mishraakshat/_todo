const Pool =require('pg').Pool


const pool = new Pool({
    database:process.env.DB_NAME,
    host:process.env.DB_HOST,
    port: process.env.DB_PORT, 
})

module.exports = pool