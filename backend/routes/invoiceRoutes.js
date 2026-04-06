const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus, getDashboardStats, exportInvoices, convertDraftToFinal, updateInvoice, recordPayment, getPayments } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.get('/export', exportInvoices);
router.get('/stats', getDashboardStats);
router.patch('/status', updateInvoiceStatus);
router.patch('/convert-draft', convertDraftToFinal);
router.put('/update', updateInvoice);
router.post('/payment', recordPayment);
router.get('/:id/payments', getPayments);

module.exports = router;
