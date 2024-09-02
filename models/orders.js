const mongoose = require("mongoose")

const orderSchema = mongoose.Schema({
  order_number : Number,
  chosen_adresse : Object,
  chosen_adresse2 : Object,
  delivery_mode : String,
  articles_price : Number,
  delivery_price : Number,
  total_price : Number,
  user : { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  articles : [{ type: mongoose.Schema.Types.ObjectId, ref: 'ordered_articles' }]
})

const Order = mongoose.model('orders', orderSchema)
module.exports= Order