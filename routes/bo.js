var express = require('express');
var router = express.Router();
const Pant =require("../models/pants")

router.post('/addArticles', async (req, res)=>{
  const {name, imgUrl, price, description, category, size1, stock1, size2, stock2, size3, stock3, size4, stock4, size5, stock5, size6, stock6, size7, stock7, size8, stock8} = req.body

  try{

    // Enregistrement de la catégorie pants

    if (category=="pants"){
      for (let i=0; i<stock1; i++){
        const newPant = new Pant({
          name,
          imgUrl,
          price,
          description,
          category,
          size:size1,
          arrival_date: new Date(),
        })
        await newPant.save()
      }
      if(size2){
        for (let i=0; i<stock2; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size2,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if(size3){
        for (let i=0; i<stock3; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size3,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if (size4){
        for (let i=0; i<stock4; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size4,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if(size5){
        for (let i=0; i<stock5; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size5,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if(size6){
        for (let i=0; i<stock6; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size6,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if(size7){
        for (let i=0; i<stock7; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size7,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
      if(size8){
        for (let i=0; i<stock8; i++){
          const newPant = new Pant({
            name,
            imgUrl,
            price,
            description,
            category,
            size:size8,
            arrival_date: new Date(),
          })
          await newPant.save()
        }
      }
    }
    
    // Enregistrement de la catégorie tops

    res.json({result:true})
  }
  catch(error){
    res.json({result:false, error})
  }

})

module.exports = router;