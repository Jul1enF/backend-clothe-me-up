var express = require('express');
var router = express.Router();
const Pant = require('../models/pants')


router.get('/allPants', async (req, res)=> {
  const articles = await Pant.find()
  if (articles.length==0){
    res.json({result:false, error : "Aucun article trouvé."})
  }
  else{
    res.json({result : true, articles})
  }
});

module.exports = router;