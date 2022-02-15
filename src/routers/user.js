const express = require('express')
const validator = require('email-validator')
const generateToken = require('../utils/genToken')
const pool = require('../db/db')
const trimLowerElement = require('../utils/utils')
const redis_client = require('../db/redisConnect')
const { status } = require('express/lib/response')
const auth = require('../middleware/auth')
const req = require('express/lib/request')
const res = require('express/lib/response')
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
        
        let newUser = await pool.query(
                `INSERT INTO "user" (name, password, email) VALUES ('${name}', '${password}', '${email}') RETURNING *`,
        )
        const token = (await generateToken(newUser.rows[0].user_id)).toString()
        req.body.token = token
        req.body.user_id = newUser.rows[0].user_id

        // await redis_client.set('USER',req.body.userName)
        return res.status(201).send(req.body)
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

        // console.log(email, password)

        const user = await pool.query(`SELECT * from "user" WHERE email = '${email}' AND password = '${password}'`)
        // console.log(user.rowCount)
        if(user.rows.length === 0) throw new Error()
        const token = (await generateToken(user.rows[0].user_id)).toString()
        req.body.token = token
        req.body.user_id =user.rows[0].user_id
        // console.log(1)
        res.status(200).send(req.body)
    }
    catch(e)
    {
        // console.log(e)
        return res.status(400).send({error : 'Invalid user'})
    }
    
    
})

router.get('/users/me', auth, async (req, res) => {
    try
    {
        // console.log(req.body.user_id)
        let userDetails = await pool.query(`select * from "user" where user_id = ${req.body.user_id}`)
        userDetails = userDetails.rows[0]
        // console.log(userDetails)
        res.status(200).send(userDetails)
    } 
    catch(e)
    {
        res.status(401).send({error:'Not Found'})
    }
})

router.post('/signout', auth, async (req, res) => {
    try{
        // console.log(req.body)
        res.status(200).send(req.body)
    }catch(e)
    {
        res.status(400).send({error: 'Not Found'})
    }
})

router.post('/delete/me', auth, async (req, res) => {
    try{
        // console.log('/delete/me')
        let deletedTodos = await pool.query(`DELETE from todo where user_id = ${req.body.user_id} RETURNING todo_id`)
        deletedTodos = deletedTodos.rows

        for(const details of deletedTodos)
        {
            // console.log(todo_id)
            await redis_client.del(`id:${details.todo_id}`)
        }
        const all_keys = await redis_client.keys(`u_id:${req.body.user_id}*`)
        // console.log(all_keys)
        for(const key of all_keys) 
        {
            await redis_client.del(key)
            // console.log(key)
        }

        let userDetail = await pool.query(`DELETE from "user" where user_id = ${req.body.user_id} RETURNING *`)

        res.status(200).send(userDetail.rows[0])
    }
    catch(e)
    {
        res.status(401).send({error:'Not Found'})
    }
})
module.exports = router