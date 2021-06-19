import Router from 'koa-router'
import publicController from '../../api/PublicController'
import contentController from '../../api/ContentController'
import userController from '../../api/UserController'
import commentsController from '../../api/CommentsController'

const router = new Router()

router.prefix('/public')
router.get('/getCaptcha', publicController.getCaptcha)
router.get('/postList', contentController.getPostList)
router.get('/getLinks', contentController.getLinks)
router.get('/getTips', contentController.getTips)
router.get('/getTopWeek', contentController.getTopWeek)
router.get('/updateEmail', userController.updateEmail)
router.get('/content/detail', contentController.getPostDetail)
router.get('/comments', commentsController.getComments)
router.get('/info', userController.getBasicInfo)
// 获取用户最近的发贴记录
router.get('/latestPost', contentController.getPostPublic)
// 获取用户最近的评论记录
router.get('/latestComment', commentsController.getCommentPublic)
// 获取用热门帖子
router.get('/hotPost', publicController.getHotPost)
// 获取用热门评论
router.get('/hotComments', publicController.getHotComments)
// 获取用签到排行
router.get('/hotSignRecord', publicController.getHotSignRecord)

export default router
