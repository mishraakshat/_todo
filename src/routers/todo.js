const express = require('express')
const pool = require('../db/db')
const trimLowerElement = require('../utils/utils')
const redis_client = require('../db/redisConnect')
const { status } = require('express/lib/response')
const auth = require('../middleware/auth')
const EXPIRATION_TIME = 60
// redis_client.connect()

const router = new express.Router()

// create todo
router.post('/todos', auth, async (req, res) => {
    try{
        // const user_id = req.user_id
        const keys = trimLowerElement(Object.keys(req.body)).join(',')
        const values = trimLowerElement(Object.values(req.body)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
        // console.log(req.body)
        // console.log(keys)
        // console.log(values)
        const newTodo = await pool.query(
            `INSERT INTO todo (${keys}) VALUES (${values}) RETURNING *`,
        )
        // console.log(newTodo.rows[0])
        
        // await redis_client.connect()
        const data = JSON.stringify(newTodo.rows[0])
        const status_id = await redis_client.set(`id:${newTodo.rows[0].todo_id}`, data)
        // const set_with_deadline = await redis_client.sAdd(`deadline:${newTodo.rows[0].deadline}`, data)
        const set_with_group = await redis_client.sAdd(`u_id:${req.body.user_id}|group:${newTodo.rows[0]._group}`, data)
        await redis_client.sAdd(`u_id:${req.body.user_id}`, data)
       
        res.send(newTodo.rows[0])
        
    } catch(e)
    {
        console.log(e)
        res.status(400).send(e)
    }
})

// get all todos
router.get('/todos' , auth, async (req, res) => {
    // console.log(req.params.x, req.params.y)
    try{
        const {offset, limit} = req.query
        
        let OFFSET = ''
        let LIMIT  = ''
        if(offset) OFFSET = `OFFSET ${offset}`
        if(limit)  LIMIT  = `LIMIT ${limit}`

        console.log(OFFSET,LIMIT)
        // const allTodos = await pool.query(
        //     `SELECT * FROM todo ${LIMIT} ${OFFSET}`
        //     )
        let allTodos = await redis_client.sMembers(`u_id:${req.body.user_id}`)
        allTodos = allTodos.map(x => JSON.parse(x))

        res.status(200).send(allTodos)
    }
    catch(e)
    {
        // console.log(e)
        res.status(404).send({error : 'Not Found'})
    }
})

// get with id
router.get('/todos/:id' ,auth, async (req, res) => {
    try{
        const id = req.params.id.trim()
        // await redis_client.connect()
        const details = await redis_client.get(`id:${id}`)
        // await redis_client.disconnect()
        // console.log(details," data")
        const data = JSON.parse(details)
        if(data.user_id != req.body.user_id) throw new error('User trying to get data of another user')

        res.status(201).send(data)
       
    }
    catch(e)
    {
        res.status(404).send({error : 'Not Found'})
    }
})

// get todos with date
router.get('/todosByDate' ,async (req, res) => {
    try{
        const date = req.body.deadline.trim()
        
        // not using redis here working on adding it
        const allTodos = await pool.query(
            'SELECT * FROM todo WHERE deadline = $1',
            [date]
            )

            res.status(200).send(allTodos.rows)
    } catch(e)
    {
        // console.log(date)
        res.status(404).send(e)
    }
})

// get todo with with groupName
router.get('/todosByGroup', auth, async (req, res) => {
    try{
        const group = req.body.group.trim().toLowerCase()
        // await redis_client.connect()
        let allData = await redis_client.sMembers(`u_id:${req.body.user_id}|group:${group}`)
        // await redis_client.disconnect()
        // console.log(JSON.parse(allData))
        allData = allData.map(x => JSON.parse(x))
        // console.log(allData)
        res.status(201).send(allData)
        
    } catch(e)
    {
        res.status(404).send(e)
    }
})


// update with id
router.put('/todos/:id', auth, async (req, res) => {
    try{
        const id = req.params.id.trim()
        // const newdescription = req.body.description.trim().toLowerCase()
        const keys = trimLowerElement(Object.keys(req.body)) 
        const values = trimLowerElement(Object.values(req.body)).map(x => (typeof x == 'string') ? `'${x}'` : x) 
        const QUERY = [keys, values].reduce((a, b) => a.map((v, i) => v + ' ='  + b[i])).join(', ');
        // console.log(QUERY)
        // console.log(id, newdescription)
        // delete from redis group set
        // console.log(QUERY, id, req.body.user_id)

        const getInitial = await (await pool.query(`SELECT * from todo WHERE todo_id = ${id} AND user_id = ${req.body.user_id}`)).rows[0]
        // console.log(getInitial)

        if(!getInitial) throw new Error('Not Found')

        await redis_client.sRem(`u_id:${req.body.user_id}|group:${getInitial._group}`, JSON.stringify(getInitial))
        await redis_client.sRem(`u_id:${req.body.user_id}`, JSON.stringify(getInitial))


        const getChanges = await pool.query(
            `UPDATE todo SET ${QUERY} WHERE  todo_id = ${id} AND user_id = ${req.body.user_id} RETURNING *`
        )
        
        const data = JSON.stringify(getChanges.rows[0]) 
        await redis_client.sAdd(`u_id:${req.body.user_id}|group:${getChanges.rows[0]._group}`, data)
        await redis_client.sAdd(`u_id:${req.body.user_id}`, data)
        await redis_client.set(`id:${getChanges.rows[0].todo_id}`, data)

        res.status(201).send(getChanges.rows[0])

    } catch(e)
    {
        res.status(404).send({error : 'Not Found'})
    }
})

// make completed by group name
router.put('/makeCompleted', auth, async (req, res) => {
    try{
        // here i can optimise because we are not changing group
        const group = req.body._group.trim().toLowerCase()
        const value = req.body.completed.trim().toLowerCase()
        const user_id = req.body.user_id
        // console.log(group, value)
        const getChanges = await pool.query(
            'UPDATE todo SET completed = CAST(($1) AS BOOLEAN) WHERE  _group = ($2) AND user_id = ($3) RETURNING *',
            [value, group, user_id]
        )

        await redis_client.del(`u_id:${user_id}|group:${group}`)
        for(const todo of getChanges.rows)
        {
            todo.completed = false
            await redis_client.sRem(`u_id:${req.body.user_id}`, JSON.stringify(todo))
            todo.completed = true
               
            const data = JSON.stringify(todo)
            await redis_client.sAdd(`u_id:${req.body.user_id}`, data)
            await redis_client.set(`id:${todo.todo_id}`, data)
            await redis_client.sAdd(`u_id:${user_id}|group:${group}`, data)

        }

        res.status(201).send(getChanges.rows)
    } catch(e)
    {
        // console.log(e)
        res.status(404).send({error: 'Not Found'})
    }
})


// delete
router.delete('/todos/:id', auth, async (req, res) => {
    try{
        const id = req.params.id.trim()
        
        const deletedTodo = await pool.query(
            `DELETE FROM todo WHERE todo_id = ${id} AND user_id = ${req.body.user_id} RETURNING *`
        )
        // console.log(1)
        if(!deletedTodo.rows[0]) throw new Error('Not Found')
        // console.log(deletedTodo.rows[0])

        // await redis_client.connect()
        await redis_client.sRem(`u_id:${req.body.user_id}`, JSON.stringify(deletedTodo.rows[0]))
        const exits = await redis_client.exists(`id:${id}`)
        if(exits == 1) await redis_client.del(`id:${id}`)
        await redis_client.sRem(`u_id:${req.body.user_id}|group:${deletedTodo.rows[0]._group}`, JSON.stringify(deletedTodo.rows[0]))
        // delete from group set

        // console.log(2)
  
        res.status(200).send(deletedTodo.rows[0])
    }
    catch(e)
    {
        res.status(404).send({error : 'Not Found'})
    }
})
// delete with group name
router.delete('/deleteByGroup', auth, async (req, res) => {
    try{
        // const id = req.params.id
        const group = req.body._group.trim().toLowerCase()
        const deletedTodo = await pool.query(
            `DELETE FROM todo WHERE _group = '${group}' AND user_id = ${req.body.user_id}  RETURNING *`
        )
        if(deletedTodo.rows.length == 0) throw new Error('Not Found')
        // await redis_client.connect()
        // console.log('CONNECTED :)')
        let delStatus1 = await redis_client.del(`u_id:${req.body.user_id}|group:${group}`)

        for(const todo of deletedTodo.rows)
        {
            const stat = await redis_client.del(`id:${todo.todo_id}`)
            redis_client.sRem(`u_id:${req.body.user_id}`, JSON.stringify(todo))
        }

        // await redis_client.disconnect()
        // console.log('DISCONNECTED')
        res.status(200).send(deletedTodo.rows)
    }
    catch(e)
    {
        res.status(404).send({error: 'Not Found'})
    }
})

module.exports = router