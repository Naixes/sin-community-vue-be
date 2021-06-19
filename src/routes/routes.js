import combineRoutes from 'koa-combine-routers'

import publicRouter from './modules/publicRouter'
import loginRouter from './modules/loginRouter'
import userRouter from './modules/userRouter'
import adminRouter from './modules/adminRouter'
import commentsRouter from './modules/commentsRouter'
import contentRouter from './modules/contentRouter'

export default combineRoutes(adminRouter, commentsRouter, contentRouter, publicRouter, loginRouter, userRouter)

// 优化路由
// 返回空数组？？？
// const moduleFiles = require.context('./modules', true, /\.js$/)

// const modules = moduleFiles.keys().reduce((items, path) => {
//   const value = moduleFiles(path)
//   items.push(value.default)
//   return items
// }, [])

// export default combineRoutes(modules)
