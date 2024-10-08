const mongoose = require("mongoose")

const orderSchema = mongoose.Schema({
  order_number : Number,
  chosen_address : Object,
  chosen_address2 : Object,
  delivery_mode : String,
  articles_price : Number,
  delivery_price : Number,
  total_price : Number,
  createdAt : Date,
  sent :  {type : Boolean, default : false},
  user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  articles : [{ type: mongoose.Schema.Types.ObjectId, ref: 'ordered_articles' }]
})

const Order = mongoose.model('orders', orderSchema)
module.exports= Order