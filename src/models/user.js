import mongoose from '../config/DBHelper'
import moment from 'dayjs'

const Schema = mongoose.Schema

const UserSchema = new Schema({
  // 避免重复
  // parse：username为空时检索忽略这条数据
  email: { type: String, index: { unique: true }, sparse: true },
  name: { type: String },
  points: { type: Number, default: 100 },
  gender: { type: String, default: '' },
  password: { type: String },
  roles: { type: Array, default: ['user'] },
  avatar: { type: String, default: '/img/header.jpeg' },
  phone: { type: String, match: /^1[3-9](\d{9})$/, default: '' },
  status: { type: String, default: '0' },
  regmark: { type: String, default: '' },
  location: { type: String, default: '' },
  isVip: { type: String, default: '0' },
  count: { type: Number, default: 0 },
  created: { type: Date },
  updated: { type: Date }
})

// 钩子
UserSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

UserSchema.pre('update', function (next) {
  this.updated = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

UserSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Error: Mongoose has a duplicate key'))
  } else {
    next(error)
  }
})

UserSchema.statics = {
  findByID: function (id) {
    // 设置不包含信息password，email，phone
    return this.findOne({ _id: id }, {
      password: 0,
      email: 0,
      phone: 0
    })
  }
}

const UserModel = mongoose.model('users', UserSchema)

export default UserModel
