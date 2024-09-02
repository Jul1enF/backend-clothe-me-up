var express = require('express');
var router = express.Router();

var User = require('../models/users')
const CartArticle = require('../models/cart_articles')
const { checkBody } = require('../modules/checkBody')
const uid2 = require('uid2')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")

const checkEmail = process.env.CHECK_EMAIL
const passwordCheckMail = process.env.PASSWORD_CHECK_EMAIL
const secretToken = process.env.SECRET_TOKEN

const frontAddress = process.env.FRONT_ADDRESS
const backAddress = process.env.BACK_ADDRESS

const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET
const { OAuth2Client } = require('google-auth-library')


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

const checkMail = (jwtToken, email, firstname) => {
    const verifAddress = `${frontAddress}/verification/${jwtToken}/${email}`

    const mailOptions = {
        from: checkEmail,
        to: email,
        subject: 'Vérification de votre email',
        html: `<body>
      <div style="width: 100%;
    height: 100px; background-color: rgb(13,1,102); margin:0; padding:0; margin-bottom:20px">
        <h1 style="color:white; margin:0; padding:0; width:100%; text-align:center; padding-top:20px; font-size:40px">CLOTHE ME UP !</h1>
      </div>
        <h2 style="width:100%; text-align:center; margin-bottom:10px ; font-size: 25px">Bienvenue ${firstname} !</h2>
        <h2 style="width:100%; text-align:center ; margin-bottom:10px">Pour finaliser votre inscription, merci de cliquer sur le lien ci dessous (valable une heure) :</h2>
         <h2 style="width:100%; text-align:center ; margin-bottom:25px"><a href=${verifAddress}> Confirmer mon email </a></h2>
         <h2 style="width:100%; text-align:center">À tout de suite sur Clothe me up !</h2>
      </body>
      `
    }
    return mailOptions
}

// Route Signup

router.post('/signup', async (req, res) => {

    const { firstname, name, email, password, mobile_phone } = req.body

    try{

    if (!checkBody(req.body, ['firstname', 'name', 'email', 'password', 'mobile_phone'])) {
        res.json({
            result: false,
            error: 'Informations manquantes !'
        })
        return
    }
    else {
        const data = await User.findOne({ email })
        if (data) {
            res.json({
                result: false,
                error: 'Utilisateur déjà enregistré !'
            })
            return
        }
        else {

            const hash = bcrypt.hashSync(password, 10)
            const token = uid2(32)

            const newUser = new User({
                firstname,
                name,
                email,
                password: hash,
                mobile_phone,
                inscription_date: new Date(),
                is_verified: false,
                token,
            })
            const data = await newUser.save()

            const jwtToken = jwt.sign({
                token: data.token,
            }, secretToken, { expiresIn: '1h' })

            await emailTransporter.sendMail(checkMail(jwtToken, email, firstname))

            res.json({ result: true })
        }
    }
    }catch(error){res.json({error})}
})

// Route de vérification de l'email

router.put('/verification', async (req, res) => {
    try {
        const { email, jwtToken, articlesNotLinked } = req.body
        const decryptedToken = jwt.verify(jwtToken, secretToken)

        if (!decryptedToken) {

            const data = await User.findOne({ email })

            const newJwtToken = jwt.sign({
                token: data.token,
            }, secretToken, { expiresIn: '1h' })

            await emailTransporter.sendMail(checkMail(newJwtToken, email, data.firstname))

            res.json({ result: false, error: "La validité du lien a expiré. Un nouveau mail de confirmation vous a été envoyé." })
        }
        else {
            const data = await User.findOne({ token: decryptedToken.token })

            data.is_verified = true


            await data.save()

            const jwtToken = jwt.sign({
                token: data.token,
            }, secretToken, { expiresIn: '3h' })

            // Ajout d'articles présents dans le panier et non enregistrés
            if (articlesNotLinked.length > 0) {
                data.cart_articles = [...data.cart_articles, ...articlesNotLinked]
            }

            // Vérif dispo articles du panier
            for (let article of data.cart_articles) {
                const answer = await CartArticle.findOne({_id : article})

                if (answer == null) { data.cart_articles = data.cart_articles.filter(e => e !== article) }
            }
    
            const newData = await data.save()
            await newData.populate('cart_articles')

            res.json({ result: true, token: jwtToken, firstname: newData.firstname, is_admin: newData.is_admin, cart_articles: newData.cart_articles, addresses : newData.addresses })

        }
    }
    catch (error) {
        const { email } = req.body
        const data = await User.findOne({ email })

        if (!data) {
            res.json({ result: false, error: "no data" })
        }
        else {
            const newJwtToken = jwt.sign({
                token: data.token,
            }, secretToken, { expiresIn: '1h' })

            await emailTransporter.sendMail(checkMail(newJwtToken, email, data.firstname))

            res.json({ result: false, error: "La validité du lien a expiré. Un nouveau mail de confirmation vous a été envoyé." })
        }
    }
})


