import Router from 'koa-router'
import publicController from '../../api/PublicController'
import contentController from '../../api/ContentController'
import userController from '../../api/UserController'

const router = new Router()

router.prefix('/public')
router.get('/getCaptcha', publicController.getCaptcha)
router.get('/postList', contentController.getPostList)
router.get('/getLinks', contentController.getLinks)
router.get('/getTips', contentController.getTips)
router.get('/getTopWeek', contentController.getTopWeek)
router.get('/updateEmail', userController.updateEmail)

export default router
