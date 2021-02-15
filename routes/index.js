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
// require('dotenv').config();
var serviceAccount = require("./serviceAccountKey.json");
const { PDFDocument } = require('pdf-lib');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://d-room-space-firebase.firebaseio.com",
  storageBucket: 'gs://d-room-space-firebase.appspot.com'
});
// var bucket = admin.storage().bucket();

router.use('/doc', docRoute);

router.get('/', function(req, res, next) {
  // res.json({});
  res.send('Hello World!')
});

router.get('/getFields', (req, res, next) => {
  var pdfParser = hummus.createReader('./public/upload/Agreement.pdf'); // the path to the pdf file
  var digitalForm = new PDFDigitalForm(pdfParser);
  // save form values into fields.json
  if (digitalForm.hasForm()) {
    fs.writeFileSync("./public/upload/fields1.json", JSON.stringify(digitalForm.fields, null, 4));
  } else {
    console.log('Failed')
  }

})

router.post('/sendAgreement1', (req, res) => {
  var pdfParser = hummus.createReader('./public/upload/Agreement.pdf'); // the path to the pdf file
  var digitalForm = new PDFDigitalForm(pdfParser);
  var data = {
    "INITIAL" : "INITIAL",
    "MADE_DATE": "MADE_DATE",
    "APARTMENT": "APARTMENT",
    "YEARS": "YEARS",
    "FLOOR": "FLOOR",
    "MONTHS": "MONTHS",
    "DAYS": "DAYS",
    "BEGIN_DATE": "BEGIN_DATE",
    "MONTHLY_RENT": "MONTHLY_RENT",
    "TOTAL_RENT": "TOTAL_RENT"
  };
  var storageRef = admin.storage().bucket();
  let date_ob = Date.now();

  pdfFiller.fillFormWithFlatten('./public/upload/Agreement.pdf', './public/upload/' + date_ob + '.pdf', data, true, function (err) {
      res.send('-====>>')
      
      // storageRef.upload('./public/upload/' + date_ob + '.pdf')
      //   .then((data) => {
      //     res.send({
      //       status: true,
      //       data: data[0].metadata
      //     })
      //   });      
    });
})


router.post('/sendAgreement', (req, res) => {
  run(req, res);
})

async function run(req, res) {
  const formBytes = fs.readFileSync('./public/upload/Agreement.pdf')
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
  fs.writeFileSync('./public/upload/' + date_ob + '.pdf', await pdfDoc.save());

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
}


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
