/* eslint-disable promise/always-return */
var express = require('express');
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
// require('dotenv').config();
var serviceAccount = require("./serviceAccountKey.json");
var bodyParser = require('body-parser')
const path = require('path');
const os = require('os');
const { PDFDocument } = require('pdf-lib');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://d-room-space-firebase.firebaseio.com",
  storageBucket: 'gs://d-room-space-firebase.appspot.com'
});

router.post('/sendAgreement', (req, res) => {
  run(req, res);
})

async function run(req, res) {
  const formBytes = fs.readFileSync('./public1/upload/Agreement.pdf')
  const pdfDoc = await PDFDocument.load(formBytes)
  const form = pdfDoc.getForm()

  const dayField = form.getTextField('DAYS');
  const monthField = form.getTextField('MONTHS');
  const yearField = form.getTextField('YEARS');
  const startingField = form.getTextField('BEGIN_DATE');
  const monthlyRentField = form.getTextField('MONTHLY_RENT');
  const sumRentField = form.getTextField('TOTAL_RENT');
  const initialField = form.getTextField('INITIAL');
  const dateField = form.getTextField('MADE_DATE');
  const apartmentField = form.getTextField('APARTMENT');
  const floorField = form.getTextField('FLOOR');

  dayField.setText(req.body.DAYS.toString());
  monthField.setText(req.body.MONTHS.toString());
  yearField.setText(req.body.YEARS.toString());
  startingField.setText(req.body.BEGIN_DATE);
  monthlyRentField.setText(req.body.MONTHLY_RENT);
  sumRentField.setText(req.body.TOTAL_RENT);
  initialField.setText(req.body.INITIAL);
  dateField.setText(req.body.MADE_DATE);
  apartmentField.setText(req.body.APARTMENT);
  floorField.setText(req.body.FLOOR);

  var storageRef = admin.storage().bucket();
  let date_ob = Date.now();
  fs.writeFileSync('./public1/upload/' + date_ob + '.pdf', await pdfDoc.save());

  storageRef.upload('./public1/upload/' + date_ob + '.pdf')
    .then(data => {
      res.send({
        status: true,
        data: data[0].metadata
      })
    })
    .catch((error) => {
      console.log(error); 
    })
}

router.post('/getPdf2Base64', (req, res) => {
  pdf2base64(req.body.pdfURL)
  .then(
    (response) => {
      console.log(response); 
      res.send({
        status: true,
        data: response
      })
    }
  )
  .catch(
    (error) => {
      console.log(error);
      res.send({
        status: false,
        data: req.body
      })
    }
  )
})


router.use('/hello', (req, res, next) => {
  res.send('Welcome to Firebase functions with Node Express!')
})

module.exports = router;
