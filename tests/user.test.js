const request = require('supertest')
const app = require('../src/app')
const redis_client = require('../src/db/redisConnect')
const pool = require('../src/db/db')
// const generateToken = require('../src/utils/genToken')

const { response } = require('../src/app')
const {userOne, userTwo, setupDatabase} = require('./fixtures/db')

// setupDatabase is nonblocking code
beforeEach(setupDatabase)


test('Should SignUp a User', async () => {
    const response = await request(app).post('/signup').send(userOne).expect(201)
    // console.log(response.body)

    const getNewUser = await pool.query(`SELECT user_id from "user" WHERE user_id = ${response.body.user_id}`)
    expect(getNewUser).not.toBeNull()

    expect(response.body).toMatchObject(userOne)

})

test('Should Login Existing user', async () => {
    const response = await request(app).post('/signin').send({
        email: userTwo.email,
        password: userTwo.password
    }).expect(200)

    let token = await pool.query(`SELECT token from "user" WHERE user_id = ${response.body.user_id}`)
    // console.log(token)
    token = token.rows[0].token
    expect(token).toBe(response.body.token)
})

test('Should not login non Existent user', async () => {
    const response = await request(app).post('/signin').send({
        email: 'aman@abc.com',
        password: 'wrongPassword'
    }).expect(400)

    const users = await pool.query(`SELECT * from "user"`)
    // console.log(users.rows)
})

test('Should return user detail of exisiting user', async () => {
    await request(app).get('/users/me').set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(200)
})

test('Should not get profile of unauthorized user', async () => {
    await request(app).get('/users/me').send().expect(401)
})

test('Should delete current user', async () => {
    const response = await request(app).post('/delete/me').set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send().expect(200)

    let user = await pool.query(`SELECT user_id FROM "user" WHERE user_id = ${response.body.user_id}`)
    // console.log(user)
    expect(user.rowCount).toBe(0)
})

test('Should not delete unAutorized user', async () => {
    await request(app).post('/delete/me').send().expect(401)
})