const express = require('express');
const docController = require('../controllers/docController');
const router = express.Router();

router
  .route('/upload')
  .post(docController.upload);

module.exports = router;
