const mongoose = require('mongoose')

const cartPantSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
    createdAt : Date,
    
})

const CartPant = mongoose.model('cart_pants', cartPantSchema)
module.exports = CartPant