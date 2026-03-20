const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    totalInvoices: { type: Number, default: 0 },
    totalPendingAmount: { type: Number, default: 0 },
    portalToken: { type: String, unique: true, sparse: true, default: () => require('crypto').randomBytes(16).toString('hex') },
    lastTransactionDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', CustomerSchema);
