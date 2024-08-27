var express = require('express');
var router = express.Router();
const Pant = require('../models/pants')
const CartPant = require('../models/cart_pants')
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const mongoose =require('mongoose')

const secretToken = process.env.SECRET_TOKEN

router.get('/allPants', async (req, res)=> {
  let pants = await Pant.find()
  const cartPants = await CartPant.find()

  if (pants.length==0){
    res.json({result:false, error : "Aucun article trouvé."})
  }
  else if (cartPants.length===0){
    res.json({result : true, pants})
  }
  else{
        for (let pant of cartPants){
                pants=pants.filter(e=>e._id.toString()!==pant._id.toString())
            }
    res.json({result : true, pants})
  }
});

router.put('/addCartPant', async(req, res)=>{
  const {jwtToken, _id}=req.body
  try{
    const pant = await Pant.findById(_id)
    const id = pant._id.toString()

    const newCartPant= new CartPant({
      name :pant.name,
      size : pant.size,
      imgUrl : pant.imgUrl,
      price : pant.price,
      category: pant.category,
      description: pant.description,
      arrival_date:pant.arrival_date,
      createdAt : new Date(),
      _id:new mongoose.Types.ObjectId(id)
    })

    const cartPantSaved = await newCartPant.save()

    if(jwtToken){
      const decryptedToken=jwt.verify(jwtToken, secretToken)

      const answer = await User.updateOne({token : decryptedToken.token}, {$push : {cart_pants : cartPantSaved._id}})

      res.json({result:true, cartPantSaved})
    }
    else {
      res.json({result:true, cartPantSaved, noLink:cartPantSaved._id})
    }

  }catch (error){
    res.json({result : false, error})
  }
})


module.exports = router;