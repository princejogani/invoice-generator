const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user', 'staff'], default: 'user' },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    whatsappSession: { type: Object, default: null },
    whatsappTemplate: {
        type: String,
        default: 'Hello {{customerName}}, your invoice for {{amount}} from {{businessName}} is ready. Download it here.'
    },
    invoiceCustomizations: {
        type: Object,
        default: {
            primaryColor: '#1e293b',
            secondaryColor: '#64748b',
            accentColor: '#3b82f6',
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            fontSize: 10,
            headerFontSize: 22,
            logoSize: 60,
            logoPosition: 'left', // 'left', 'center', 'right'
            layout: 'professional' // for backward compatibility, but will be overridden
        }
    },
    businessName: { type: String, default: '' },
    tagline: { type: String, default: '' },
    gstin: { type: String, default: '' },
    businessAddress: { type: String, default: '' },
    businessPhone: { type: String, default: '' },
    bankName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    ifscCode: { type: String, default: '' },
    upiId: { type: String, default: '' },
    logo: { type: String, default: '' }, // Base64 logo
    parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // For Staff accounts
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
