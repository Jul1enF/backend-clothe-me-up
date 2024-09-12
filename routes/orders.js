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

const nodemailer = require("nodemailer")
const checkEmail = process.env.CHECK_EMAIL
const passwordCheckMail = process.env.PASSWORD_CHECK_EMAIL

const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: checkEmail,
        pass: passwordCheckMail,
    }
})


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
                const answer = await CartArticle.find({ _id: article._id })

                // Si pas présent, vérif dans le stock
                if (answer.length == 0) {
                    const newAnswer = await Article.find({ _id: article._id })
                    // Si plus dans le stock
                    if (newAnswer.length == 0) {
                        badChange = true
                        data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                        await data.save()
                        articlesRemoved.push(article._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else {
                        const id = newAnswer[0]._id.toString()

                        const newCartArticle = new CartArticle({
                            name: newAnswer[0].name,
                            size: newAnswer[0].size,
                            imgUrl: newAnswer[0].imgUrl,
                            price: newAnswer[0].price,
                            category: newAnswer[0].category,
                            description: newAnswer[0].description,
                            arrival_date: newAnswer[0].arrival_date,
                            createdAt: new Date(),
                            _id: new mongoose.Types.ObjectId(id),
                            user: data._id
                        })

                        await newCartArticle.save()
                        change = true
                    }
                }

                // Si article présent dans la collection panier, vérif qu'il est bien attribué à l'utilisateur actuel
                else if (!answer[0].user || answer[0].user.toString() !== data._id.toString()) {
                    badChange = true
                    data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                    await data.save()
                    articlesRemoved.push(article._id)
                }
            }
        }

        res.json({ result: true, change, badChange, articlesRemoved })

    } catch (err) { res.json({ err }) }
})






// Route payement et enregistrement collections orders et items_ordered


