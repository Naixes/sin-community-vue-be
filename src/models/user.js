import mongoose from '../config/DBHelper'

const Schema = mongoose.Schema

const UserSchema = new Schema({
    'email': {type: String},
    'name': {type: String},
    'password': {type: String}
})

const UserModel = mongoose.model('users', UserSchema)

export default UserModel