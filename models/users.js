const mongoose =require('mongoose')

const adressSchema = mongoose.Schema({
    title : String,
    firstname : String,
    name :String,
    adress : String,
    additionals_intels : String,
    post_code : Number,
    phone : Number,
})

const userSchema = mongoose.Schema({
    firstname : String,
    name : String,
    email : String,
    password : String,
    mobile_phone : Number,
    adresses : [adressSchema],
    inscription_date :Date,
    is_verified : Boolean,
    token : String,
})

const User = mongoose.model('users', userSchema)

module.exports = User