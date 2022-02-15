const jwt = require('jsonwebtoken')
const pool = require('../db/db')

const auth = async (req, res, next) => {
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.user_id = decode.user_id
        const user = await pool.query(`SELECT * from "user" WHERE user_id = ${req.body.user_id}`)
        // console.log(user.rows[0])

        if(user.rows.length == 0) throw new Error('Deleted User')
        next()
    }
    catch(e)
    {
        // console.log(e)
        res.status(401).send({error : 'No Authentication'})
    }
}

module.exports = auth