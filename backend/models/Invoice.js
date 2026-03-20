const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true }
        }
    ],
    type: { type: String, enum: ['gst', 'non-gst', 'estimate'], required: true },
    subtotal: { type: Number, required: true },
    gstPercentage: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    adjustment: {
        value: { type: Number, default: 0 },
        type: { type: String, enum: ['none', 'percent', 'fixed'], default: 'none' }
    },
    finalAmount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    sentOnWhatsapp: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
