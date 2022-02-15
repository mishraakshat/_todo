// const generateToken = require('../../src/utils/genToken')
const jwt = require('jsonwebtoken')
const pool = require('../../src/db/db')
const trimLowerElement = require('../../src/utils/utils')
const request = require('supertest')
const app = require('../../src/app')
// const generateToken = require('../../src/utils/genToken')

// console.log(await generateToken(100))

const userOne = {
    name:'AKSHAT',
    password:'123456',
    email: 'akshat@abc.com'
}

const userTwo = {
    user_id:100,
    name: 'AMAN',
    password: '123467',
    email: 'aman@abc.com',
    token: jwt.sign({user_id: 100}, process.env.JWT_SECRET)
}

const userThree = {
    user_id:101,
    name: 'AMIT',
    password: '123467',
    email: 'amit@abc.com',
    token: jwt.sign({user_id: 101}, process.env.JWT_SECRET)
}

const todoTwo = {
    todo_id:0,
    description:'todoOne',
    _group:'ONE',
    user_id: userTwo.user_id
}

const todoThree = {
    todo_id:1,
    description:'todoTwo',
    _group:'Two',
    user_id:userThree.user_id
}

const setupDatabase = async () => {
    // console.log(userTwo.token)
    await pool.query('TRUNCATE TABLE "user", todo')

    // USER TWO
    let keys = trimLowerElement(Object.keys(userTwo)).join(',')
    let values = trimLowerElement(Object.values(userTwo)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
    let QUERY = `INSERT INTO "user" (${keys}) VALUES (${values}) RETURNING user_id`
    await pool.query(QUERY)

    // USER THREE
    keys = trimLowerElement(Object.keys(userThree)).join(',')
    values = trimLowerElement(Object.values(userThree)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
    QUERY = `INSERT INTO "user" (${keys}) VALUES (${values}) RETURNING user_id`
    await pool.query(QUERY)

    // TASK TWO
    // keys = trimLowerElement(Object.keys(todoTwo)).join(',')
    // values = trimLowerElement(Object.values(todoTwo)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
    // QUERY = `INSERT INTO todo (${keys}) VALUES (${values}) RETURNING user_id`
    // await pool.query(QUERY)
    await request(app).post('/todos').set({
        'Authorization': `Bearer ${userTwo.token}`
    }).send(todoTwo)

    // TASK THREE
    // keys = trimLowerElement(Object.keys(todoThree)).join(',')
    // values = trimLowerElement(Object.values(todoThree)).map(x => (typeof x == 'string') ? `'${x}'` : x).join(',')
    // QUERY = `INSERT INTO todo (${keys}) VALUES (${values}) RETURNING user_id`
    // await pool.query(QUERY)
    await request(app).post('/todos').set({
        'Authorization': `Bearer ${userThree.token}`
    }).send(todoThree)


}

module.exports = {
    userOne, userTwo, userThree, todoThree, todoTwo, setupDatabase
}