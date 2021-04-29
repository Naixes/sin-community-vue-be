import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import moment from 'dayjs'

import Post from '../models/Post'
import { LinksModel, TipsModel } from '../models/LinksTips'
import { uploadPath } from '../config'
import { checkCaptcha, dirExists, getJWTPayload } from '../common/utils'
import User from '../models/user'

class ContentController {
  // 帖子详情
  async getPostDetail (ctx) {
    const params = ctx.query
    if (!params.tid) {
      ctx.body = {
        code: 500,
        msg: '文章标题为空'
      }
      return
    }
    const postDetail = await Post.findByTid(params.tid)
    // 重命名
    // const result = rename(postDetail.toJSON(), 'uid', 'user')
    // 更新阅读量
    const result = await Post.updateOne({ _id: params.tid }, {
      $inc: {
        reads: 1
      }
    })
    if (postDetail._id && result.ok === 1) {
      ctx.body = {
        code: 200,
        data: postDetail,
        msg: '获取文章详情成功'
      }
    } else {
      ctx.body = {
        code: 500,
        data: result,
        msg: '获取文章详情失败'
      }
    }
  }

  // 发帖
  async addPost (ctx) {
    // 接收数据
    const { body } = ctx.request
    const { sid, captcha, points } = body
    // 验证验证码时效性正确性
    let checkCaptchaResult = await checkCaptcha(sid, captcha)
    checkCaptchaResult = true
    if (checkCaptchaResult) {
      // 判断用户积分是否足够
      const userObj = await getJWTPayload(ctx.header.authorization)
      const userInfo = await User.findById(userObj._id)
      if (userInfo.points < points) {
        ctx.body = {
          code: 501,
          msg: '积分不足'
        }
        return
      } else {
        // 减除积分
        await User.updateOne({ _id: userObj._id }, {
          $inc: {
            points: -points
          }
        })
      }
      // 新建post
      const newPost = new Post(body)
      newPost.uid = userObj._id
      const result = await newPost.save()
      ctx.body = {
        code: 200,
        msg: '发表成功',
        data: result
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '验证码校验失败，请重试！'
      }
    }
  }

  async getLinks (ctx) {
    const result = await LinksModel.find()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTips (ctx) {
    const result = await TipsModel.find()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getTopWeek (ctx) {
    const result = await Post.getTopWeek()
    ctx.body = {
      code: 200,
      data: result
    }
  }

  async getPostList (ctx) {
    const { query } = ctx.request
    console.log('query', query)
    const options = {}

    // 测试数据
    // const post = new Post({
    //   title: 'title',
    //   content: 'content',
    //   catalog: 'ask',
    //   points: 20,
    //   isEnd: '0',
    //   reads: '20',
    //   answers: '20',
    //   status: '0',
    //   isTop: '0',
    //   sort: '0',
    //   tags: [
    //     {
    //       name: '',
    //       class: ''
    //     }
    //   ]
    // })
    // const tmp = await post.save()
    // console.log('tmp', tmp)

    const sort = query.sort ? query.sort : 'created'
    const page = query.page ? parseInt(query.page) : 0
    const limit = query.limit ? parseInt(query.limit) : 20

    if (typeof query.catalog !== 'undefined' && query.catalog !== '') {
      options.catalog = query.catalog
    }
    if (typeof query.isTop !== 'undefined') {
      options.isTop = query.isTop
    }
    if (typeof query.status !== 'undefined' && query.status !== '') {
      options.isEnd = query.status
    }
    if (typeof query.tag !== 'undefined' && query.tag !== '') {
      options.tags = {
        $elemMatch: { name: query.tag }
      }
    }

    const result = await Post.getList(options, sort, page, limit)

    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }

  async updateImg (ctx) {
    const file = ctx.request.files.file
    const ext = file.name.split('.').pop()
    const filename = moment().format('YYYYMMDD')
    // 使用时间区分文件夹
    const dir = `${uploadPath}/${filename}`
    // 判断路径是否存在
    await dirExists(dir)
    // make-dir库
    // await mkdir(dir)
    // 存储文件到指定路径，唯一的文件名称
    const pickname = uuidv4()
    const outputPath = `${dir}/${pickname}.${ext}`
    const dataPath = `/${filename}/${pickname}.${ext}`

    const readStream = fs.createReadStream(file.path, {
      // 一次读取的大小
      // highWaterMark: 1 * 1024
    })
    const writeStream = fs.createWriteStream(outputPath)
    // 方法一：
    // readStream.pipe(writeStream)

    const state = fs.statSync(file.path)
    console.log(state)

    // 方法二，大的文件，监听上传进度
    let totalLength = 0
    // 默认64kb
    readStream.on('data', (chunk) => {
      totalLength += chunk.length
      console.log(totalLength)
      if (writeStream.write(chunk) === false) {
        readStream.pause()
      }
    })
    readStream.on('drain', () => {
      readStream.resume()
    })
    readStream.on('end', () => {
      readStream.end()
    })

    ctx.body = {
      code: 200,
      msg: '图片上传成功',
      data: dataPath
    }
  }
}

export default new ContentController()
