import Koa from 'koa'
import path from 'path'
import helmet from 'koa-helmet'
import statics from 'koa-static'
import router from './routes/routes'
import koaBody from 'koa-body'
import jsonutil from 'koa-json'
import cors from '@koa/cors'
import JWT from 'koa-jwt'
import compose from 'koa-compose'
import compress from 'koa-compress'

import errHandle from './common/errHandle'
import WebSocketServer from './config/WebSocket'
import auth from './common/Auth'
import config from '@/config/index'
import log4js from '@/config/log4js'
import monitorLogger from '@/common/Logger'

const app = new Koa()
const ws = new WebSocketServer()

ws.init()
global.ws = ws

const isDevMode = process.env.NODE_ENV !== 'production'

const jwt = JWT({ secret: config.JWT_SECRET }).unless({ path: [/^\/public/, /\/login/] })

/**
 * 使用koa-compose 集成中间件
 */
const middleware = compose([
  monitorLogger,
  koaBody({
    // 配置文件上传
    multipart: true,
    formidable: {
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024
    },
    onError: (err) => {
      console.log('koa-body err', err)
    }
  }),
  statics(path.join(__dirname, '../public')),
  cors(),
  jsonutil({ pretty: false, param: 'pretty' }),
  helmet(),
  jwt,
  auth,
  errHandle,
  config.isDevMode
    ? log4js.koaLogger(log4js.getLogger('http'), {
      level: 'auto'
    })
    : log4js.koaLogger(log4js.getLogger('access'), {
      level: 'auto'
    })
])

if (!isDevMode) {
  app.use(compress())
}

const port = isDevMode ? 3000 : 12005

app.use(middleware)
app.use(router())

app.listen(port, () => {
  console.log(`server is running at ${port}`)
})
