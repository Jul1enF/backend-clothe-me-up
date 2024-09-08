var express = require('express')
var router = express.Router()
const moment = require('moment')
let xmlParser = require('xml2json')
var convert = require('xml-js');
const uid2 = require('uid2')

router.post('/pickups', async (req, res) => {

    try {
    const { address, city, post_code } = req.body.chosenAdresse
    
    const cityWithoutSpaces = city.replace(/ /g, "-")
    const shippingDate = moment(new Date()).format("DD/MM/YYYY")

    const colissimoId = process.env.COLISSIMO_ID
    const colissimoPassword = process.env.COLISSIMO_PASSWORD

    const response = await fetch('https://ws.colissimo.fr/pointretrait-ws-cxf/PointRetraitServiceWS/2.0?wsdl', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml'
        },
        body: `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:v2="http://v2.pointretrait.geopost.com/">
        <soapenv:Header/>
        <soapenv:Body>
        <v2:findRDVPointRetraitAcheminement>
            <accountNumber>${colissimoId}</accountNumber>
            <password>${colissimoPassword}</password>
            <address>${address}</address>
            <zipCode>${post_code}</zipCode>
            <city>${cityWithoutSpaces}</city>
            <countryCode>FR</countryCode>
            <weight>1</weight>
            <shippingDate>${shippingDate}</shippingDate>
            <filterRelay>1</filterRelay>
        </v2:findRDVPointRetraitAcheminement> 
        </soapenv:Body>
        </soapenv:Envelope>`
    })

    const soapText = await response.text()

    const jsonText = await convert.xml2json(soapText, { compact: true, spaces: 1, nativeType: true })

    const jsonData = JSON.parse(jsonText)

    let pickups = []

    jsonData["soap:Envelope"]["soap:Body"]["ns2:findRDVPointRetraitAcheminementResponse"]["return"]["listePointRetraitAcheminement"].map((e,i)=>{
        if (i<15){
            const id = uid2(16)

            pickups.push({
                title : e.nom._text,
                address : e.adresse1._text,
                post_code : e.codePostal._text,
                city : e.localite._text,
                latitude : e.coordGeolocalisationLatitude._text,
                longitude : e.coordGeolocalisationLongitude._text,
                openingMonday : e.horairesOuvertureLundi._text,
                openingTuesday : e.horairesOuvertureMardi._text,
                openingWenesday : e.horairesOuvertureMercredi._text,
                openingThursday : e.horairesOuvertureJeudi._text,
                openingFriday : e.horairesOuvertureVendredi._text,
                openingSaturday : e.horairesOuvertureSamedi._text,
                openingSunday : e.horairesOuvertureDimanche._text,
                id,
            })
        }else{return}
    })

    res.json({ result : true, pickups })

    } catch (err) { res.json({ result: false, err }) }


})


module.exports = router


// EXEMPLE DE RÉPONSE EN JSON DE COLISSIMO


