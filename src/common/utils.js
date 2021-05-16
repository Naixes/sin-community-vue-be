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
const sortObj = (arr, property) => {
  return arr.sort((m, n) => m[property] - n[property])
}

const sortMenus = (tree) => {
  tree = sortObj(tree, 'sort')
  if (tree.children && tree.children.length > 0) {
    tree.children = sortMenus(tree.children, 'sort')
  }
  if (tree.operations && tree.operations.length > 0) {
    tree.operations = sortMenus(tree.operations, 'sort')
  }
  return tree
}

const getMenuData = (tree, rights, flag) => {
  const arr = []
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    // _id 包含在menus中
    // 结构进行改造，删除opertaions
    if (rights.includes(item._id + '') || flag) {
      if (item.type === 'menu') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta: {
            title: item.title,
            hideInBread: item.hideInBread,
            hideInMenu: item.hideInMenu,
            notCache: item.notCache,
            icon: item.icon
          },
          component: item.component,
          children: getMenuData(item.children, rights)
        })
      } else if (item.type === 'link') {
        arr.push({
          _id: item._id,
          path: item.path,
          meta: {
            title: item.title,
            icon: item.icon,
            href: item.link
          }
        })
      }
    }
  }

  return sortObj(arr, 'sort')
}

const flatten = (arr) => {
  while (arr.some((item) => Array.isArray(item))) {
    arr = [].concat(...arr)
  }
  return arr
}

const getRights = (tree, menus) => {
  const arr = []
  for (const item of tree) {
    if (item.operations && item.operations.length > 0) {
      for (const op of item.operations) {
        if (menus.includes(op._id + '')) {
          arr.push(op.path)
        }
      }
    } else if (item.children && item.children.length > 0) {
      arr.push(getRights(item.children, menus))
    }
  }
  return flatten(arr)
}

export {
  checkCaptcha,
  getJWTPayload,
  dirExists,
  rename,
  getMenuData,
  sortMenus,
  flatten,
  getRights
}
