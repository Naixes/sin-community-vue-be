import moment from 'dayjs'

import { getJWTPayload } from '../common/utils'
import SignRecord from '../models/SignRecord'
import User from '../models/user'

class UserController {
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
}

export default new UserController()
