import mongoose from '../config/DBHelper'

const Schema = mongoose.Schema

const TestSchema = new Schema({
    'name': {type: String}
})

const testModel = mongoose.model('users', TestSchema)

export default testModel