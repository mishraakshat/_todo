const express = require('express')
const pool = require('../db/db')
const trimLowerElement = require('../utils/utils')
const redis_client = require('../db/redis-cli')
const { status } = require('express/lib/response')
const EXPIRATION_TIME = 60
redis_client.connect()

const router = new express.Router()

// create todo
router.post('/todos', async (req, res) => {
    try{
        const keys = trimLowerElement(Object.keys(req.body)).join(',')
        const values = trimLowerElement(Object.values(req.body)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
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
        const set_with_group = await redis_client.sAdd(`group:${newTodo.rows[0]._group}`, data)
       
        res.send(newTodo.rows[0])
        
    } catch(e)
    {
        console.log(e)
        res.status(400).send(e)
    }
})

// get all todos
router.get('/todos' , async (req, res) => {
    // console.log(req.params.x, req.params.y)
    try{
        const {offset, limit} = req.query
        
        let OFFSET = ''
        let LIMIT  = ''
        if(offset) OFFSET = `OFFSET ${offset}`
        if(limit)  LIMIT  = `LIMIT ${limit}`

        console.log(OFFSET,LIMIT)
        const allTodos = await pool.query(
            `SELECT * FROM todo ${LIMIT} ${OFFSET}`
            )
        res.status(200).send(allTodos.rows)
    }
    catch(e)
    {
        // console.log(e)
        res.status(404).send(e)
    }
})

// get with id
router.get('/todos/:id' , async (req, res) => {
    try{
        const id = req.params.id.trim()
        // await redis_client.connect()
        const details = await redis_client.get(`id:${id}`)
        // await redis_client.disconnect()
        // console.log(details," data")
        res.status(201).send(JSON.parse(details))
       
    }
    catch(e)
    {
        res.status(404).send(e)
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
router.get('/todosByGroup' ,async (req, res) => {
    try{
        const group = req.body.group.trim().toLowerCase()
        // await redis_client.connect()
        let allData = await redis_client.sMembers(`group:${group}`)
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
router.put('/todos/:id', async (req, res) => {
    try{
        const id = req.params.id.trim()
        // const newdescription = req.body.description.trim().toLowerCase()
        const keys = trimLowerElement(Object.keys(req.body)) 
        const values = trimLowerElement(Object.values(req.body)).map(x => (typeof x == 'string') ? `'${x}'` : x) 
        const QUERY = [keys, values].reduce((a, b) => a.map((v, i) => v + ' ='  + b[i])).join(', ');
        // console.log(QUERY)
        // console.log(id, newdescription)
        // delete from redis group set
        const getInitial = await (await pool.query(`SELECT * from todo WHERE todo_id = ${id}`)).rows[0]
        console.log(getInitial)
        await redis_client.sRem(`group:${getInitial._group}`, JSON.stringify(getInitial))


        const getChanges = await pool.query(
            `UPDATE todo SET ${QUERY} WHERE  todo_id = ${id} RETURNING *`
        )
        
        const data = JSON.stringify(getChanges.rows[0]) 
        await redis_client.sAdd(`group:${getChanges.rows[0]._group}`, data)
        await redis_client.set(`id:${getChanges.rows[0].todo_id}`, data)
        res.status(201).send(getChanges.rows[0])

    } catch(e)
    {
        res.status(404).send(e)
    }
})

// make completed by group name
router.put('/makeCompleted', async (req, res) => {
    try{
        
        const group = req.body._group.trim().toLowerCase()
        const value = req.body.completed.trim().toLowerCase()
        // console.log(group, value)
        const getChanges = await pool.query(
            'UPDATE todo SET completed = CAST(($1) AS BOOLEAN) WHERE  _group = ($2) RETURNING *',
            [value, group]
        )

        await redis_client.del(`group:${group}`)
        for(const todo of getChanges.rows)
        {
            const data = JSON.stringify(todo)
            await redis_client.set(`id:${todo.todo_id}`, data)
            await redis_client.sAdd(`group:${group}`, data)

        }

        res.status(201).send(getChanges.rows)
    } catch(e)
    {
        // console.log(e)
        res.status(404).send(e)
    }
})


// delete
router.delete('/todos/:id', async (req, res) => {
    try{
        const id = req.params.id.trim()
        
        const deletedTodo = await pool.query(
            'DELETE FROM todo WHERE todo_id = ($1) RETURNING *',
            [id]
        )
        // console.log(1)
        if(!deletedTodo.rows[0]) return res.status(201).send('Already Deleted')
        // console.log(deletedTodo.rows[0])

        // await redis_client.connect()
        const exits = await redis_client.exists(`id:${id}`)
        if(exits == 1) await redis_client.del(`id:${id}`)
        await redis_client.sRem(`group:${deletedTodo.rows[0]._group}`, JSON.stringify(deletedTodo.rows[0]))
        // delete from group set

        // console.log(2)
  
        res.status(200).send(deletedTodo.rows[0])
    }
    catch(e)
    {
        res.status(404).send(e)
    }
})
// delete with group name
router.delete('/deleteByGroup', async (req, res) => {
    try{
        // const id = req.params.id
        const group = req.body._group.trim().toLowerCase()
        const deletedTodo = await pool.query(
            'DELETE FROM todo WHERE _group = ($1) RETURNING *',
            [group]
        )
        if(deletedTodo.rows.length == 0) return res.status(200).send('already deleted')
        // await redis_client.connect()
        // console.log('CONNECTED :)')
        let delStatus1 = await redis_client.del(`group:${group}`)

        for(const todo of deletedTodo.rows)
        {
            const stat = await redis_client.del(`id:${todo.todo_id}`)
        }

        // await redis_client.disconnect()
        // console.log('DISCONNECTED')
        res.status(200).send(deletedTodo.rows)
    }
    catch(e)
    {
        res.status(404).send(e)
    }
})

module.exports = router