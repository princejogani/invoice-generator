const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const { sendInvoiceWhatsApp } = require('../utils/whatsappUtils');

const getPortalData = async (req, res) => {
    try {
        const customer = await Customer.findOne({ portalToken: req.params.token });
        if (!customer) return res.status(404).json({ message: 'Portal link is invalid or expired.' });

        const business = await User.findById(customer.userId).select('businessName tagline logo businessAddress businessPhone bankName accountNumber ifscCode upiId');
        const invoices = await Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 });
        res.json({ customer, business, invoices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPaymentData = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ upiPaymentToken: req.params.token });
        if (!invoice) return res.status(404).json({ message: 'Payment link is invalid or expired.' });

        const user = await User.findById(invoice.userId).select('businessName upiId logo');
        res.json({ invoice, business: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Customer taps "I Have Paid" — only flags the invoice, notifies business owner to verify
const confirmUpiPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ upiPaymentToken: req.params.token });
        if (!invoice) return res.status(404).json({ message: 'Payment link is invalid or expired.' });
        if (invoice.status === 'paid') return res.json({ status: 'already_paid' });
        if (invoice.upiClaimedAt) return res.json({ status: 'already_claimed' });

        invoice.upiClaimedAt = new Date();
        await invoice.save();

        // Notify business owner on WhatsApp to verify
        const user = await User.findById(invoice.userId);
        if (user) {
            try {
                const invNo = invoice._id.toString().slice(-6).toUpperCase();
                const msg =
                    `🔔 *Payment Claim Received!*\n\n` +
                    `Customer *${invoice.customerName}* (${invoice.customerPhone}) has claimed UPI payment of *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}*.\n\n` +
                    `⚠️ Please verify in your UPI app / bank statement, then confirm in the Invoice dashboard.\n\n` +
                    `— ${user.businessName || user.name}`;
                await sendInvoiceWhatsApp(invoice.userId.toString(), user.businessPhone, msg, null);
            } catch (waErr) {
                console.error('Owner WhatsApp notification failed:', waErr.message);
            }
        }

        res.json({ status: 'claimed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPortalData, getPaymentData, confirmUpiPayment };
