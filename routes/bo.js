var express = require('express');
var router = express.Router();
const Article = require('../models/articles')
const User = require("../models/users")
const jwt = require('jsonwebtoken')

const secretToken = process.env.SECRET_TOKEN

// Checker si l'utilisateur est autorisé (admin)

router.get('/checkUser/:jwtToken', async (req, res) => {
  const { jwtToken } = req.params

  try {
    if (!jwtToken) {
      res.json({ result: false, error: "Utilisateur non habilité" })
      return
    }
    else if (jwtToken) {
      const decryptedToken = jwt.verify(jwtToken, secretToken)
      const token = decryptedToken.token
      const user = await User.findOne({ token })
      if (!user.is_admin) {
        res.json({ result: false, error: "Utilisateur non habilité !" })
        return
      }else if (user.is_admin){
        res.json({result : true})
      }
    }
  } catch (err) { res.json({ err }) }
})



// Poster des articles

router.post('/addArticles', async (req, res) => {
  const { jwtToken, name, imgUrl, price, description, category, size1, stock1, size2, stock2, size3, stock3, size4, stock4, size5, stock5, size6, stock6, size7, stock7, size8, stock8 } = req.body

  try {
    // Vérification du token
    if (!jwtToken) {
      res.json({ result: false, error: "Utilisateur non connecté !" })
      return
    }
    if (jwtToken) {
      const decryptedToken = jwt.verify(jwtToken, secretToken)
      const token = decryptedToken.token
      const user = await User.findOne({ token })
      if (!user.is_admin) {
        res.json({ result: false, error: "Utilisateur non habilité à poster !" })
        return
      }
    }

    // Enregistrement des articles

      for (let i = 0; i < stock1; i++) {
        const newArticle = new Article({
          name,
          imgUrl,
          price,
          description,
          category,
          size: size1,
          arrival_date: new Date(),
        })
        await newArticle.save()
      }
      if (size2) {
        for (let i = 0; i < stock2; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size2,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size3) {
        for (let i = 0; i < stock3; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size3,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size4) {
        for (let i = 0; i < stock4; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size4,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size5) {
        for (let i = 0; i < stock5; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size5,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size6) {
        for (let i = 0; i < stock6; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size6,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size7) {
        for (let i = 0; i < stock7; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size7,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }
      if (size8) {
        for (let i = 0; i < stock8; i++) {
          const newArticle = new Article({
            name,
            imgUrl,
            price,
            description,
            category,
            size: size8,
            arrival_date: new Date(),
          })
          await newArticle.save()
        }
      }

      res.json({ result: true })
  }
  catch (err) {
    res.json({ result: false, err })
  }

})

module.exports = router;