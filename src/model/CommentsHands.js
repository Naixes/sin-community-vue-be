import mongoose from '../config/DBHelper'

const Schema = mongoose.Schema

const commentsSchema = new Schema({
  cid: { type: String, ref: 'comments' },
  uid: { type: String, ref: 'users' },
  created: { type: Date }
})

commentsSchema.pre('save', function (next) {
  this.created = new Date()
  next()
})

commentsSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('There was a duplicate key error'))
  } else {
    next(error)
  }
})

commentsSchema.statics = {
  findByCid: function (id) {
    return this.find({ cid: id })
  },
  getHandsByUid: function (id, page, limit) {
    return this.find({ uid: id })
      .populate({
        path: 'uid',
        select: '_id name'
      })
      .populate({
        path: 'cid',
        select: '_id content'
      })
      .skip(page * limit)
      .limit(limit)
      .sort({ created: -1 })
  }
}

const CommentsHands = mongoose.model('comments_hands', commentsSchema)

export default CommentsHands
