const mongoose =require('mongoose')

const addressSchema = mongoose.Schema({
    title : String,
    firstname : String,
    name :String,
    address : String,
    additionals_intels : String,
    city : String,
    post_code : Number,
    phone : Number,
})

const userSchema = mongoose.Schema({
    firstname : String,
    name : String,
    email : String,
    password : String,
    mobile_phone : Number,
    addresses : [addressSchema],
    inscription_date :Date,
    is_verified : Boolean,
    is_admin : {type : Boolean, default : false},
    cart_pants : [{ type: mongoose.Schema.Types.ObjectId, ref: 'cart_pants' }],
    cart_tops : [{ type: mongoose.Schema.Types.ObjectId, ref: 'cart_tops' }],
    token : String,
})

const User = mongoose.model('users', userSchema)

module.exports = User