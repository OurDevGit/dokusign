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
const fetch = require('node-fetch');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://d-room-space-firebase.firebaseio.com",
  storageBucket: 'gs://d-room-space-firebase.appspot.com'
});
// var bucket = admin.storage().bucket();

router.use('/doc', docRoute);

router.get('/', function (req, res, next) {
  // res.json({});
  res.send('Hello World!')
});

// router.get('/getFields', (req, res, next) => {
// var pdfParser = hummus.createReader(__dirname + '/upload/Agreement.pdf'); // the path to the pdf file
// var digitalForm = new PDFDigitalForm(pdfParser);
// // save form values into fields.json
// if (digitalForm.hasForm()) {

// fs.writeFileSync(__dirname + "/upload/fields.json", JSON.stringify(digitalForm.fields, null, 4));
// console.log(__dirname + '/upload/Agreement.pdf')
// var data = {
// "FL #" : "2",
// "APT " : "Manhatan City",
// "DAYS" : "3",
// "MONTHS": "0",
// "STARTING DATE": "Jan 5, 2020",
// "RENT AMOUNT": "$500",
// "ROOSTEASY [X]": "$100",
// "INITIAL": "start",
// "OWNER SIGNATURE": "Thomas",
// "RENTER SIGNATURE": "Gabriel",
// "DATE" : "Jan 1, 2020"
// };

// pdfFiller.fillFormWithFlatten(__dirname + '/upload/Agreement.pdf', __dirname + '/upload/2222.pdf', data, true, function(err) {
// res.send('Success!')
// // if (err) throw err;
// if (err) console.log(err);
// console.log("In callback (we're done).");
// });


// } else {
// console.log('Failed')
// }

// })

// router.post('/sendAgreement', (req, res) => {
// var pdfParser = hummus.createReader(__dirname + '/upload/Agreement.pdf'); // the path to the pdf file
// var digitalForm = new PDFDigitalForm(pdfParser);
// var data = {
// "DAYS" : req.body.DAYS,
// "MONTHS": req.body.MONTHS,
// "STARTING DATE": req.body.STARTING_DATE,
// "RENT AMOUNT": req.body.RENT_AMOUNT,
// "ROOSTEASY [X]": req.body.ROOSTEASY,
// "INITIAL": req.body.INITIAL,
// "DATE" : req.body.DATE
// };
// var storageRef = admin.storage().bucket();
// let date_ob = Date.now();

// pdfFiller.fillFormWithFlatten(__dirname + '/upload/Agreement.pdf', __dirname + '/upload/' + date_ob + '.pdf', data, true, function(err) {

// storageRef.upload(__dirname + '/upload/' + date_ob + '.pdf')
// .then((data) => {
// res.send({
// status: true,
// data: data[0].metadata
// })
// });
// });
// })


router.post('/sendAgreement', (req, res) => {
  var data = {
    "DAYS": req.body.DAYS,
    "MONTHS": req.body.MONTHS,
    "STARTING DATE": req.body.STARTING_DATE,
    "RENT AMOUNT": req.body.RENT_AMOUNT,
    "ROOSTEASY [X]": req.body.ROOSTEASY,
    "INITIAL": req.body.INITIAL,
    "DATE": req.body.DATE
  };
  var storageRef = admin.storage().bucket();
  let date_ob = Date.now();

  run(req, res);

  // pdfFiller.fillFormWithFlatten('./public/upload/Agreement.pdf', './public/upload/' + date_ob + '.pdf', data, true, (err) => {
  // if (err) throw err;
  // storageRef.upload('./public/upload/' + date_ob + '.pdf')
  // .then(data => {
  // res.send({
  // status: true,
  // data: data[0].metadata
  // })
  // })
  // .catch((error) => {
  // console.log(error);
  // })
  // });
})

async function run(req, res) {
  const formBytes = fs.readFileSync('./public/upload/Agreement.pdf')
  const pdfDoc = await PDFDocument.load(formBytes)
  const form = pdfDoc.getForm()
  const dayField = form.getTextField('DAYS');
  const monthField = form.getTextField('MONTHS');
  const startingField = form.getTextField('STARTING DATE');
  const rentField = form.getTextField('RENT AMOUNT');
  const roosteasyField = form.getTextField('ROOSTEASY [X]');
  const initialField = form.getTextField('INITIAL');
  const dateField = form.getTextField('DATE');

  dayField.setText(req.body.DAYS.toString());
  monthField.setText(req.body.MONTHS.toString());
  startingField.setText(req.body.STARTING_DATE);
  rentField.setText(req.body.RENT_AMOUNT);
  roosteasyField.setText(req.body.ROOSTEASY);
  initialField.setText(req.body.INITIAL);
  dateField.setText(req.body.DATE);

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