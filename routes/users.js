var express = require('express');
var router = express.Router();

var User = require('../models/users')
const { checkBody } = require('../modules/checkBody')
const uid2 = require('uid2')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const nodemailer = require("nodemailer")

const checkEmail = process.env.CHECK_EMAIL
const passwordCheckMail = process.env.PASSWORD_CHECK_EMAIL
const frontAddress = process.env.FRONT_ADDRESS
const secretToken = process.env.SECRET_TOKEN

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
})

// Route de vérification de l'email

router.put('/verification', async (req, res) => {
    try {
        const { email, jwtToken } = req.body
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
            }, secretToken, { expiresIn: '2h' })

            res.json({ result: true, token: jwtToken, firstname: data.firstname })
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
    const { email, password } = req.body

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

            data.token=token
            await data.save()

            const jwtToken = jwt.sign({
                token,
            }, secretToken, { expiresIn: '2h' })

            res.json({ result: true, token: jwtToken, firstname: data.firstname })
        }
        // Si l'adresse mail n'a pas été vérifiée
        else if (data && bcrypt.compareSync(password, data.password)){

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

})


module.exports = router;

module.exports = router;
