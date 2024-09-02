const mongoose = require("mongoose")

const order_numberSchema = mongoose.Schema({
    number : Number,
    name : String,
})

const OrderNumber = mongoose.model("order_numbers", order_numberSchema)

module.exports=OrderNumber