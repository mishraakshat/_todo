const Pool =require('pg').Pool


const pool = new Pool({
    user:'postgres',
    // user:'yrjakqrxojomas',
    // password:'cb5b2889800abdc802efe9064c048d5d18bcee44ce867534c291cc8e10c46672',
    // database:'todo_database',
    // database:'d8i3r58ij2euh4',
    database:'postgres://yrjakqrxojomas:cb5b2889800abdc802efe9064c048d5d18bcee44ce867534c291cc8e10c46672@ec2-3-222-49-168.compute-1.amazonaws.com:5432/d8i3r58ij2euh4',
    // host:'localhost',
    // host:'ec2-3-222-49-168.compute-1.amazonaws.com',
    port: 5432
})

module.exports = pool