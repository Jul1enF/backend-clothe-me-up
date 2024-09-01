const mongoose = require('mongoose')

const articleOrderedSchema=mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
    createdAt : Date,
})

const ArticleOrdered = mongoose.model('articles_ordered', articleOrderedSchema)
module.exports = ArticleOrdered