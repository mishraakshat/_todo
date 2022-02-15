const express = require('express')
const app = express()
const todoRouter = require('./routers/todo')
const userRouter = require('./routers/user')

app.use(express.json())
app.use(todoRouter)
app.use(userRouter)

module.exports = app