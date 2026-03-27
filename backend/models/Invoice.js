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
    type: { type: String, enum: ['GST', 'NON-GST', 'ESTIMATE'], required: true },
    subtotal: { type: Number, required: true },
    gstPercentage: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    adjustments: [
        {
            label: { type: String, required: true },
            value: { type: Number, required: true },
            type: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
            operation: { type: String, enum: ['add', 'subtract'], default: 'add' }
        }
    ],
    finalAmount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
    isDraft: { type: Boolean, default: false },
    sentOnWhatsapp: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
