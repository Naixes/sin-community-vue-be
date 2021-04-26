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

import { JWT_SECRET } from './config'
import errHandle from './common/errHandle'

const app = new Koa()

const isDevMode = process.env.NODE_ENV !== 'production'

const jwt = JWT({ secret: JWT_SECRET }).unless({ path: [/^\/public/, /\/login/] })

/**
 * 使用koa-compose 集成中间件
 */
const middleware = compose([
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
  errHandle,
  jwt
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
