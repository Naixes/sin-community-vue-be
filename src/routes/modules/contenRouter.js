import Router from 'koa-router'
import contenController from '../../api/ContentController'

const router = new Router()

router.prefix('/content')
router.get('/uploadImg', contenController.updateImg)
router.get('/add', contenController.addPost)

export default router
