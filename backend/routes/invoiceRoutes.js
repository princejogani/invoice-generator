const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.patch('/status', updateInvoiceStatus);

module.exports = router;
