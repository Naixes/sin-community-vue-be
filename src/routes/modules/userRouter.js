import Router from 'koa-router'
import contentController from '../../api/ContentController'
import userController from '../../api/UserController'

const router = new Router()

router.prefix('/user')
router.get('/sign', userController.userSign)
router.get('/updateUserBasic', userController.updateUserBasic)
router.get('/updateEmail', userController.updateEmail)
router.get('/changePasswd', userController.changePasswd)
router.get('/setCollect', userController.setCollect)
router.get('/collect', userController.getCollect)
router.get('/post', contentController.getPostByUid)
router.get('/deletePost', contentController.deletePostByUid)
// 获取历史消息
router.get('/getmsg', userController.getmsg)
router.get('/setmsg', userController.setMsg)

export default router
