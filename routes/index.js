var express = require('express');
const docRoute = require('./doc')
var docController = require('./docController');

var router = express.Router();
var pdfFiller = require('pdffiller');
 
var sourcePDF = "upload.pdf";
var destinationPDF = "upload_complete.pdf";
var hummus = require('hummus'),
PDFDigitalForm = require('./pdf-digital-form');

let fs = require("fs");
var util = require('util');
const pdf2base64 = require('pdf-to-base64');
var admin = require("firebase-admin");
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
var serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://d-room-space-firebase.firebaseio.com",
  storageBucket: 'gs://d-room-space-firebase.appspot.com'
});

router.use('/doc', docRoute);

router.get('/', function(req, res, next) {
  res.send('Hello World!')
});


router.post('/sendAgreement', (req, res) => {
  var pdfParser = hummus.createReader('./public/upload/Agreement.pdf'); // the path to the pdf file
  var data = {
    "DAYS" : req.body.DAYS,
    "MONTHS": req.body.MONTHS,
    "STARTING DATE": req.body.STARTING_DATE,
    "RENT AMOUNT": req.body.RENT_AMOUNT,
    "ROOSTEASY  [X]": req.body.ROOSTEASY,
    "INITIAL": req.body.INITIAL,
    "DATE" : req.body.DATE
  };
  var storageRef = admin.storage().bucket();
  let date_ob = Date.now();

  pdfFiller.fillFormWithFlatten('./public/upload/Agreement.pdf', './public/upload/' + date_ob + '.pdf', data, true, (err) => {
    if (err) throw err;
    storageRef.upload('./public/upload/' + date_ob + '.pdf')
      .then(data => {
        res.send({
          status: true,
          data: data[0].metadata
        })
      })
      .catch((error) => {
        console.log(error); 
      })
  });
})

router.post('/getPdf2Base64', (req, res) => {
  pdf2base64(req.body.pdfURL)
  .then(
    (response) => {
      res.send({
        status: true,
        data: response
      })
    }
  )
  .catch(
    (error) => {
      console.log(error); 
    }
  )
})

module.exports = router;
