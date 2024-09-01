var express = require('express')
var router = express.Router()
const Pant = require("../models/pants")
const CartPant = require('../models/cart_pants')
const Top = require('../models/tops')
const CartTop=require('../models/cart_tops')
const User=require('../models/users')
const mongoose =require('mongoose')
const jwt = require('jsonwebtoken')

const secretToken = process.env.SECRET_TOKEN


// Router pour vérifier avant paiement que les articles sont encore dans les collections panier et sinon en stock.

router.put('/checkArticles', async (req, res)=>{
    const {cart_pants, cart_tops, jwtToken}=req.body
    try{
        let change=false
        let badChange=false
        let pantsRemoved =[]
        let topsRemoved = []

        // Vérif du token de l'utilisateur
        const decryptedToken=jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({token : decryptedToken.token})

        // Vérif pantalons
        if (cart_pants.length>0){
            // Vérif présence dans la collection panier de pants
            for (let pant of cart_pants) {
                const answer = await CartPant.findOne({_id : pant._id})
                
                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Pant.findOne({_id : pant._id})
                    // Si plus dans le stock
                    if (newAnswer== null){
                        badChange=true
                        data.cart_pants=data.cart_pants.filter(e=>e!== pant._id)
                        await data.save()
                        pantsRemoved.push(pant._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else{
                        const id = newAnswer._id.toString()

                        const newCartPant= new CartPant({
                            name :newAnswer.name,
                            size : newAnswer.size,
                            imgUrl : newAnswer.imgUrl,
                            price : newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt : new Date(),
                            _id:new mongoose.Types.ObjectId(id)
                          })
                      
                          await newCartPant.save()
                          change=true
                    }
                }
            }
        }

        // Vérifs hauts
        if (cart_tops.length>0){
            // Vérif présence dans la collection panier de tops
            for (let top of cart_tops) {
                const answer = await CartTop.findOne({_id : top._id})
                
                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Top.findOne({_id : top._id})
                    // Si plus dans le stock
                    if (newAnswer== null){
                        badChange=true
                        data.cart_tops=data.cart_tops.filter(e=>e!== top._id)
                        await data.save()
                        topsRemoved.push(top._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else{
                        const id = newAnswer._id.toString()

                        const newCartTop= new CartTop({
                            name :newAnswer.name,
                            size : newAnswer.size,
                            imgUrl : newAnswer.imgUrl,
                            price : newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt : new Date(),
                            _id:new mongoose.Types.ObjectId(id)
                          })
                      
                          await newCartTop.save()
                          change=true
                    }
                }
            }
        }

        res.json({result : true, change, badChange, pantsRemoved, topsRemoved})

    }catch(error){res.json({error})}
})






// Route payement et enregistrement collections orders et items_ordered


router.put('/payOrder', async(req, res)=>{
    const {cart_pants, cart_tops, jwtToken, totalArticles, deliveryPrice, total, chosenAdresse, chosenAdresse2, deliveryMode, CardNumber, CardMonth, CardYear, CardCVV, ClientIp} = req.body

    try{
        let badChange=false
        let pantsRemoved =[]
        let topsRemoved = []

        // Vérif du token de l'utilisateur
        const decryptedToken=jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({token : decryptedToken.token})

        // Vérif pantalons
        if (cart_pants.length>0){
            // Vérif présence dans la collection panier de pants
            for (let pant of cart_pants) {
                const answer = await CartPant.findOne({_id : pant._id})
                
                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Pant.findOne({_id : pant._id})
                    // Si plus dans le stock
                    if (newAnswer== null){
                        badChange=true
                        data.cart_pants=data.cart_pants.filter(e=>e!== pant._id)
                        await data.save()
                        pantsRemoved.push(pant._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else{
                        const id = newAnswer._id.toString()

                        const newCartPant= new CartPant({
                            name :newAnswer.name,
                            size : newAnswer.size,
                            imgUrl : newAnswer.imgUrl,
                            price : newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt : new Date(),
                            _id:new mongoose.Types.ObjectId(id)
                          })
                      
                          await newCartPant.save()
                    }
                }
            }
        }

         // Vérifs hauts
         if (cart_tops.length>0){
            // Vérif présence dans la collection panier de tops
            for (let top of cart_tops) {
                const answer = await CartTop.findOne({_id : top._id})
                
                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Top.findOne({_id : top._id})
                    // Si plus dans le stock
                    if (newAnswer== null){
                        badChange=true
                        data.cart_tops=data.cart_tops.filter(e=>e!== top._id)
                        await data.save()
                        topsRemoved.push(top._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else{
                        const id = newAnswer._id.toString()

                        const newCartTop= new CartTop({
                            name :newAnswer.name,
                            size : newAnswer.size,
                            imgUrl : newAnswer.imgUrl,
                            price : newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt : new Date(),
                            _id:new mongoose.Types.ObjectId(id)
                          })
                      
                          await newCartTop.save()
                    }
                }
            }
        }
        if (badChange){
            return res.json({result : true, payment : false, missingArticles:true, errorSentence:"Des articles de votre panier ne sont malheureusement plus disponibles !"})
        }


        // Fetch de easytransac pour payer
        // const response = await fetch(`https://www.easytransac.com/api/payment/direct`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({

        //     })
        // })

        // Si easytransac a marché

        

    }catch(error){res.json({error})}
})

module.exports=router