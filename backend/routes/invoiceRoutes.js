const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus, getDashboardStats, exportInvoices } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.get('/export', exportInvoices);
router.get('/stats', getDashboardStats);
router.patch('/status', updateInvoiceStatus);

module.exports = router;
