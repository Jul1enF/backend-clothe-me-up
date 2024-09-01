const mongoose = require('mongoose')

const cartTopSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
    createdAt : Date,
})

const CartTop = mongoose.model('cart_tops', cartTopSchema)
module.exports = CartTop