import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'

import { getValue } from '../config/RedisConfig'
import config from '../config/index'

const rename = (obj, key, newKey) => {
  if (Object.keys(obj).indexOf(key) === -1) {
    obj[newKey] = obj[key]
    delete obj[key]
  }
  return obj
}

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

// 文件系统
// 也可以使用库：make-dir
const getStates = (path) => {
  return new Promise(resolve => {
    fs.stat(path, (err, states) => err ? resolve(false) : resolve(states))
  })
}

const mkdir = (dir) => {
  return new Promise(resolve => {
    fs.mkdir(dir, (err) => err ? resolve(false) : resolve(true))
  })
}

const dirExists = async (dir) => {
  const isExists = await getStates(dir)
  // 路径存在
  if (isExists) {
    // 是文件夹
    if (isExists.isDirectory()) {
      return true
      // 是文件
    } else {
      return false
    }
    // 路径不存在，创建文件路径，循环遍历
  }
  // 循环判断上级目录，存在就开始新建当前目录
  const parentDir = path.parse(dir).dir
  const parentExists = await dirExists(parentDir)
  if (parentExists) {
    const result = await mkdir(dir)
    return result
  } else {
    return false
  }
}

export {
  checkCaptcha,
  getJWTPayload,
  dirExists,
  rename
}
