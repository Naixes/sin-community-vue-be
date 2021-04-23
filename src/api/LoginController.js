import sendEmail from '../config/MailConfig'
import moment from 'dayjs'
import jsonwebtoken from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { JWT_SECRET } from '../config'
import { checkCaptcha } from '../common/utils'
import User from '../models/user'
import SignRecord from '../models/SignRecord'

class LoginController {
  async forget (ctx) {
    const { body } = ctx.request
    console.log('body', body)
    try {
      // TODO：查询用户是否存在
      const result = await sendEmail({
        code: '1234',
        expire: moment().add(30, 'm').format('YYYY-MM-DD HH:mm:ss'),
        email: body.email,
        user: 'naixes'
      })
      ctx.body = {
        code: 200,
        data: result,
        msg: '邮件发送成功'
      }
    } catch (error) {
      console.log(error)
    }
  }

  async login (ctx) {
    // 接收数据
    const { body } = ctx.request
    const { sid, captcha, email, password } = body
    // 验证验证码时效性正确性
    let checkCaptchaResult = await checkCaptcha(sid, captcha)
    checkCaptchaResult = true
    if (checkCaptchaResult) {
      // 验证用户账号密码
      let checkUserPass = false
      // 查mongoDB库
      const user = await User.findOne({ email })
      console.log(user)
      if (user && (await bcrypt.compare(password, user.password))) {
        checkUserPass = true
      }
      if (checkUserPass) {
        const userObj = user.toJSON()
        // 过滤字段
        const arr = ['password', 'roles']
        arr.map(v => delete userObj[v])
        // 生成token
        const token = jsonwebtoken.sign({ _id: userObj._id }, JWT_SECRET, {
          // 60 * 60 单位是秒
          // 1h
          expiresIn: '1d'
        })
        // 添加isSign属性
        const signRecord = await SignRecord.findByUid(userObj._id)
        // 签到过
        if (signRecord !== null) {
          // 今天已签到
          if (moment(signRecord.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
            userObj.isSign = true
            // 今天未签到
          } else {
            userObj.isSign = false
          }
          // 未签到
        } else {
          userObj.isSign = false
        }
        // 返回token和用户信息
        ctx.body = {
          code: 200,
          data: userObj,
          token
        }
      } else {
        ctx.body = {
          code: 401,
          msg: '用户名或者密码错误，请重试！'
        }
      }
    } else {
      ctx.body = {
        code: 402,
        msg: '验证码校验失败，请重试！'
      }
    }
  }

  async reg (ctx) {
    // 获取数据
    const { body } = ctx.request
    let { email, name, password, captcha, sid } = body
    const msg = {}
    // 验证验证码时效性正确性
    const checkCaptchaResult = await checkCaptcha(sid, captcha)
    let checkUser = true
    if (checkCaptchaResult) {
      // 昵称用户名查重
      const _nameUser = await User.findOne({ name })
      if (_nameUser && _nameUser.name) {
        msg.name = ['此昵称已经被注册，请重新输入']
        checkUser = false
      }
      const _emailUser = await User.findOne({ email })
      if (_emailUser && _emailUser.email) {
        msg.email = ['此邮箱已经被注册，可以通过邮箱找回密码']
        checkUser = false
      }
      // 保存到数据库
      if (checkUser) {
        password = await bcrypt.hash(password, 5)
        const user = new User({
          email,
          name,
          password,
          created: moment().format('YYYY-MM-DD HH:mm:ss')
        })
        const result = await user.save()
        ctx.body = {
          code: 200,
          data: result,
          msg: '注册成功'
        }
      }
    } else {
      msg.captcha = ['验证码校验失败，请重试！']
    }
    ctx.body = {
      code: 500,
      msg
    }
  }
}

export default new LoginController()
