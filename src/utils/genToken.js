const jwt = require('jsonwebtoken')
const pool = require('../db/db')

const generateToken = async (id) => {
    const token = jwt.sign({user_id: id}, process.env.JWT_SECRET)
    // console.log(id)
    const val = await pool.query(`UPDATE "user" SET token = '${token}' WHERE user_id = ${id} RETURNING *`)
    // console.log(val)
    return token
}

module.exports = generateToken