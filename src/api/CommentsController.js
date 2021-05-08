import { checkCaptcha, getJWTPayload } from '../common/utils'
import Comments from '../models/Comments'
import Post from '../models/Post'
import CommentsHands from '../models/CommentsHands'
import User from './UserController'

const canReply = async (ctx) => {
  let result = false
  const userObj = await getJWTPayload(ctx.header.authorization)
  if (typeof userObj === 'undefined' && userObj._id) {
    return result
  } else {
    const userInfo = User.findById(userObj._id)
    if (userInfo.status === '0') {
      result = true
    }
    return result
  }
}

class CommentsController {
  // 点赞
  async setHands (ctx) {
    const { cid } = ctx.query
    let userObj = {}
    if (typeof ctx.header.authorization !== 'undefined') {
      userObj = await getJWTPayload(ctx.header.authorization)
    }
    // 判断是否已经点赞
    const record = await CommentsHands.find({ cid, uid: userObj._id })
    if (record.length > 0) {
      ctx.body = {
        code: 500,
        msg: '已经点过了'
      }
      return
    }
    // 新增点赞记录
    const newHands = new CommentsHands({
      cid,
      uid: userObj._id
    })
    // update才会返回ok，save没有
    await newHands.save()
    // 更新comments对应的hands+1
    const result = await Comments.updateOne({ _id: cid }, {
      $inc: {
        hands: 1
      }
    })
    if (result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '点赞成功',
        data: result
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '点赞记录保存失败'
      }
    }
  }

  // 采纳
  async setBest (ctx) {
    const { tid, cid } = ctx.query
    // 权限判断
    // 登录判断
    const userObj = await getJWTPayload(ctx.header.authorization)
    if (typeof userObj === 'undefined' && userObj._id) {
      ctx.body = {
        code: 401,
        msg: '用户未登录或未授权'
      }
      return
    }
    const post = await Post.findOne({ _id: tid })
    // 判断是否作者
    if (post.uid === userObj._id && post.isEnd === '0') {
      const presult = await Post.updateOne({ _id: tid }, {
        $set: {
          isEnd: '1'
        }
      })
      const cresult = await Comments.findByCid(cid, {
        $set: {
          isBest: '1'
        }
      })
      if (presult.ok === 1 && cresult === 1) {
        // 增加积分
        const comment = await Comments.findByTid(tid)
        const uresult = await User.updateOne({ _id: comment.cuid }, {
          $inc: {
            points: parseInt(post.points)
          }
        })
        if (uresult.ok === 1) {
          ctx.body = {
            code: 200,
            msg: '采纳成功',
            data: uresult
          }
        } else {
          ctx.body = {
            code: 500,
            msg: '积分更新失败'
          }
        }
      } else {
        ctx.body = {
          code: 500,
          msg: '更新失败',
          data: { postResult: presult, commentsResult: cresult }
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '本帖已结贴，不能采纳或者你不是本帖作者'
      }
    }
  }

  // 编辑评论
  async updateComment (ctx) {
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: '用户已被禁言！'
      }
      return
    }
    const { body } = ctx.request
    const result = await Comments.updateOne({ _id: body.cid }, {
      $set: body
    })
    ctx.body = {
      code: 200,
      msg: '更新成功',
      data: result
    }
  }

  // 添加评论
  async addComment (ctx) {
    const check = await canReply(ctx)
    if (!check) {
      ctx.body = {
        code: 500,
        msg: '用户已被禁言！'
      }
      return
    }
    const { body } = ctx.request
    const sid = body.sid
    const captcha = body.captcha
    // 验证图片验证码的时效性、正确性
    const result = await checkCaptcha(sid, captcha)
    if (!result) {
      ctx.body = {
        code: 500,
        msg: '图片验证码不正确,请检查！'
      }
      return
    }
    const newComment = new Comments(body)
    const obj = await getJWTPayload(ctx.header.authorization)
    newComment.cuid = obj._id
    // 查询帖子的作者，以便发送消息
    const post = await Post.findOne({ _id: body.tid })
    newComment.uid = post.uid
    // 发送消息
    const msgNum = await Comments.getTotal(post.uid)
    global.ws.send(post.uid, JSON.stringify({
      type: 'message',
      message: `您有${msgNum}条新评论`
    }))
    const comment = await newComment.save()
    const num = await Comments.getTotal(post.uid)
    global.ws.send(post.uid, JSON.stringify({
      type: 'message',
      message: num
    }))
    // 评论记数
    const updatePostresult = await Post.updateOne({ _id: body.tid }, { $inc: { answers: 1 } })
    if (comment._id && updatePostresult.ok === 1) {
      ctx.body = {
        code: 200,
        data: comment,
        msg: '评论成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '评论失败'
      }
    }
  }

  // 评论列表
  async getComments (ctx) {
    const params = ctx.query
    const tid = params.tid
    const page = params.page ? params.page : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    let data = await Comments.getCommentsList(tid, page, limit)
    // 添加handed字段
    data = data.map(item => item.toJSON())
    // 判断登录
    const userObj = await getJWTPayload(ctx.header.authorization)
    if (typeof userObj._id !== 'undefined') {
      data.forEach(async item => {
        item.handed = '0'
        // 判断是否已经点赞
        const record = await CommentsHands.find({ cid: item._id, uid: userObj._id })
        // 已经点赞
        if (record && record.uid) {
          item.handed = '1'
        }
      })
    }
    const total = await Comments.queryCount(tid)
    ctx.body = {
      code: 200,
      data,
      total,
      msg: '查询成功'
    }
  }
}

export default new CommentsController()
