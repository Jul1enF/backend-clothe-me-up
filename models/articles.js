const mongoose = require('mongoose')

const articleSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
})

const Article = mongoose.model('articles', articleSchema)
module.exports = Article