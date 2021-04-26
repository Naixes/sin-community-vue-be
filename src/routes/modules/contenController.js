import Router from 'koa-router'
import contenController from '../../api/ContentController'

const router = new Router()

router.prefix('/content')
router.get('/getCaptcha', contenController.updateImg)

export default router
