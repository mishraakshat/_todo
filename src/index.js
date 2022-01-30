const express = require('express')
const app = express()
const todoRouter = require('./routers/todo')

const port = process.env.PORT || 3000
app.use(express.json())
app.use(todoRouter)


app.listen(port, () => {
    console.log(`:) listining at port no ${port}`)
})