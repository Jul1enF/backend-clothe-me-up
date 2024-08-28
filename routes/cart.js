var express = require('express');
var router = express.Router();

var User = require('../models/users')
const CartPant = require('../models/cart_pants')
const CartTop = require("../models/cart_tops")
const { checkBody } = require('../modules/checkBody')
const uid2 = require('uid2')
const jwt = require('jsonwebtoken')

const secretToken = process.env.SECRET_TOKEN

const frontAddress = process.env.FRONT_ADDRESS
const backAddress = process.env.BACK_ADDRESS

const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET
const { OAuth2Client } = require('google-auth-library')

router.put('/checkArticles', async (req, res) => {
    let { cart_pants, cart_tops, jwtToken, pantsNotLinked, topsNotLinked } = req.body

    try {
        // Vérif dispos articles si utilisateur non connecté
        if (!jwtToken) {
            let change = false
            for (let pant of cart_pants) {
                const answer = await CartPant.findOne({ _id: pant._id })

                if (answer == null) {
                    cart_pants = cart_pants.filter(e => e._id !== pant._id)
                    pantsNotLinked = pantsNotLinked.filter(e => e !== pant._id)
                    change = true
                }
            }

            for (let top of cart_tops) {
                const answer = await CartTop.findById({ _id: top._id })

                if (answer == null) {
                    cart_tops = cart_tops.filter(e => e._id !== top._id)
                    topsNotLinked = topsNotLinked.filter(e => e !== top._id)
                    change = true
                }
            }
            res.json({ result: true, change, cart_pants, cart_tops, pantsNotLinked, topsNotLinked })
        }
        // Vérif dispos articles si utilisateur connecté
        else {
            const decryptedToken = jwt.verify(jwtToken, secretToken)
            const data = await User.findOne({ token: decryptedToken.token })

            if (!data) { res.json({ result: false, error: "user not found" }) }
            else {
                let change = false

                for (let pant of data.cart_pants) {
                    const answer = await CartPant.findOne({ _id: pant })


                    if (answer == null) {
                        data.cart_pants = data.cart_pants.filter(e => e !== pant)
                        change = true
                    }
                }

                for (let top of data.cart_tops) {
                    const answer = await CartTop.findOne({ _id: top })


                    if (answer == null) {
                        data.cart_tops = data.cart_tops.filter(e => e !== top)
                        change = true
                    }
                }

                if (change) {
                    const newData = await data.save()
                    await newData.populate('cart_pants')
                    await newData.populate('cart_tops')

                    res.json({result : true, change, cart_pants : newData.cart_pants, cart_tops : newData.cart_tops })
                } else {
                    res.json({result : true, change})
                }
            }
        }

    } catch (error) {
        res.json({ result: false, error })
    }

})


// Route pour supprimer du panier un article

router.delete('/deleteArticle/:_id/:category/:jwtToken', async (req, res)=>{
let {_id, jwtToken, category}=req.params
try{
if (category == "tops"){
    const data = await CartTop.deleteOne({_id})
    res.json({result:true})
}
else{
    const data = await CartPant.deleteOne({_id})
    res.json({result:true})
}
if(jwtToken !=="none")
{
    const decryptedToken = jwt.verify(jwtToken, secretToken)
    const user = await User.findOne({token: decryptedToken.token})

    category === "tops" ? user.cart_tops=user.cart_tops.filter(e=>e.toString()!==_id) : user.cart_pants=user.cart_pants.filter(e=>e.toString()!==_id)

    await user.save()
}

}catch(error){res.json({error})}
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


// redirectUrl : Route pour obtenir les infos du user

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
        }, secretToken, { expiresIn: '2h' })

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


    } catch (error) { console.log(error) }
})

router.put('/googleUserInfos', async (req, res) => {
    const { jwtToken, pantsNotLinked, topsNotLinked } = req.body

    try {
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        const data = await User.findOne({ token: decryptedToken.token })

        // Ajout d'articles présents dans le panier et non enregistrés
        if (pantsNotLinked.length > 0) {
            data.cart_pants = [...data.cart_pants, ...pantsNotLinked]
        }
        if (topsNotLinked.length > 0) {
            data.cart_tops = [...data.cart_tops, ...topsNotLinked]
        }

        // Vérif dispo articles du panier

        let change = false

        for (let pant of data.cart_pants) {
            const answer = await CartPant.findOne({_id : pant})

            if (answer == null) { data.cart_pants = data.cart_pants.filter(e => e !== pant) 
                change=true
            }
        }

        for (let top of data.cart_tops) {
            const answer = await CartTop.findOne({_id : top})

            if (answer == null) { data.cart_tops = data.cart_tops.filter(e => e !== top)
                change=true
             }
        }

        const newData = await data.save()
        await newData.populate('cart_pants')
        await newData.populate('cart_tops')

        res.json({ result: true, token: jwtToken, firstname: newData.firstname, is_admin: newData.is_admin, cart_pants: newData.cart_pants, cart_tops: newData.cart_tops, change })

    } catch (error) { res.json({ result: false, error }) }
})

module.exports = router;