// Route signin

router.put('/signin', async (req, res) => {
    const { email, password, articlesNotLinked } = req.body

    try{
        if (!checkBody(req.body, ['email', 'password'])) {
            res.json({
                result: false,
                error: 'Informations manquantes.'
            })
        }
        else {
            const data = await User.findOne({ email })
            if (data && bcrypt.compareSync(password, data.password) && data.is_verified) {
                const token = uid2(32)
                data.token = token
    
                // Ajout d'articles présents dans le panier et non enregistrés
    
                if (articlesNotLinked.length > 0) {
                    data.cart_articles = [...data.cart_articles, ...articlesNotLinked]
                }
    
                // Vérif dispo articles du panier
                for (let article of data.cart_articles) {
                    const answer = await CartArticle.findOne({_id : article})
    
    
                    if (answer == null) { data.cart_articles = data.cart_articles.filter(e => e !== article) }
                }
    
                const newData = await data.save()
                await newData.populate('cart_articles')
    
                //Renvoi des infos utiles au réducer
    
                const jwtToken = jwt.sign({
                    token,
                }, secretToken, { expiresIn: '3h' })
    
                res.json({ result: true, token: jwtToken, firstname: newData.firstname, is_admin: newData.is_admin, cart_articles: newData.cart_articles, addresses : newData.addresses})
            }
            // Si l'adresse mail n'a pas été vérifiée
            else if (data && bcrypt.compareSync(password, data.password)) {
    
                const newJwtToken = jwt.sign({
                    token: data.token,
                }, secretToken, { expiresIn: '1h' })
    
                await emailTransporter.sendMail(checkMail(newJwtToken, email, data.firstname))
    
                res.json({
                    result: false,
                    error: 'Adresse mail non confirmée ! Un nouvel email de vérification vous a été envoyé.'
                })
            }
            else {
                res.json({
                    result: false,
                    error: 'Email ou mot de passe incorrect.'
                })
            }
    
        }
    }catch(error){res.json({error})}
})


// Routes Connexion Google


// 1ère route pour avoir une url de connexion google

router.post('/google', async (req, res) => {
    try{
        res.header('Access-Control-Allow-Origin', `${frontAddress}`)

        // Pour autoriser l'utilisation de http ou lieu de https
        res.header('Referrer-Policy', 'no-referrer-when-downgrade')
    
        const redirectUrl = `${backAddress}/users/google/auth`
    
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
    }catch(error){res.json({error})}
})


// redirectUrl : Route pour obtenir les infos du user

router.get('/google/auth', async (req, res) => {

    //Récupération du code fourni par google
    const { code } = req.query

    try {
        const redirectUrl = `${backAddress}/users/google/auth`
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
        console.log(user)

        //Récupération des infos du user grâce à son access_token
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`,
            {
                headers: {
                    Authorization: `Bearer ${user.access_token}`
                }
            }
        )
        const data = await response.json()
        console.log('data', data)

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

        res.redirect(`${frontAddress}/home/${jwtToken}`)


    } catch (error) { console.log(error) }
})

// Route pour obtenir toutes les infos du user dans bdd en retour de connexion google

router.put('/googleUserInfos', async (req, res) => {
    const { jwtToken, articlesNotLinked } = req.body

    try {
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        const data = await User.findOne({ token: decryptedToken.token })

        // Ajout d'articles présents dans le panier et non enregistrés
        if (articlesNotLinked.length > 0) {
            data.cart_articles = [...data.cart_articles, ...articlesNotLinked]
        }

        // Vérif dispo articles du panier
        for (let article of data.cart_articles) {
            const answer = await CartArticle.findOne({_id : article})

            if (answer == null) { data.cart_articles = data.cart_articles.filter(e => e !== article) }
        }

        const newData = await data.save()
        await newData.populate('cart_articles')

        res.json({ result: true, token: jwtToken, firstname: newData.firstname, is_admin: newData.is_admin, cart_articles: newData.cart_articles, addresses : newData.addresses })

    } catch (error) { res.json({ result: false, error }) }
})

module.exports = router;
