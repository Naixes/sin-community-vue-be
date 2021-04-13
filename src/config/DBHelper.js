import mongoose from 'mongoose'
import {DB_URL} from './index' 

// 创建连接
mongoose.connect(DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

// 监听连接
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('connected', () => {
    console.log('connect db success' + DB_URL);
});
db.on('disconnected', () => {
    console.log('disconnected' + DB_URL);
});

export default mongoose