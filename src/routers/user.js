const express = require('express')
const validator = require('email-validator')
const generateToken = require('../utils/genToken')
const pool = require('../db/db')
const trimLowerElement = require('../utils/utils')
const redis_client = require('../db/redisConnect')
const { status } = require('express/lib/response')
const EXPIRATION_TIME = 60
// redis_client.connect()

const router = new express.Router()

router.post('/signup', async (req, res) => {
    try{
        // console.log(req.body)
        const name = req.body.name.trim()
        const password = req.body.password.trim()
        const email = req.body.email.trim().toLowerCase()
        if(!validator.validate(email)) return res.status(500).send({error :'use Valid email'})
        
        const newUser = await pool.query(
                `INSERT INTO "user" (name, password, email) VALUES ('${name}', '${password}', '${email}') RETURNING *`,
        )
        const token = (await generateToken(newUser.rows[0].user_id)).toString()
        req.body.token = token

        // await redis_client.set('USER',req.body.userName)
        return res.status(200).send(req.body)
    } catch(e)
    {
        // console.log(e)
        if(e.constraint === 'unique_email') return res.status(500).send({error : 'Email already used'})
        else if(e.constraint === 'password_len') return res.status(500).send({error: 'Use Strong password'})

        res.status(400).send(e)

    }
    
})

router.post('/signin', async (req, res) => {
    try {
        const email = req.body.email.trim().toLowerCase()
        const password = req.body.password.trim()
        const user = await pool.query(`SELECT * from "user" WHERE email = '${email}' AND password = '${password}'`)

        if(user.rows.length === 0) throw new Error()
        const token = (await generateToken(user.rows[0].user_id)).toString()
        req.body.token = token
        // console.log(1)
        res.status(201).send(req.body)
    }
    catch(e)
    {
        // console.log(e)
        return res.status(500).send({error : 'Invalid user'})
    }
    
    
})

module.exports = router