const REDIS = {
  host: '172.16.108.250',
  port: 15001,
  password: 'redispass'
}

// mongodb://account:password@192.168.1.7:27017/communitydb
const DB_URL = 'mongodb://naixes:mongopass@172.16.108.250:27017/communitydb'

// 尽量长，复杂，可以使用工具生成
const JWT_SECRET = 'naixes'

export {
  REDIS,
  DB_URL,
  JWT_SECRET
}
