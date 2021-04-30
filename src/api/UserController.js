import moment from 'dayjs'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { getJWTPayload } from '../common/utils'
import SignRecord from '../models/SignRecord'
import User from '../models/user'
import sendEmail from '../config/MailConfig'
import { v4 as uuidv4 } from 'uuid'
import { getValue, setValue } from '../config/RedisConfig'
import { JWT_SECRET } from '../config'
import UserCollect from '../models/UserCollect'

class UserController {
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
}

export default new UserController()
