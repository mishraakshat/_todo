
( async () => {
    const Client_ = require('./redis-cli')
    Client_.connect()
    module.exports = Client_
})()