router.put('/payOrder', async (req, res) => {
    const { cart_articles, jwtToken, totalArticles, deliveryPrice, total, chosenAddress, chosenAddress2, deliveryMode, CardNumber, CardMonth, CardYear, CardCVV, ClientIp } = req.body

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
                const answer = await CartArticle.find({ _id: article._id })

                // Si pas présent, vérif dans le stock
                if (answer.length == 0) {
                    const newAnswer = await Article.find({ _id: article._id })
                    // Si plus dans le stock
                    if (newAnswer.length == 0) {
                        badChange = true
                        data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                        await data.save()
                        articlesRemoved.push(article._id)
                    }
                    // Si encore dans le stock, remise dans panier
                    else {
                        const id = newAnswer[0]._id.toString()

                        const newCartArticle = new CartArticle({
                            name: newAnswer[0].name,
                            size: newAnswer[0].size,
                            imgUrl: newAnswer[0].imgUrl,
                            price: newAnswer[0].price,
                            category: newAnswer[0].category,
                            description: newAnswer[0].description,
                            arrival_date: newAnswer[0].arrival_date,
                            createdAt: new Date(),
                            _id: new mongoose.Types.ObjectId(id),
                            user: data._id
                        })

                        await newCartArticle.save()
                        change = true
                    }
                }

                // Si article présent dans la collection panier, vérif qu'il est bien attribué à l'utilisateur actuel
                else if (!answer[0].user || answer[0].user.toString() !== data._id.toString()) {
                    badChange = true
                    data.cart_articles = data.cart_articles.filter(e => e !== article._id)
                    await data.save()
                    articlesRemoved.push(article._id)
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
        for (let article of cart_articles) {

            const articleData = await CartArticle.findOne({ _id: article._id })

            const newOrderedArticle = new OrderedArticle({
                name: articleData.name,
                size: articleData.size,
                imgUrl: articleData.imgUrl,
                price: articleData.price,
                category: articleData.category,
                decription: articleData.description,
                arrival_date: articleData.arrival_date,
                createdAt: new Date(),
            })

            const savedOrderedArticle = await newOrderedArticle.save()

            articles.push(savedOrderedArticle._id)

            await CartArticle.deleteOne({ _id: article._id })
            await Article.deleteOne({ _id: article._id })

        }


        // Enregistrement d'un nouveau document collection orders

        // Recherche et actualisation du dernier num de commande
        let lastNum = 0

        const dataOrderNumber = await OrderNumber.findOne({ name: "Clothe me up" })

        lastNum += dataOrderNumber.number

        dataOrderNumber.number += 1
        await dataOrderNumber.save()

        // Création du numéro de la commande actuelle
        const date = moment(new Date()).format('YYMMDDHHmm')
        const dateAndNum = date + lastNum.toString()
        const order_number = Number(dateAndNum)


        // Création d'un nouveau document collection orders
        const newOrder = new Order({
            order_number,
            chosen_address: chosenAddress,
            chosen_address2: chosenAddress2,
            delivery_mode: deliveryMode,
            articles_price: totalArticles,
            delivery_price: deliveryPrice,
            total_price: total,
            user: data._id,
            articles,
            createdAt: new Date(),
        })

        const newSavedOrder = await newOrder.save()
        await newSavedOrder.populate('articles')


        // Vidage du panier du user dans son document (cart_articles) et rattachement de l'id de sa commande

        data.cart_articles = []
        data.orders.push(newSavedOrder._id)

        await data.save()



        // Envoi email de confirmation à l'utilisateur

        let detailArticles = ""

        cart_articles.map(e => detailArticles += `<h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">- ${e.name}, taille : ${e.size}, prix : ${e.price.toFixed(2)}€</h2>`)

        const userConfirmartionEmail = {
            from: checkEmail,
            to: data.email,
            subject: 'Confirmation de votre commande',
            html: `<body>
          <div style="width: 100%;
        height: 100px; background-color: rgb(13,1,102); margin:0; padding:0; margin-bottom:20px">
            <h1 style="color:white; margin:0; padding:0; width:100%; text-align:center; padding-top:20px; font-size:40px">CLOTHE ME UP !</h1>
          </div>
            <h2 style="width:100%; text-align:center; margin-bottom:5px ; font-size: 25px; color:black">Bonjour ${data.firstname},</h2>
            <h2 style="width:100%; text-align:center ; margin-bottom:30px; color:black">Le règlement de votre commande numéro ${order_number} a bien été accepté. Merci pour votre achat sur Clothe me up !</h2>
        <div style="width: 100% ; background-color: rgb(245,245,245); margin:0; padding-top:15px; padding-bottom:15px">
            <h2 style="width:100%; text-align:center; margin-bottom:25px; font-weight:650; text-decoration:underline; color:rgb(13,1, 102); font-size:22px">Détail de votre commande :</h2>
            ${detailArticles}
            <h2 style="width:100%; text-align:center; margin-bottom:15px; padding-top:10px; color:rgb(13,1, 102)">Prix total : ${total.toFixed(2)}€   (frais de port : ${deliveryPrice.toFixed(2)}€)</h2>
             <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">Nous vous enverrons un mail dès que votre commande sera envoyée.</h2>
              <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">À bientôt sur Clothe me up !</h2>
        </div>
          </body>
          `
        }

        await emailTransporter.sendMail(userConfirmartionEmail)


        // Envoi d'un mail pour signaler au backoffice qu'une commande a été passée

        let addressToDeliver = ""
        if (chosenAddress2) {
            addressToDeliver = `<h2 style="width:100%; text-align:center; color:rgb(13,1, 102); padding-top:20px; text-decoration:underline">Adresse de livraison :</h2>
            <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">${chosenAddress2.title} : ${chosenAddress2.address} ${chosenAddress2.post_code} ${chosenAddress2.city}</h2>`
        } else if (deliveryMode !== "Retrait en magasin") {
            addressToDeliver = `<h2 style="width:100%; text-align:center; color:rgb(13,1, 102); padding-top:20px; text-decoration:underline">Adresse de livraison :</h2>
            <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">${chosenAddress.title} : ${chosenAddress.firstname} ${chosenAddress.name} ${chosenAddress.address} ${chosenAddress.post_code} ${chosenAddress.city}</h2>`
        }

        let client
        if (data.name) {
            client = `  <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">${data.firstname} ${data.name} (${data.email})</h2>`
        } else {
            client = `  <h2 style="width:100%; text-align:center; color:rgb(13,1, 102)">${data.firstname} (${data.email})</h2>`
        }



        const boConfirmartionEmail = {
            from: checkEmail,
            to: checkEmail,
            subject: 'Nouvelle commande',
            html: `<body>
          <div style="width: 100%;
        height: 100px; background-color: rgb(13,1,102); margin:0; padding:0; margin-bottom:20px">
            <h1 style="color:white; margin:0; padding:0; width:100%; text-align:center; padding-top:20px; font-size:40px">CLOTHE ME UP !</h1>
          </div>
            <h2 style="width:100%; text-align:center; margin-bottom:5px ; font-size: 25px; color:black">Bonjour,</h2>
            <h2 style="width:100%; text-align:center ; margin-bottom:30px; color:black">Une nouvelle commande vient d'être acceptée !</h2>
        <div style="width: 100% ; background-color: rgb(245,245,245); margin:0; padding-top:15px; padding-bottom:15px">
            <h2 style="width:100%; text-align:center; margin-bottom:25px; font-weight:650; text-decoration:underline; color:rgb(13,1, 102); font-size:22px">Détail de la commande :</h2>
             <h2 style="width:100%; text-align:center; margin-bottom:15px; color:rgb(13,1, 102)">Commmande numéro : ${order_number}</h2>
               <h2 style="width:100%; text-align:center; color:rgb(13,1, 102); text-decoration:underline">Client :</h2>
               ${client}
              <h2 style="width:100%; text-align:center; color:rgb(13,1, 102); text-decoration:underline; padding-top:20px">Articles :</h2>
            ${detailArticles}
            <h2 style="width:100%; text-align:center; color:rgb(13,1, 102); padding-top:25px">Mode de livraison : ${deliveryMode}</h2>
            ${addressToDeliver}
            <h2 style="width:100%; text-align:center; margin-bottom:15px; padding-top:10px; color:rgb(13,1, 102)">Prix total : ${total.toFixed(2)}€   (frais de port : ${deliveryPrice.toFixed(2)}€)</h2>
        </div>
          </body>
          `
        }

        await emailTransporter.sendMail(boConfirmartionEmail)

        res.json({
            result: true,
            payment,
            newSavedOrder,
        })


    } catch (err) { res.json({ err }) }
})

module.exports = router