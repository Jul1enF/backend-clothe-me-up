const mongoose = require('mongoose')

// const stockSchema = mongoose.Schema({
//     size : String,
//     stock : Number,
// })

const pantSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
})

const Pant = mongoose.model('pants', pantSchema)
module.exports = Pant