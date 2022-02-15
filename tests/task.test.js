const request = require('supertest')
const app = require('../src/app')
const redis_client = require('../src/db/redisConnect')
const pool = require('../src/db/db')
const {userOne, userTwo, userThree , todoThree, todoTwo, setupDatabase} = require('./fixtures/db')
// const { TestWatcher } = require('jest')
// setupDatabase is nonblocking code
beforeEach(setupDatabase)

test('Should create task for user', async () => {
    const response = await request(app).post('/todos').set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send({
        description:'TESTING',
        _group:'test'
    }).expect(201)

    const todo = await pool.query(`SELECT todo_id,completed FROM todo WHERE user_id = ${response.body.user_id} AND todo_id = ${response.body.todo_id}`)
    expect(todo.rowCount).not.toBe(0)
    expect(todo.rows[0].completed).toBe(false)
})

test('Should return all todos of user', async () => {
    const response = await request(app).get('/todos').set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(200)

    for(const todo of response.body)
    {
        expect(todo.user_id).toBe(userTwo.user_id)
    }
})

test('User can delete the todo belong to them', async() => {
    const response = await request(app).delete(`/todos/${todoTwo.todo_id}`).set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(200)
})

test('User tries to delete todo belongs to other user', async () => {
    const response = await request(app).delete(`/todos/${todoThree.todo_id}`).set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(404)

    const todo = await pool.query(`SELECT todo_id FROM todo WHERE todo_id = ${todoThree.todo_id}`) 
    expect(todo.rowCount).not.toBe(0)
})

test('User should not able to fetch other users todo by id', async() => {
    const response = await request(app).get(`/todos/${todoThree.todo_id}`).set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(404)
})

test('User can fetch todo with id which belongs to them', async() => {
    const response = await request(app).get(`/todos/${todoTwo.todo_id}`).set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(200)

    const todo = response.body
    expect(todo.user_id).toBe(userTwo.user_id)
})

// test('User can fetch')