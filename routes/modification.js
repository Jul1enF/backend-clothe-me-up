var express = require('express')
var router = express.Router()
const User = require("../models/users")
const bcrypt = require('bcrypt')
const uid2 = require('uid2')

const mongoose =require('mongoose')
const connectionString = process.env.CONNECTION_STRING

const nodemailer = require("nodemailer")
const checkEmail = process.env.CHECK_EMAIL
const passwordCheckMail = process.env.PASSWORD_CHECK_EMAIL

const frontAddress = process.env.FRONT_ADDRESS

const jwt = require('jsonwebtoken')
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


// Route pour ajouter une nouvelle adresse à un document users

router.put('/addAddress', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    const { title, name, firstname, address, additionals_intels, city, post_code, phone, jwtToken } = req.body

    try {
        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let data = await User.findOne({ token: decryptedToken.token })

        if (additionals_intels) {
            data.addresses.push({
                title, name, firstname, address, additionals_intels, city, post_code, phone,
            })
        } else {
            data.addresses.push({
                title, name, firstname, address, city, post_code, phone,
            })
        }

        const user = await data.save()

        const i = user.addresses.length - 1

        res.json({ result: true, address: user.addresses[i] })

    } catch (err) { res.json({ err }) }
})



// Route pour supprimer une adresse d'un document users

router.delete('/deleteAddress/:_id/:jwtToken', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { _id, jwtToken } = req.params
        const decryptedToken = jwt.verify(jwtToken, secretToken)

        let userData = await User.findOne({ token: decryptedToken.token })

        userData.addresses = userData.addresses.filter(e=>e._id.toString()!==_id)

        await userData.save()

        res.json({result : true})

    } catch (err) { res.json({ err }) }
})



// Route pour modifier le prénom d'un document users

router.put('/newFirstname', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { jwtToken, newFirstname } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let userData = await User.findOne({ token: decryptedToken.token })

        userData.firstname = newFirstname
        await userData.save()

        res.json({ result: true })

    } catch (err) { res.json({ err }) }
})



// Route pour modifier le nom d'un document users

router.put('/newName', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { jwtToken, newName } = req.body

        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let userData = await User.findOne({ token: decryptedToken.token })

        userData.name = newName
        await userData.save()

        res.json({ result: true })

    } catch (err) { res.json({ err }) }
})



// Route pour modifier le téléphone d'un document users

router.put('/newPhone', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { jwtToken, newPhone } = req.body

        const phone = Number(newPhone)

        const decryptedToken = jwt.verify(jwtToken, secretToken)
        let userData = await User.findOne({ token: decryptedToken.token })

        userData.mobile_phone = phone
        await userData.save()

        res.json({ result: true })

    } catch (err) { res.json({ err }) }
})



// Route pour modifier le mot de passe d'un document users

router.put('/newPassword', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { jwtToken, newPassword, oldPassword } = req.body

        const hash = bcrypt.hashSync(newPassword, 10)
        const decryptedToken = jwt.verify(jwtToken, secretToken)

        let userData = await User.findOne({ token: decryptedToken.token })

        if (!userData.password && userData.is_verified) {
            userData.password = hash

            await userData.save()

            return res.json({ result: true })
        }
        else if (bcrypt.compareSync(oldPassword, userData.password)) {
            userData.password = hash

            await userData.save()

            return res.json({ result: true })
        }
        else {
            return res.json({ result: false, error: "Mot de passe incorrect !" })
        }

    } catch (err) { res.json({ err }) }
})




// Route pour modifier l'email avec envoi mail de confirmation

router.put('/newEmail', async (req, res) => {
    await mongoose.connect(connectionString, { connectTimeoutMS: 2000 })

    try {
        const { actualJwtToken, newEmail } = req.body
        const token = uid2(32)

        const data = await User.findOne({ email: newEmail })
        if (data) {
            res.json({
                result: false,
                error: 'Adresse email déjà enregistrée !'
            })
            return
        }

        const decryptedToken = jwt.verify(actualJwtToken, secretToken)

        let userData = await User.findOne({ token: decryptedToken.token })

        userData.email = newEmail
        userData.is_verified = false
        userData.token = token

        await userData.save()

        const jwtToken = jwt.sign({
            token,
        }, secretToken, { expiresIn: '1h' })

        const mailOptions = {
            from: checkEmail,
            to: newEmail,
            subject: 'Vérification de votre email',
            html: `<body>
          <div style="width: 100%;
        height: 100px; background-color: rgb(13,1,102); margin:0; padding:0; margin-bottom:20px">
            <h1 style="color:white; margin:0; padding:0; width:100%; text-align:center; padding-top:20px; font-size:40px">CLOTHE ME UP !</h1>
          </div>
            <h2 style="width:100%; text-align:center; margin-bottom:10px ; font-size: 25px">Bienvenue ${userData.firstname} !</h2>
            <h2 style="width:100%; text-align:center ; margin-bottom:10px">Pour finaliser votre inscription, merci de cliquer sur le lien ci dessous (valable une heure) :</h2>
             <h2 style="width:100%; text-align:center ; margin-bottom:25px"><a href="${frontAddress}/verification/${jwtToken}/${newEmail}"> Confirmer mon email </a></h2>
             <h2 style="width:100%; text-align:center">À tout de suite sur Clothe me up !</h2>
          </body>
          `
        }

        await emailTransporter.sendMail(mailOptions)

        res.json({ result: true })

    } catch (err) { res.json({ err }) }
})

module.exports = router