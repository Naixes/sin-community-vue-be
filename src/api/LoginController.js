import sendEmail from "../config/MailConfig";
import moment from "moment";
import jsonwebtoken from 'jsonwebtoken'
import {JWT_SECRET} from "../config";
import {checkCaptcha} from '../common/utils'
import User from "../models/user";

class LoginController {
  constructor() {}
  async forget(ctx) {
    const { body } = ctx.request;
    console.log("body", body);
    try {
      // TODO：查询用户是否存在
      let result = await sendEmail({
        code: "1234",
        expire: moment().add(30, "m").format("YYYY-MM-DD HH:mm:ss"),
        email: body.email,
        user: "naixes",
      });
      ctx.body = {
        code: 200,
        data: result,
        msg: "邮件发送成功",
      };
    } catch (error) {
      console.log(error);
    }
  }

  async login(ctx) {
    // 接收数据
    const {body} = ctx.request
    const {sid, captcha, username, password} = body
    // 验证验证码时效性正确性
    const checkCaptchaResult = await checkCaptcha(sid, captcha)
    if(checkCaptchaResult) {
      // 验证用户账号密码
      let checkUserPass = false
      // 查mongoDB库
      const user = await User.findOne({username})
      console.log(user);
      if(user && user.password === password) {
        checkUserPass = true
      }
      if(checkUserPass) {
        // 返回token
        let token = jsonwebtoken.sign({_id: 'naixes'}, JWT_SECRET, {
          // 60 * 60 单位是秒
          // 1h
          expiresIn: '1d'
        })
        ctx.body = {
          code: 200,
          token
        }
      }else {
        ctx.body = {
          code: 404,
          msg: '用户名或者密码错误，请重试！'
        }
      }
    }else {
      ctx.body = {
        code: 401,
        msg: '验证码校验失败，请重试！'
      }
    }
  }
}

export default new LoginController();
