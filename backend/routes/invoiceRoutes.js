const express = require('express');
const router = express.Router();
const { createInvoice, getInvoices, updateInvoiceStatus, getDashboardStats } = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/create', createInvoice);
router.get('/list', getInvoices);
router.get('/stats', getDashboardStats);
router.patch('/status', updateInvoiceStatus);

module.exports = router;
