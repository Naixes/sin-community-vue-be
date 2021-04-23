import jwt from 'jsonwebtoken'

import { getValue } from '../config/RedisConfig'
import config from '../config/index'

const getJWTPayload = token => {
  return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}

const checkCaptcha = async (sid, captcha) => {
  const redisCaptcha = await getValue(sid)
  console.log('redisCaptcha', redisCaptcha)
  console.log('captcha', captcha)
  if (redisCaptcha != null) {
    if (redisCaptcha.toLowerCase() === captcha.toLowerCase()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

export {
  checkCaptcha,
  getJWTPayload
}
