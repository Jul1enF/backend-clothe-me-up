var express = require('express')
var router = express.Router()
const Article = require("../models/articles")
const CartArticle = require('../models/cart_articles')
const User = require('../models/users')
const OrderedArticle = require("../models/ordered_articles")
const Order = require("../models/orders")
const OrderNumber = require('../models/order_numbers')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const moment = require('moment')

const secretToken = process.env.SECRET_TOKEN


// Router pour vérifier avant paiement que les articles sont encore dans les collections panier et sinon en stock.

router.put('/checkArticles', async (req, res) => {
    const { cart_articles, jwtToken } = req.body
    try {
        let change = false
        let badChange = false
        let articlesRemoved = []

        // Vérif du token de l'utilisateur
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({ token: decryptedToken.token })

        // Vérif articles
        if (cart_articles.length > 0) {
            // Vérif présence dans la collection panier
            for (let article of cart_articles) {
                const answer = await CartArticle.findOne({ _id: article._id })

                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Article.findOne({ _id: article._id })
                    // Si plus dans le stock
                    if (newAnswer == null) {
                        badChange = true
                        data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                        await data.save()
                        articlesRemoved.push(article._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else {
                        const id = newAnswer._id.toString()

                        const newCartArticle = new CartArticle({
                            name: newAnswer.name,
                            size: newAnswer.size,
                            imgUrl: newAnswer.imgUrl,
                            price: newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt: new Date(),
                            _id: new mongoose.Types.ObjectId(id)
                        })

                        await newCartArticle.save()
                        change = true
                    }
                }
            }
        }

        res.json({ result: true, change, badChange, articlesRemoved })

    } catch (error) { res.json({ error }) }
})






// Route payement et enregistrement collections orders et items_ordered


router.put('/payOrder', async (req, res) => {
    const { cart_articles, jwtToken, totalArticles, deliveryPrice, total, chosenAdresse, chosenAdresse2, deliveryMode, CardNumber, CardMonth, CardYear, CardCVV, ClientIp } = req.body

    try {
        let badChange = false
        let articlesRemoved = []

        // Vérif du token de l'utilisateur
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({ token: decryptedToken.token })

        // Vérif articles
        if (cart_articles.length > 0) {
            // Vérif présence dans la collection panier
            for (let article of cart_articles) {
                const answer = await CartArticle.findOne({ _id: article._id })

                // Sinon vérif dans le stock
                if (answer == null) {
                    const newAnswer = await Article.findOne({ _id: article._id })
                    // Si plus dans le stock
                    if (newAnswer == null) {
                        badChange = true
                        data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                        await data.save()
                        articlesRemoved.push(article._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else {
                        const id = newAnswer._id.toString()

                        const newCartArticle = new CartArticle({
                            name: newAnswer.name,
                            size: newAnswer.size,
                            imgUrl: newAnswer.imgUrl,
                            price: newAnswer.price,
                            category: newAnswer.category,
                            description: newAnswer.description,
                            arrival_date: newAnswer.arrival_date,
                            createdAt: new Date(),
                            _id: new mongoose.Types.ObjectId(id)
                        })

                        await newCartArticle.save()
                    }
                }
            }
        }

        if (badChange) {
            return res.json({
                result: true,
                payment: false,
                missingArticles: true,
                articlesRemoved,
                errorSentence: "Payement non débité, des articles de votre panier ne sont malheureusement plus disponibles !"
            })
        }


        // FETCH DE EASYTRANSAC POUR PAYER

        // const response = await fetch(`https://www.easytransac.com/api/payment/direct`, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({

        //     })
        // })

        let payment = true

        if (!payment) {
            return res.json({
                result: true,
                payment: false,
                missingArticles: false,
                errorSentence: "Payement refusé. Merci d'essayer un autre moyen règlement."
            })
        }



        // Si easytransac a marché



        // Variable pour récolter les id des documents de la collection ordered_articles
        let articles = []


        // Création des nouveaux document ordered_articles et suppression des documents correspondants dans cart_articles et articles
        for (let article of cart_articles){

            const articleData = await CartArticle.findOne({_id : article._id})

            const newOrderedArticle = new OrderedArticle({
                name : articleData.name,
                size : articleData.size,
                imgUrl : articleData.imgUrl,
                price : articleData.price,
                category : articleData.category,
                decription : articleData.description,
                arrival_date : articleData.arrival_date,
                createdAt : new Date(),
            })

            const savedOrderedArticle = await newOrderedArticle.save()

            articles.push(savedOrderedArticle._id)

            await CartArticle.deleteOne({_id: article._id})
            await Article.deleteOne({_id: article._id})

        }


        // Enregistrement d'un nouveau document collection orders

        // Recherche et actualisation du dernier num de commande
        let lastNum = 0

        const dataOrderNumber = await OrderNumber.findOne({name: "Clothe me up"})
     
        lastNum+=dataOrderNumber.number

        dataOrderNumber.number+=1
        await dataOrderNumber.save()

        // Création du numéro de la commande actuelle
        const date = moment(new Date()).format('YYYYMMDDHHmm')
        const dateAndNum = date+lastNum.toString()
        const order_number = Number(dateAndNum)


        // Création d'un nouveau document collection orders
        const newOrder = new Order({
            order_number,
            chosen_adresse : chosenAdresse,
            chosen_adresse2 : chosenAdresse2,
            delivery_mode : deliveryMode,
            articles_price : totalArticles,
            delivery_price : deliveryPrice,
            total_price : total,
            user : data._id,
            articles,
        })

        const newSavedOrder = await newOrder.save()


        // Vidage du panier du user dans son document (cart_articles) et rattachement de l'id de sa commande

        data.cart_articles=[]
        data.orders.push(newSavedOrder._id)

        await data.save()

        res.json({
            result : true,
            payment,
            newSavedOrder,
        })


    } catch (error) { res.json({ error }) }
})

module.exports = router