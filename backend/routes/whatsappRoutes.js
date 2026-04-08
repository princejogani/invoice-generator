const express = require('express');
const router = express.Router();
const { initWhatsApp, sendInvoiceWhatsApp, getQRStatus } = require('../utils/whatsappUtils');
const { protect } = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { generateInvoicePDF, generateInvoicePDFBuffer } = require('../utils/pdfUtils');

const buildMessage = (template, invoice, user) => {
    const invNo = `#${invoice._id.toString().slice(-6).toUpperCase()}`;

    let msg = template || `Hello {{customerName}}, your invoice {{invoiceNo}} for {{amount}} from {{businessName}} is ready.`;
    msg = msg
        .replace(/\{\{customerName\}\}/g, invoice.customerName)
        .replace(/\{\{amount\}\}/g, `₹${invoice.finalAmount.toLocaleString()}`)
        .replace(/\{\{businessName\}\}/g, user.businessName || user.name || '')
        .replace(/\{\{invoiceNo\}\}/g, invNo)
        .replace(/\{\{paymentLink\}\}/g, user.upiId || '');

    if (user.upiId && !(template || '').includes('{{paymentLink}}')) {
        msg += `\n\n💳 *Pay via UPI*\nUPI ID: *${user.upiId}*\nAmount: *₹${invoice.finalAmount.toLocaleString()}*\nRef: ${invNo}\n\nOpen PhonePe / GPay / Paytm → Send Money → Enter UPI ID above`;
    }

    return msg;
};

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
        await initWhatsApp(req.user._id.toString());
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
        const finalMessage = buildMessage(message || user.whatsappTemplate, invoice, user);
        const pdfBuffer = await generateInvoicePDFBuffer(invoice, user);

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
