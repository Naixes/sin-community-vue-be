import mongoose from 'mongoose'
import config from './index' 

// 创建连接
mongoose.connect(config.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

// 监听连接
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.on('connected', () => {
    console.log('connect db success' + config.DB_URL);
});
db.on('disconnected', () => {
    console.log('disconnected' + config.DB_URL);
});

export default mongoose