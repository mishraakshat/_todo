const express = require('express')
const pool = require('../db/db')
const trimLowerElement = require('../utils/utils')

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
        // console.log(newTodo)
        res.send(newTodo.rows)
    } catch(e)
    {
        // console.log(e)
        res.status(400).send(e)
    }
})

// get all todos
router.get('/todos' , async (req, res) => {
    // console.log(req.params.x, req.params.y)
    try{
        const {offset, limit} = req.query
        // console.log(req)
        // console.log(offset,limit)
        let OFFSET = ''
        let LIMIT  = ''
        if(offset) OFFSET = `OFFSET ${offset}`
        if(limit)  LIMIT  = `LIMIT ${limit}`

        // console.log(OFFSET,LIMIT)
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
        const allTodos = await pool.query(
            'SELECT * FROM todo WHERE todo_id = ($1)',
            [id] 
        )

        res.status(200).send(allTodos.rows)
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
        // console.log(date)
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
        const group = req.body.group
        // console.log(date)
        const allTodos = await pool.query(
            'SELECT * FROM todo WHERE _group = TRIM($1)',
            [group]
            )

            res.status(200).send(allTodos.rows)
    } catch(e)
    {
        // console.log(date)
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
        const getChanges = await pool.query(
            // 'UPDATE todo SET description = ($1) WHERE todo_id = ($2) RETURNING *',
            // [newdescription,id]
            `UPDATE todo SET ${QUERY} WHERE  todo_id = ${id} RETURNING *`
        )
        res.status(201).send(getChanges.rows)
    } catch(e)
    {
        res.status(404).send(e)
    }
})

// make completed by group name
router.put('/makeCompleted', async (req, res) => {
    try{
        // const id = req.params.id
        // const keys = trimLowerElement(Object.keys(req.body)) 
        // const values = trimLowerElement(Object.values(req.body)).map(x => (typeof x == 'string') ? `'${x}'` : x) 
        // const QUERY = [keys, values].reduce((a, b) => a.map((v, i) => v + ' ='  + b[i])).join(',');
        // console.log(QUERY)


        const group = req.body._group.trim().toLowerCase()
        const value = req.body.completed.trim().toLowerCase()
        // console.log(group, value)
        const getChanges = await pool.query(
            'UPDATE todo SET completed = CAST(($1) AS BOOLEAN) WHERE  _group = ($2) RETURNING *',
            [value, group]
            // `UPDATE todo SET ${QUERY} WHERE  _group = ($2) RETURNING *`
        )
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
        const id = req.params.id
        const deletedTodo = await pool.query(
            'DELETE FROM todo WHERE todo_id = ($1) RETURNING *',
            [id]
        )
        res.status(200).send(deletedTodo.rows)
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
        const group = req.body._group.trim()
        const deletedTodo = await pool.query(
            'DELETE FROM todo WHERE _group = ($1) RETURNING *',
            [group]
        )
        res.status(200).send(deletedTodo.rows)
    }
    catch(e)
    {
        res.status(404).send(e)
    }
})

module.exports = router