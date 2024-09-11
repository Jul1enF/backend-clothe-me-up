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
    temporary_user : String,
    user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
})

const CartArticle = mongoose.model('cart_articles', cartArticleSchema)
module.exports = CartArticle