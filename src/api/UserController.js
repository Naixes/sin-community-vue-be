import moment from 'dayjs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { getJWTPayload } from '../common/Utils'
import SignRecord from '../model/SignRecord'
import User from '../model/user'
import Comments from '../model/Comments'
import sendEmail from '../config/MailConfig'
import { v4 as uuidv4 } from 'uuid'
import { getValue, setValue } from '../config/RedisConfig'
import { JWT_SECRET } from '../config'
import UserCollect from '../model/UserCollect'

class UserController {
  // 设置已读消息
  async setMsg (ctx) {
    const params = ctx.query
    if (params.id) {
      // 设置一条
      const result = await Comments.updateOne(
        { _id: params.id },
        { isRead: '1' }
      )
      if (result.ok === 1) {
        ctx.body = {
          code: 200
        }
      }
    } else {
      // 清空
      const obj = await getJWTPayload(ctx.header.authorization)
      const result = await Comments.updateMany(
        { uid: obj._id },
        { isRead: '1' }
      )
      if (result.ok === 1) {
        ctx.body = {
          code: 200
        }
      }
    }
  }

  async getmsg (ctx) {
    const params = ctx.query
    const page = params.page ? params.page : 0
    const limit = params.limit ? parseInt(params.limit) : 0
    // 方法一：联合查询，复杂
    // 方法二：冗余换时间
    const userObj = await getJWTPayload(ctx.header.authorization)
    const num = await Comments.getTotal(userObj._id)
    const result = await Comments.getMsgList(userObj._id, page, limit)

    ctx.body = {
      code: 200,
      data: result,
      total: num
    }
  }

  async getBasicInfo (ctx) {
    const { uid } = ctx.query
    let user = await User.findById(uid)
    // 查询签到记录
    user = user.toJSON()
    const result = await SignRecord.findOne({
      uid,
      created: {
        $gte: moment().format('YYYY-MM-DD' + ' 00:00:00')
      }
    })
    user.isSign = !!result.uid
    ctx.body = {
      code: 200,
      data: user,
      msg: '查询成功'
    }
  }

  // 收藏
  async setCollect (ctx) {
    const params = ctx.query
    // 判断是否已经收藏
    const userObj = await getJWTPayload(ctx.header.authorization)
    // 已经收藏，取消收藏
    if (parseInt(params.isFav)) {
      await UserCollect.deleteOne({ uid: userObj._id, tid: params.tid })
      ctx.body = {
        code: 200,
        msg: '取消收藏成功'
      }
    } else {
      const newCollect = new UserCollect({
        uid: userObj._id,
        tid: params.tid,
        title: params.title
      })
      const result = await newCollect.save()
      if (result.uid) {
        ctx.body = {
          code: 200,
          msg: '收藏成功',
          data: result
        }
      }
    }
  }

  async getCollect (ctx) {

  }

  // 修改密码
  async changePasswd (ctx) {
    const { body } = ctx.request
    const userObj = await getJWTPayload(ctx.header.authorization)
    const userInfo = await User.find({ _id: userObj._id })
    if (bcrypt.compare(body.oldpwd, userInfo.password)) {
      const newpasswd = bcrypt.hash(body.newpasswd, 5)
      await User.updateOne({ _id: userObj._id }, {
        $set: {
          password: newpasswd
        }
      })
      ctx.body = {
        code: 200,
        msg: '密码更新成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '密码更新失败'
      }
    }
  }

  // 签到
  async userSign (ctx) {
    let result = {}
    let newRecord = {}
    // 获取用户ID
    const userObj = await getJWTPayload(ctx.header.authorization)
    console.log(userObj)
    // 查询签到记录
    const record = await SignRecord.findByUid(userObj._id)
    // 查询用户信息
    const userInfo = await User.findById(userObj._id)
    // 判断签到逻辑
    // 有历史签到
    if (record !== null) {
      // 今天已经签到
      if (moment(record.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          data: {
            points: userInfo.points,
            count: userInfo.count,
            lastSign: record.created
          },
          msg: '今天已经签到过了'
        }
        return
        // 今天未签到
      } else {
        let count = userInfo.count
        let points = 0
        // 连续签到
        if (moment(record.created).format('YYYY-MM-DD') === moment().subtract(1, 'day').format('YYYY-MM-DD')) {
          count += 1
          if (count < 5) {
            points = 5
          } else if (count >= 5 && count < 15) {
            points = 10
          } else if (count >= 15 && count < 30) {
            points = 15
          } else if (count >= 30 && count < 100) {
            points = 20
          } else if (count >= 100 && count < 365) {
            points = 30
          } else if (count >= 365) {
            points = 50
          }
          // 更新user
          await User.updateOne({ _id: userObj._id }, {
            $inc: { points, count: 1 }
          })
          result = {
            points: userInfo.points + points,
            count
          }
          // 非连续签到
        } else {
          points = 5
          // 更新user
          await User.updateOne({ _id: userObj._id }, {
            $set: { count: 1 },
            $inc: { points }
          })
          result = {
            points: userInfo.points + points,
            // 初始化连续签到天数
            count: 1
          }
        }
        // 保存签到记录
        newRecord = new SignRecord({
          uid: userObj._id,
          points,
          lastSign: record.created
        })
        await newRecord.save()
      }
    } else {
      // 无签到记录，保存当前签到记录
      // 更新user
      await User.updateOne({ _id: userObj._id }, {
        $set: { count: 1 },
        $inc: { points: 5 }

      })
      // 保存签到记录
      newRecord = new SignRecord({
        uid: userObj._id,
        points: 5,
        // 第一次的上一次就是本次
        lastSign: moment().format('YYYY-MM-DD HH:mm:ss')
      })
      await newRecord.save()
      result = {
        points: userInfo.points + 5,
        count: 1
      }
    }
    ctx.body = {
      code: 200,
      data: {
        ...result,
        lastSign: newRecord.created
      },
      msg: '请求成功'
    }
  }

