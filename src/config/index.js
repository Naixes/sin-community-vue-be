import path from 'path'

const REDIS = {
  host: '172.16.108.250',
  port: 15001,
  password: 'redispass'
}

// mongodb://account:password@192.168.1.7:27017/communitydb
const DB_URL = 'mongodb://naixes:mongopass@172.16.108.250:27017/communitydb'

// 尽量长，复杂，可以使用工具生成
const JWT_SECRET = 'naixes'

const baseUrl = process.env.NODE_ENV === 'product' ? '' : 'http://localhost:3000'

const uploadPath = process.env.NODE_ENV === 'product' ? '' : path.join(path.resolve(__dirname, '../../public'))

const adminEmail = ['615411375@qq.com']

const publicPath = [/^\/public/, /^\/login/, /^\/content/, /^\/user/, /^\/comments/]

const isDevMode = process.env.NODE_ENV !== 'production'

const port = 3000
const wsPort = 3001

export {
  REDIS,
  DB_URL,
  JWT_SECRET,
  baseUrl,
  uploadPath,
  adminEmail,
  publicPath,
  isDevMode,
  port,
  wsPort
}
