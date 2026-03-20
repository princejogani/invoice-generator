const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    plan: { type: String, enum: ['free', 'paid'], default: 'free' },
    isActive: { type: Boolean, default: true },
    whatsappSession: { type: Object, default: null },
    whatsappTemplate: {
        type: String,
        default: 'Hello {{customerName}}, your invoice for {{amount}} from {{businessName}} is ready. Download it here.'
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
    role: { type: String, enum: ['admin', 'user', 'staff'], default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
