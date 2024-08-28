const mongoose = require('mongoose')

const topSchema = mongoose.Schema({
    name : String,
    size : String,
    imgUrl : String,
    price : Number,
    category :String,
    description: String,
    arrival_date : Date,
})

const Top = mongoose.model('tops', topSchema)
module.exports = Top