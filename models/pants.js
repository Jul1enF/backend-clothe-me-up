const mongoose = require('mongoose')

const stockSchema = mongoose.Schema({
    size : String,
    stock : Number,
})

const pantSchema = mongoose.Schema({
    name : String,
    stocks : [stockSchema],
    imgUrl : String,
    price : Number,
    arrivalDate : Date,
})

const Pant = mongoose.model('pants', pantSchema)
module.exports = Pant