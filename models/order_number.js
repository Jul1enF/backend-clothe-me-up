const mongoose = require("mongoose")

const order_numberSchema = mongoose.Schema({
    number : Number,
})

const OrderNumber = mongoose.model("order_number", order_numberSchema)

module.exports=OrderNumber