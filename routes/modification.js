var express=require('express')
var router=express.Router()
const User= require("../models/users")
const jwt = require('jsonwebtoken')

const secretToken = process.env.SECRET_TOKEN

router.put('/addAdress', async (req, res)=>{
    const {title, name, firstname, address, additionals_intels, city, post_code, phone, jwtToken} = req.body

    try{
        const decryptedToken=jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({token : decryptedToken.token})

        if(additionals_intels){
            data.addresses.push({
                title, name, firstname, address, additionals_intels, city, post_code, phone,
            })
        }else{
            data.addresses.push({
                title, name, firstname, address, city, post_code, phone,
            })
        }

       const user = await data.save()

       const i = user.addresses.length-1

        res.json({result:true, addresse : user.addresses[i]})

    }catch(error){res.json({error})}
})

module.exports = router