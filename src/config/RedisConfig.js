import redis from 'redis'
import {REDIS} from './index'

const options = {
    host: REDIS.host,
    port: REDIS.port,
    password: REDIS.password,
    // If set to true, then replies will be sent to callbacks as Buffers. 
    detect_buffers: true,
    retry_strategy: function(options) {
        if (options.error && options.error.code === "ECONNREFUSED") {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            return new Error("The server refused the connection");
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            return new Error("Retry time exhausted");
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    },
}

const client = redis.createClient(options)

const setValue = (key, value) => {
    if(typeof value === 'undefined' || value == null || value === '') {
        return
    }
    if(typeof value === 'string') {
        client.set(key, value)
    }else if(typeof value === 'object') {
        Object.keys(value).forEach(item => {
            client.hset(key, item, value[item], redis.print)
        })
    }
}

const { promisify } = require("util");
const getAsync = promisify(client.get).bind(client);
const getValue = (key) => {
    return getAsync(key)
}

const getHValue = (key) => {
    return promisify(client.hgetall).bind(client)(key)
}

export {
    client,
    setValue,
    getValue,
    getHValue
}
