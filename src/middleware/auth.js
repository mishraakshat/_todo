const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
    try{
        const token = req.header('Authorization').replace('Bearer ', '')
        const decode = jwt.verify(token, 'todoUser')
        req.body.user_id = decode.user_id
        next()
    }
    catch(e)
    {
        res.ststus(401).send({error : 'No Authentication'})
    }
}

module.exports = auth