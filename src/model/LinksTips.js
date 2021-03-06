import mongoose from '../config/DBHelper'
import moment from 'dayjs'

const Schema = mongoose.Schema

const LinksTipsSchema = new Schema({
  title: { type: String },
  link: { type: String },
  isTop: { type: String },
  sort: { type: String },
  created: { type: Date }
})

// 钩子
LinksTipsSchema.pre('save', function (next) {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
  next()
})

const LinksModel = mongoose.model('links', LinksTipsSchema)
const TipsModel = mongoose.model('tips', LinksTipsSchema)

export {
  LinksModel,
  TipsModel
}
