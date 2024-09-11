var express = require('express');
var router = express.Router();

var User = require('../models/users')
const CartArticle = require("../models/cart_articles")
const uid2 = require('uid2')
const jwt = require('jsonwebtoken')

const secretToken = process.env.SECRET_TOKEN

const frontAddress = process.env.FRONT_ADDRESS
const backAddress = process.env.BACK_ADDRESS

const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET
const { OAuth2Client } = require('google-auth-library')


// Route pour vérifier que les articles du panier sont toujours dedans

router.put('/checkArticles', async (req, res) => {
    let { cart_articles, jwtToken, articlesNotLinked, temporaryToken } = req.body

    try {

        // Vérif dispos articles si utilisateur non connecté
        if (!jwtToken) {
            let change = false
            for (let article of cart_articles) {
                const answer = await CartArticle.findOne({ _id: article._id, temporary_user : temporaryToken })

                if (answer == null) {
                    cart_articles = cart_articles.filter(e => e._id !== article._id)
                    articlesNotLinked = articlesNotLinked.filter(e => e !== article._id)
                    change = true
                }
            }

            res.json({ result: true, change, cart_articles, articlesNotLinked })
        }
        // Vérif dispos articles si utilisateur connecté
        else {
            const decryptedToken = jwt.verify(jwtToken, secretToken)
            let data = await User.findOne({ token: decryptedToken.token })

            if (!data) { res.json({ result: false, error: "user not found" }) }
            else {
                let change = false

                for (let article of data.cart_articles) {
                    const answer = await CartArticle.findOne({ _id: article, user : data._id })


                    if (answer == null) {
                        data.cart_articles = data.cart_articles.filter(e => e !== article)
                        change = true
                    }
                }

                if (change) {
                    const newData = await data.save()
                    await newData.populate('cart_articles')

                    res.json({ result: true, change, cart_articles: newData.cart_articles })
                } else {
                    res.json({ result: true, change })
                }
            }
        }

    } catch (err) {
        res.json({ result: false, err })
    }

})


// Route pour supprimer du panier un article

router.delete('/deleteArticle/:_id/:jwtToken', async (req, res) => {
    let { _id, jwtToken } = req.params
    try {

        const data = await CartArticle.deleteOne({ _id })
        res.json({ result: true })

        if (jwtToken !== "none") {
            const decryptedToken = jwt.verify(jwtToken, secretToken)
            let user = await User.findOne({ token: decryptedToken.token })

            user.cart_articles = user.cart_articles.filter(e => e.toString() !== _id)

            await user.save()
        }

    } catch (err) { res.json({ err }) }
})



// Routes Connexion Google


// 1ère route pour avoir une url de connexion google

router.post('/google', async (req, res) => {
    res.header('Access-Control-Allow-Origin', `${frontAddress}`)

    // Pour autoriser l'utilisation de http ou lieu de https
    res.header('Referrer-Policy', 'no-referrer-when-downgrade')

    const redirectUrl = `${backAddress}/cart/google/auth`

    const oAuth2Client = new OAuth2Client(
        googleId,
        googleSecret,
        redirectUrl,
    )

    const authorizeUrl = oAuth2Client.generateAuthUrl({

        // Pour avoir un nouveau token à chaque fois
        access_type: 'offline',
        scope: 'https://www.googleapis.com/auth/userinfo.profile openid email',
        prompt: 'consent',
    })

    res.json({ url: authorizeUrl })
})


// redirectUrl : Route pour obtenir de google les infos du user

router.get('/google/auth', async (req, res) => {

    //Récupération du code fourni par google
    const { code } = req.query

    try {
        const redirectUrl = `${backAddress}/cart/google/auth`
        const oAuth2Client = new OAuth2Client(
            googleId,
            googleSecret,
            redirectUrl,
        )

        //Échange du code contre un token d'utilisation
        const answer = await oAuth2Client.getToken(code)
        await oAuth2Client.setCredentials(answer.tokens)

        //Récupération des infos/credentials/tokens du user
        const user = oAuth2Client.credentials

        //Récupération des infos du user grâce à son access_token
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${user.access_token}`
                }
            }
        )
        const data = await response.json()

        let name
        if (data.family_name) { name = data.family_name }

        const { email } = data
        const firstname = data.given_name
        const token = uid2(32)
        const jwtToken = jwt.sign({
            token,
        }, secretToken, { expiresIn: '3h' })

        const result = await User.findOne({ email })
        // Si l'utilisateur se connecte
        if (result) {
            result.token = token
            await result.save()
        }
        // Si l'utilisateur s'inscrit
        else {
            const newUser = new User({
                firstname,
                name,
                email,
                inscription_date: new Date(),
                is_verified: true,
                token,
            })
            await newUser.save()
        }

        res.redirect(`${frontAddress}/cart/g/${jwtToken}`)


    } catch (err) { console.log(err) }
})



// Route de récupération des infos du user google

router.put('/googleUserInfos', async (req, res) => {
    const { jwtToken, articlesNotLinked, temporaryToken } = req.body

    try {
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        const data = await User.findOne({ token: decryptedToken.token })

        // Vérif dispo articles du panier
        for (let article of data.cart_articles) {
            const answer = await CartArticle.findOne({ _id: article, user: data._id })

            if (answer == null) { data.cart_articles = data.cart_articles.filter(e => e !== article) }
        }

        // Ajout d'articles présents dans le panier et non enregistrés + Link de ceux ci avec l'id du user

        if (articlesNotLinked.length > 0) {
            for (let article of articlesNotLinked) {

                const basketArticle = await CartArticle.findOne({ _id: article, temporary_user: temporaryToken })

                if (basketArticle) {
                    data.cart_articles.push(article)

                    basketArticle.user = data._id
                    await basketArticle.save()
                }
            }
        }

        const newData = await data.save()
        await newData.populate('cart_articles')
        await newData.populate('orders')
        await newData.populate({ path: 'orders', populate: { path: 'articles' } })

        let password
        !newData.password ? password = false : password = true

        res.json({ result: true, token: jwtToken, firstname: newData.firstname, name: newData.name, email: newData.email, mobile_phone: newData.mobile_phone, is_admin: newData.is_admin, cart_articles: newData.cart_articles, addresses: newData.addresses, orders: newData.orders, password })

    } catch (err) { res.json({ result: false, err }) }
})

module.exports = router;