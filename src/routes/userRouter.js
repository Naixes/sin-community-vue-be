import Router from 'koa-router'
import userController from '../api/UserController'

const router = new Router()

router.prefix('/user')
router.get('/sign', userController.userSign)

export default router
