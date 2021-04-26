import Router from 'koa-router'
import userController from '../../api/UserController'

const router = new Router()

router.prefix('/user')
router.get('/sign', userController.userSign)
router.get('/updateUserBasic', userController.updateUserBasic)
router.get('/updateEmail', userController.updateEmail)
router.get('/changePasswd', userController.changePasswd)

export default router
