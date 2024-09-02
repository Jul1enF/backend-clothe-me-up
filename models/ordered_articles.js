const mongoose = require('mongoose')

const orderedArticleSchema=mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
    createdAt : Date,
})

const OrderedArticle = mongoose.model('ordered_articles', orderedArticleSchema)
module.exports = OrderedArticle