// {
//     "soap:Envelope": {
//         "_attributes": {
//             "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/"
//         },
//         "soap:Body": {
//             "ns2:findRDVPointRetraitAcheminementResponse": {
//                 "_attributes": {
//                     "xmlns:ns2": "http://v2.pointretrait.geopost.com/"
//                 },
//                 "return": {
//                     "errorCode": {
//                         "_text": "0"
//                     },
//                     "errorMessage": {
//                         "_text": "Code retour OK"
//                     },
//                     "listePointRetraitAcheminement": [
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "26 RUE BANES"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.807622"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.242110"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "627"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "10:00-12:00 12:00-20:15"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "10:00-12:00 12:00-20:15"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "10:00-12:00 12:00-20:15"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "10:00-12:00 12:00-19:15"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "10:00-12:00 12:00-20:15"
//                             },
//                             "identifiant": {
//                                 "_text": "107782"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "BOULANGERIE BANES"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "26 RUE BANES"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.807634"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.242037"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "630"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "10:30-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "10:30-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "10:30-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "10:30-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "10:30-12:00 12:00-19:00"
//                             },
//                             "identifiant": {
//                                 "_text": "828625"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "POINT INFORMATIQUE REPARATION"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "13 RUE DU PERE BROTTIER"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.806014"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.245765"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "640"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "10:00-18:00 00:00-00:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "10:00-18:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "10:00-18:00 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "10:00-13:00 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "10:00-18:00 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "486066"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "PAUSE VERNIS"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "1 B RUE ALEXANDRE GUILMANT"
//                             },
//                             "adresse2": {
//                                 "_text": "SUR LE PARVIS DE LA GARE"
//                             },
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.815078"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.240905"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "669"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "00:01-12:00 12:00-23:59"
//                             },
//                             "identifiant": {
//                                 "_text": "007545"
//                             },
//                             "indiceDeLocalisation": {
//                                 "_text": "SUR LE PARVIS DE LA GARE"
//                             },
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "CONSIGNE PICKUP GARE MEUDON"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "16000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "47 AVENUE ADOLPHE SCHNEIDER"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.806772"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.254269"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "687"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "10:00-12:00 12:00-21:00"
//                             },
//                             "identifiant": {
//                                 "_text": "557515"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "SLK MARKET"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R21"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "161 AVENUE DE VERDUN"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.818262"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.246217"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "764"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:00-12:00 12:00-20:00"
//                             },
//                             "identifiant": {
//                                 "_text": "109703"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "CARREFOUR CITY"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "10 AVENUE LOUVOIS"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.807359"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.239907"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "769"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "09:00-13:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:30-21:00 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "362762"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "CONSIGNE PICKUP FRANPRIX MEUDON"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "17 RUE DE LA REPUBLIQUE"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.809593"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.236275"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "905"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:30-12:00 14:00-18:30"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:30-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:30-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:30-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "09:00-12:30 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:30-12:30 14:00-18:30"
//                             },
//                             "identifiant": {
//                                 "_text": "920480"
//                             },
//                             "indiceDeLocalisation": {},
//                             "listeConges": [
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "2"
//                                     }
//                                 },
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "1"
//                                     }
//                                 }
//                             ],
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "BUREAU DE POSTE MEUDON REPUBLIQUE BP"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "26/08"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "30/11"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "30000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "BPR"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R01"
//                             },
//                             "distributionSort": {},
//                             "lotAcheminement": {},
//                             "versionPlanTri": {}
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "true"
//                             },
//                             "adresse1": {
//                                 "_text": "23 ALLEE SAINTE LUCIE"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92130"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.820193"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.25158"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "993"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "09:00-19:00 00:00-00:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "09:00-19:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "09:00-19:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "09:00-19:00 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:45-12:45 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "09:00-19:00 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "921140"
//                             },
//                             "indiceDeLocalisation": {},
//                             "listeConges": [
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "2"
//                                     }
//                                 },
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "1"
//                                     }
//                                 }
//                             ],
//                             "localite": {
//                                 "_text": "ISSY LES MOULINEAUX"
//                             },
//                             "nom": {
//                                 "_text": "BUREAU DE POSTE ISSY LES MOULINEAUX OUEST"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "26/08"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "30/11"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "30000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "BPR"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R01"
//                             },
//                             "distributionSort": {},
//                             "lotAcheminement": {},
//                             "versionPlanTri": {}
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "1 RUE ARISTIDE BRIAND  CENTRE COMMERCI"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92130"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.820305"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.251658"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1007"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "08:30-12:30 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "362815"
//                             },
//                             "indiceDeLocalisation": {
//                                 "_text": "INTERIEUR"
//                             },
//                             "localite": {
//                                 "_text": "ISSY LES MOULINEAUX"
//                             },
//                             "nom": {
//                                 "_text": "CONSIGNE AUCHAN HYPER ISSY LES MNX"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "16000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "94T01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "RGS0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "3 ALLEE SAINTE LUCIE"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92130"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.820582"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.251166"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1029"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "08:30-12:30 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:30-21:30 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "363895"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "ISSY LES MOULINEAUX"
//                             },
//                             "nom": {
//                                 "_text": "CONSIGNE AUCHAN HYPER ISSY 3MOULINS"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "16000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "94T01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "RGS0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "54 RUE D EREVAN"
//                             },
//                             "adresse2": {
//                                 "_text": "CENTRE COMMERCIAL LES EPINETTES"
//                             },
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92130"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.817530"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.260635"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1124"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "09:00-12:00 14:30-19:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "09:00-12:00 14:30-19:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "09:00-12:00 14:30-19:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "09:00-12:00 14:30-19:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "09:00-12:00 14:30-19:00"
//                             },
//                             "identifiant": {
//                                 "_text": "828196"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "ISSY LES MOULINEAUX"
//                             },
//                             "nom": {
//                                 "_text": "PRESSING PLUS SILVA"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "94T01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "RGS0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "45 RUE D ARTHELON"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92190"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.803000"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.239090"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1163"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:30-12:00 12:00-16:15"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:30-12:00 12:00-15:15"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:30-12:00 12:00-16:15"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:30-12:00 12:00-16:15"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:30-12:00 12:00-15:15"
//                             },
//                             "identifiant": {
//                                 "_text": "998007"
//                             },
//                             "indiceDeLocalisation": {
//                                 "_text": "LES PAPILLONS BLANCS"
//                             },
//                             "localite": {
//                                 "_text": "MEUDON"
//                             },
//                             "nom": {
//                                 "_text": "UNAPEI 92"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R01"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "51 RUE CONDORCET"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.810946"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.265072"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1231"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "07:00-12:00 12:00-19:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "identifiant": {
//                                 "_text": "828619"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "LES TRADI D OR"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R21"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "38 RUE DE MEUDON"
//                             },
//                             "adresse2": {
//                                 "_text": "A L INTERIEUR DU SAS COTE CARRE PRO"
//                             },
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.802294"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.258658"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1278"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "06:00-12:00 12:00-22:00"
//                             },
//                             "identifiant": {
//                                 "_text": "096949"
//                             },
//                             "indiceDeLocalisation": {
//                                 "_text": "A L INTERIEUR DU SAS COTE CARRE PRO"
//                             },
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "CONSIGNE PICKUP LA POSTE CLAMART C "
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "16000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R21"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "true"
//                             },
//                             "adresse1": {
//                                 "_text": "38 RUE DE MEUDON"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.802252"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.258733"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1285"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "09:00-12:30 14:30-18:30"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "09:00-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "09:00-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "09:00-12:30 14:00-18:30"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "09:00-12:30 00:00-00:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "09:00-12:30 14:00-18:30"
//                             },
//                             "identifiant": {
//                                 "_text": "920230"
//                             },
//                             "indiceDeLocalisation": {},
//                             "listeConges": [
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-11T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "2"
//                                     }
//                                 },
//                                 {
//                                     "calendarDeDebut": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "calendarDeFin": {
//                                         "_text": "2024-11-01T00:00:00+01:00"
//                                     },
//                                     "numero": {
//                                         "_text": "1"
//                                     }
//                                 }
//                             ],
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "BUREAU DE POSTE CLAMART CENTRE"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "26/08"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "30/11"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "30000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "BPR"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R01"
//                             },
//                             "distributionSort": {},
//                             "lotAcheminement": {},
//                             "versionPlanTri": {}
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "24 RUE PAUL VAILLANT COUTURIER"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.802761"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.262882"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1447"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "09:30-13:00 14:00-19:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "09:30-13:00 14:00-19:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "09:30-13:00 14:00-19:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "09:30-13:00 14:00-19:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "09:30-13:00 13:00-19:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "09:30-13:00 14:00-19:00"
//                             },
//                             "identifiant": {
//                                 "_text": "484522"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "MR BRICOLAGE"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R21"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "69 ALLEE GEORGE ASKINAZI"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92100"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.823902"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.240393"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1492"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "09:00-13:00 14:00-18:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "09:00-13:00 14:00-18:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "09:00-13:00 14:00-18:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "09:00-13:00 14:00-18:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "09:30-13:00 14:00-18:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "09:00-13:00 14:00-18:00"
//                             },
//                             "identifiant": {
//                                 "_text": "907026"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "BOULOGNE BILLANCOURT"
//                             },
//                             "nom": {
//                                 "_text": "O CLEANER"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "96T00"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "DEF1"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "4 RUE MARCEL BONTEMPS"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92100"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.825190"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.243087"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1566"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "08:00-12:00 12:15-20:30"
//                             },
//                             "identifiant": {
//                                 "_text": "826447"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "BOULOGNE BILLANCOURT"
//                             },
//                             "nom": {
//                                 "_text": "FRANPRIX"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "96T00"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "DEF1"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         },
//                         {
//                             "accesPersonneMobiliteReduite": {
//                                 "_text": "false"
//                             },
//                             "adresse1": {
//                                 "_text": "20 AVENUE JEAN JAURES"
//                             },
//                             "adresse2": {},
//                             "adresse3": {},
//                             "codePostal": {
//                                 "_text": "92140"
//                             },
//                             "congesPartiel": {
//                                 "_text": "false"
//                             },
//                             "congesTotal": {
//                                 "_text": "false"
//                             },
//                             "coordGeolocalisationLatitude": {
//                                 "_text": "48.801300"
//                             },
//                             "coordGeolocalisationLongitude": {
//                                 "_text": "2.264060"
//                             },
//                             "distanceEnMetre": {
//                                 "_text": "1622"
//                             },
//                             "horairesOuvertureDimanche": {
//                                 "_text": "00:00-00:00 00:00-00:00"
//                             },
//                             "horairesOuvertureJeudi": {
//                                 "_text": "10:00-13:00 15:00-19:00"
//                             },
//                             "horairesOuvertureLundi": {
//                                 "_text": "00:00-00:00 13:00-19:00"
//                             },
//                             "horairesOuvertureMardi": {
//                                 "_text": "10:00-13:00 15:00-19:00"
//                             },
//                             "horairesOuvertureMercredi": {
//                                 "_text": "10:00-13:00 15:00-19:00"
//                             },
//                             "horairesOuvertureSamedi": {
//                                 "_text": "10:00-13:00 15:00-19:00"
//                             },
//                             "horairesOuvertureVendredi": {
//                                 "_text": "10:00-13:00 15:00-19:00"
//                             },
//                             "identifiant": {
//                                 "_text": "987402"
//                             },
//                             "indiceDeLocalisation": {},
//                             "localite": {
//                                 "_text": "CLAMART"
//                             },
//                             "nom": {
//                                 "_text": "CHRISERVICE"
//                             },
//                             "periodeActiviteHoraireDeb": {
//                                 "_text": "01/01"
//                             },
//                             "periodeActiviteHoraireFin": {
//                                 "_text": "31/12"
//                             },
//                             "poidsMaxi": {
//                                 "_text": "20000"
//                             },
//                             "typeDePoint": {
//                                 "_text": "A2P"
//                             },
//                             "codePays": {
//                                 "_text": "FR"
//                             },
//                             "langue": {
//                                 "_text": "FR"
//                             },
//                             "libellePays": {
//                                 "_text": "FRANCE"
//                             },
//                             "loanOfHandlingTool": {
//                                 "_text": "false"
//                             },
//                             "parking": {
//                                 "_text": "false"
//                             },
//                             "reseau": {
//                                 "_text": "R03"
//                             },
//                             "distributionSort": {
//                                 "_text": "78R21"
//                             },
//                             "lotAcheminement": {
//                                 "_text": "VER0"
//                             },
//                             "versionPlanTri": {
//                                 "_text": "3"
//                             }
//                         }
//                     ],
//                         "qualiteReponse": {
//                         "_text": "2"
//                     },
//                     "wsRequestId": {
//                         "_text": "6ad98a9919dd9d483a0797b7e844b38c88b5ff513db7b5ed5f99b2ac22f71ceb"
//                     },
//                     "rdv": {
//                         "_text": "false"
//                     }
//                 }
//             }
//         }
//     }
// }