import Post from '../models/Post'
import { LinksModel, TipsModel } from '../models/LinksTips'

class ContentController {
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

    console.log('options', options)

    const result = await Post.getList(options, sort, page, limit)

    ctx.body = {
      code: 200,
      data: result,
      msg: '获取文章列表成功'
    }
  }
}

export default new ContentController()
