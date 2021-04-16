import moment from 'dayjs'
import mongoose from '../config/DBHelper'

const Schema = mongoose.Schema

const PostSchema = new Schema({
  // 链接到用户
  uid: { type: String, ref: 'users' },
  title: { type: String },
  content: { type: String },
  created: { type: Date },
  catalog: { type: String },
  points: { type: Number },
  isEnd: { type: String },
  reads: { type: Number },
  answers: { type: Number },
  status: { type: String },
  isTop: { type: String },
  sort: { type: String },
  tags: { type: Array }
})

PostSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

PostSchema.statics = {
  /**
     * 获取文章列表
     * @param {Object} options 筛选条件
     * @param {String} sort 排序
     * @param {Number} page 分页页数
     * @param {Number} limit 分页条数
     */
  getList: function (options, sort, page, limit) {
    return this.find(options)
      .sort({ [sort]: -1 })
      .skip(page * limit)
      .limit(limit)
      // 联合查询
      .populate({
        path: 'uid',
        select: 'email, isVip, avatar'
      })
  }
}

const PostModel = mongoose.model('post', PostSchema)

export default PostModel
