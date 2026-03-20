const express = require('express');
const router = express.Router();
const { initWhatsApp, sendInvoiceWhatsApp, getQRStatus } = require('../utils/whatsappUtils');
const { protect } = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { generateInvoicePDF, generateInvoicePDFBuffer } = require('../utils/pdfUtils');

const formatPhone = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    return cleaned.includes('@c.us') ? cleaned : `${cleaned}@c.us`;
};

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

router.get('/download/:id', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice._id}.pdf`);

        const user = await User.findById(req.user._id);
        generateInvoicePDF(invoice, res, user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/send-invoice', protect, async (req, res) => {
    const { invoiceId, message } = req.body;

    try {
        const invoice = await Invoice.findById(invoiceId);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const user = await User.findById(req.user._id);

        let finalMessage = message;
        if (!finalMessage && user.whatsappTemplate) {
            finalMessage = user.whatsappTemplate
                .replace('{{customerName}}', invoice.customerName)
                .replace('{{amount}}', `₹${invoice.finalAmount}`)
                .replace('{{businessName}}', user.name);
        }

        if (!finalMessage) {
            finalMessage = `Hello ${invoice.customerName}, your invoice for ₹${invoice.finalAmount} is ready.`;
        }

        // Generate PDF Buffer
        const pdfBuffer = await generateInvoicePDFBuffer(invoice, user);

        // Send with PDF
        await sendInvoiceWhatsApp(
            req.user._id.toString(),
            formatPhone(invoice.customerPhone),
            finalMessage,
            pdfBuffer
        );

        invoice.sentOnWhatsapp = true;
        await invoice.save();

        res.json({ message: 'Invoice sent successfully' });
    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
