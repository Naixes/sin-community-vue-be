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
  isEnd: { type: String, default: '0' },
  reads: { type: Number, default: 0 },
  answers: { type: Number, default: 0 },
  status: { type: String, default: '0' },
  isTop: { type: String, default: '0' },
  // 倒序
  sort: { type: String, default: '100' },
  tags: { type: Array }
})

PostSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

PostSchema.statics = {
  findByUid: function (uid, page, limit) {
    return this.find({ uid })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  },
  countByUid: function (uid) {
    return this.find({ uid }).countDocuments()
  },
  findByTid: function (tid) {
    return this.findOne({ _id: tid }).populate({
      path: 'uid',
      select: 'name avatar isVip _id'
    })
  },
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
        select: 'name email isVip avatar'
      })
  },
  getTopWeek: function () {
    return this.find({
      created: {
        $gte: moment().subtract(7, 'days')
      }
    }, {
      answers: 1,
      title: 1
    }).sort({ answers: -1 })
      .limit(15)
  }
}

const PostModel = mongoose.model('post', PostSchema)

export default PostModel
