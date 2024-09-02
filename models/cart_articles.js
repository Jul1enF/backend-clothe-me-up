const mongoose = require('mongoose')

const cartArticleSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
    createdAt : Date,
})

const CartArticle = mongoose.model('cart_articles', cartArticleSchema)
module.exports = CartArticle