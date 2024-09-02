var express = require('express');
var router = express.Router();
const Article = require('../models/articles')
const CartArticle = require('../models/cart_articles')
const User = require('../models/users')
const jwt = require('jsonwebtoken')
const mongoose =require('mongoose')

const secretToken = process.env.SECRET_TOKEN

router.get('/allArticles', async (req, res)=> {
  let articles = await Article.find()
  const cartArticles = await CartArticle.find()

  if (articles.length==0){
    res.json({result:false, error : "Aucun article trouvé."})
  }
  else if (cartArticles.length===0){
    res.json({result : true, articles})
  }
  else{
        for (let article of cartArticles){
                articles=articles.filter(e=>e._id.toString()!==article._id.toString())
            }
    res.json({result : true, articles})
  }
});

router.put('/addCartArticle', async(req, res)=>{
  const {jwtToken, _id}=req.body
  try{
    const article = await Article.findById(_id)
    const id = article._id.toString()

    const newCartArticle= new CartArticle({
      name :article.name,
      size : article.size,
      imgUrl : article.imgUrl,
      price : article.price,
      category: article.category,
      description: article.description,
      arrival_date: article.arrival_date,
      createdAt : new Date(),
      _id:new mongoose.Types.ObjectId(id)
    })

    const cartArticleSaved = await newCartArticle.save()

     // Enregistrement en bdd si token (user connecté)

    if(jwtToken){
      const decryptedToken=jwt.verify(jwtToken, secretToken)

      const answer = await User.updateOne({token : decryptedToken.token}, {$push : {cart_articles : cartArticleSaved._id}})

      res.json({result:true, cartArticleSaved})
    }
    else {
      res.json({result:true, cartArticleSaved, noLink: cartArticleSaved._id})
    }

  }catch (error){
    res.json({result : false, error})
  }
})


module.exports = router;