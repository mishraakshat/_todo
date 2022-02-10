const express = require('express')
const app = express()
const todoRouter = require('./routers/todo')
const userRouter = require('./routers/user')

const port = process.env.PORT || 3000
app.use(express.json())
app.use(todoRouter)
app.use(userRouter)


app.listen(port, () => {
    console.log(`:) listining at port no ${port}`)
})