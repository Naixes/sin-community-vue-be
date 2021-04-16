import svgCaptcha from 'svg-captcha'
import { setValue } from '../config/RedisConfig'

class PublicController {
  async getCaptcha (ctx) {
    const { sid } = ctx.request.query
    const newCaptcha = svgCaptcha.create({
      size: 5,
      ignoreChars: '0o1il',
      color: true,
      noise: Math.floor(Math.random() * 5),
      width: 150,
      height: 38
    })
    // 保存图片验证码，设置过期时间
    setValue(sid, newCaptcha.text, 10 * 60)
    ctx.body = {
      code: 200,
      // newCaptcha.text，验证码内容
      data: newCaptcha.data
    }
  }
}

export default new PublicController()
