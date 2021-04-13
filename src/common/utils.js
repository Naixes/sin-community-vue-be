import { getValue } from "../config/RedisConfig"

const checkCaptcha = async (sid, captcha) => {
    const redisCaptcha = await getValue(sid)
    console.log('redisCaptcha', redisCaptcha);
    console.log('captcha', captcha);
    if(redisCaptcha != null) {
        if(redisCaptcha.toLowerCase() === captcha.toLowerCase()) {
            return true
        }else {
            return false
        }
    }else {
        return false
    }
}

export {
    checkCaptcha
}