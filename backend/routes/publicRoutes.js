const express = require('express');
const router = express.Router();
const { getPortalData, getPaymentData, confirmUpiPayment } = require('../controllers/publicController');

router.get('/portal/:token', getPortalData);
router.get('/pay/:token', getPaymentData);
router.post('/pay/:token/confirm', confirmUpiPayment);

module.exports = router;
