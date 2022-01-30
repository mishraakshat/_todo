const express = require('express')
const pool = require('../db/db')


const router = new express.Router()

router.post('/todos', async (req, res) => {
    try{
        // console.log(req.body)
        const {description, deadline} = req.body
        // console.log(deadline)
        const newTodo = await pool.query(
            'INSERT INTO todo (description, deadline) VALUES (($1),($2)) RETURNING *',
            [description, deadline]
        )
        // console.log(newTodo)
        res.send(newTodo.rows)
    } catch(e)
    {
        // console.log(err)
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
        console.log(e)
        res.status(404).send(e)
    }
})

// get with id
router.get('/todos/:id' , async (req, res) => {
    try{
        const id = req.params.id
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
        const date = req.body.deadline
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


// update with id
router.put('/todos/:id', async (req, res) => {
    try{
        const id = req.params.id
        const newdescription = req.body.description
        const getChanges = await pool.query(
            'UPDATE todo SET description = ($1) WHERE todo_id = ($2) RETURNING *',
            [newdescription,id]
        )
        res.status(201).send(getChanges.rows)
    } catch(e)
    {
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

module.exports = router