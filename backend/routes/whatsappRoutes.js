const express = require('express');
const router = express.Router();
const { initWhatsApp, sendInvoiceWhatsApp, getQRStatus } = require('../utils/whatsappUtils');
const { protect } = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const { generateInvoicePDF } = require('../utils/pdfUtils');

router.get('/status', protect, async (req, res) => {
    const status = getQRStatus(req.user._id.toString());
    res.json({ status });
});

router.get('/qr', protect, async (req, res) => {
    try {
        const client = await initWhatsApp(req.user._id.toString());
        // In a real app, the QR is handled via socket.io. 
        // Here we just initialize. The console will show the QR.
        res.json({ message: 'WhatsApp initialization started. Please wait for the QR code to appear.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/send-invoice', protect, async (req, res) => {
    const { invoiceId, message } = req.body;

    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        // Generate PDF to buffer (modified generateInvoicePDF to support buffer or response)
        // For now, let's just send a simple message or implement buffer support
        await sendInvoiceWhatsApp(req.user._id.toString(), invoice.customerPhone, message || `Your invoice for INR ${invoice.finalAmount} is ready.`);

        invoice.sentOnWhatsapp = true;
        await invoice.save();

        res.json({ message: 'Invoice sent successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
