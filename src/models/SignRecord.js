import moment from 'dayjs'
import mongoose from '../config/DBHelper'

const Schema = mongoose.Schema

const SignRecordSchema = new Schema({
  uid: { type: String, refs: 'users' },
  points: { type: Number },
  lastSign: { type: Date },
  created: { type: Date }
})

SignRecordSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

SignRecordSchema.static = {
  findByUid (uid) {
    // 返回第一条匹配到的数据
    return this.findOne({ uid }).sort({ created: -1 })
  }
}

const SignRecordModel = mongoose.model('sign_record', SignRecordSchema)

export default SignRecordModel