  // 更新用户基本信息
  async updateUserBasic (ctx) {
    const { body } = ctx.request
    let msg = ''
    const userObj = await getJWTPayload(ctx.header.authorization)
    // 判断用户是否修改了邮箱
    const userInfo = await User.findOne({ _id: userObj._id })

    // 用户修改了邮箱
    if (body.email && body.email !== userInfo.email) {
      // 判断邮件是否存在
      const tmpUser = await User.findOne({ email: body.email })
      // 邮箱已存在
      if (tmpUser && tmpUser.password) {
        ctx.body = {
          code: 501,
          msg: '邮箱已存在'
        }
        return
      }
      // 发送邮件
      const key = uuidv4()
      setValue(key, jwt.sign({ _id: userObj._id }, JWT_SECRET, {
        expiresIn: '30m'
      }))
      await sendEmail({
        type: 'email',
        data: {
          key,
          email: body.email
        },
        code: '',
        expire: moment().add(30, 'm').format('YYYY-MM-DD HH:mm:ss'),
        email: userInfo.email,
        user: userInfo.name
      })
      msg = '邮件已发送，请点击连接确认修改邮箱账号'
    }
    // 更新基本信息
    // 删除不能直接修改的字段
    const arr = ['email', 'password', 'phone']
    arr.map(k => delete body[k])
    const result = await User.updateOne({ _id: userObj._id }, body)
    if (result.n === 1 && result.ok === 1) {
      ctx.body = {
        code: 200,
        msg: '基本信息更新成功 ' + msg
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新失败'
      }
    }
  }

  async updateEmail (ctx) {
    const body = ctx.query
    if (body.key) {
      const token = await getValue(body.key)
      const payload = getJWTPayload('Bear' + token)
      await User.updateOne({ _id: payload._id }, {
        email: body.email
      })
      ctx.body = {
        code: 200,
        msg: '更新邮箱成功'
      }
    }
  }

  // 获取用户列表
  async getUsers (ctx) {
    let params = ctx.query
    params = qs.parse(params)
    const page = params.page ? params.page : 0
    const limit = params.limit ? parseInt(params.limit) : 0
    const sort = params.sort || 'created'
    const option = params.option || {}
    const result = await User.getList(option, sort, page, limit)
    const total = await User.countList(option)
    ctx.body = {
      code: 200,
      data: result,
      total: total
    }
  }

  // 管理员删除用户
  async deleteUserById (ctx) {
    const { body } = ctx.request
    // const user = await User.findOne({ _id: params.id })
    // if (user) {
    const result = await User.deleteMany({ _id: { $in: body.ids } })
    ctx.body = {
      code: 200,
      msg: '删除成功',
      data: result
    }
    // } else {
    //   ctx.body = {
    //     code: 500,
    //     msg: '用户不存在或者id信息错误！'
    //   }
    // }
  }

  // 管理员更新用户
  async updateUserById (ctx) {
    const { body } = ctx.request

    const user = await User.findOne({ _id: body._id })
    // 1.校验用户是否存在 -> 用户名是否冲突
    if (!user) {
      ctx.body = {
        code: 500,
        msg: '用户不存在或者id信息错误！'
      }
      return
    }
    // if (body.username !== user.username) {
    //   const userCheckName = await User.findOne({ username: body.username })
    //   if (userCheckName) {
    //     ctx.body = {
    //       code: 501,
    //       msg: '用户名已经存在，更新失败！'
    //     }
    //     return
    //   }
    // }

    // 2.判断密码是否传递 -> 进行加密保存
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 5)
    }
    const result = await User.updateOne({ _id: body._id }, body)
    if (result.ok === 1 && result.nModified === 1) {
      ctx.body = {
        code: 200,
        msg: '更新成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '服务异常，更新失败'
      }
    }
  }

  // 批量设置用户属性
  // 方法一：新增一个接口 方法二： options -> action 'one' 'many'
  async updateUserBatch (ctx) {
    const { body } = ctx.request
    const result = await User.updateMany(
      { _id: { $in: body.ids } },
      { $set: { ...body.settings } }
    )
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async checkUsername (ctx) {
    const params = ctx.query
    const user = await User.findOne({ username: params.username })
    // 默认是 1 - 校验通过， 0 - 校验失败
    let result = 1
    if (user && user.username) {
      result = 0
    }
    ctx.body = {
      code: 200,
      data: result,
      msg: '用户名已经存在，更新失败！'
    }
  }

  async addUser (ctx) {
    const { body } = ctx.request
    body.password = await bcrypt.hash(body.password, 5)
    const user = new User(body)
    const result = await user.save()
    const userObj = result.toJSON()
    const arr = ['password']
    arr.map(item => {
      delete userObj[item]
    })
    if (result) {
      ctx.body = {
        code: 200,
        data: userObj,
        msg: '添加用户成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '服务接口异常'
      }
    }
  }
}

export default new UserController()
