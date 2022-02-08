( async () => {
    redis = require('redis')
        const redis_client = redis.createClient({
        host: '127.0.0.1',
        port: 6379,
        // legacyMode: true
    });
    // await redis_client.connect()
    module.exports = redis_client
  })();


