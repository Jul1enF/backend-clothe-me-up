var express = require('express');
var router = express.Router();
const Top = require('../models/tops')
const CartTop = require('../models/cart_tops')
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const mongoose =require('mongoose')

const secretToken = process.env.SECRET_TOKEN

router.get('/allTops', async (req, res)=> {
  let tops = await Top.find()
  const cartTops = await CartTop.find()

  if (tops.length==0){
    res.json({result:false, error : "Aucun article trouvé."})
  }
  else if (cartTops.length===0){
    res.json({result : true, tops})
  }
  else{
        for (let top of cartTops){
                tops=tops.filter(e=>e._id.toString()!==top._id.toString())
            }
    res.json({result : true, tops})
  }
});

router.put('/addCartTop', async(req, res)=>{
  const {jwtToken, _id}=req.body
  try{
    const top = await Top.findById(_id)
    const id = top._id.toString()

    const newCartTop= new CartTop({
      name :top.name,
      size : top.size,
      imgUrl : top.imgUrl,
      price : top.price,
      category: top.category,
      description: top.description,
      arrival_date:top.arrival_date,
      createdAt : new Date(),
      _id:new mongoose.Types.ObjectId(id)
    })

    const cartTopSaved = await newCartTop.save()

    // Enregistrement en bdd (collection user) si token (user connecté)

    if(jwtToken){
      const decryptedToken=jwt.verify(jwtToken, secretToken)

      const answer = await User.updateOne({token : decryptedToken.token}, {$push : {cart_tops : cartTopSaved._id}})

      res.json({result:true, cartTopSaved})
    }
    else {
      res.json({result:true, cartTopSaved, noLink:cartTopSaved._id})
    }

  }catch (error){
    res.json({result : false, error})
  }
})


module.exports = router;