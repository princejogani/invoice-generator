const crypto = require('crypto');

/**
 * Generate a UPI deep-link for payment.
 * Works with all UPI apps (GPay, PhonePe, Paytm, etc.)
 */
const generateUpiLink = (upiId, businessName, amount, invoiceId) => {
    const note = `Invoice-${invoiceId.toString().slice(-6).toUpperCase()}`;
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
};

/**
 * Generate a secure random token for payment confirmation page.
 */
const generatePaymentToken = () => crypto.randomBytes(20).toString('hex');

/**
 * Build the full payment confirmation page URL.
 */
const getPaymentPageUrl = (token, baseUrl) => {
    return `${baseUrl}/pay/${token}`;
};

module.exports = { generateUpiLink, generatePaymentToken, getPaymentPageUrl };
