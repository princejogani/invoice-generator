const axios = require('axios');

const WA_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL;
const SERVICE_SECRET = process.env.SERVICE_SECRET;

const headers = () => ({ 'x-service-secret': SERVICE_SECRET });

const initWhatsApp = async (userId) => {
    if (!WA_SERVICE_URL) throw new Error('WHATSAPP_SERVICE_URL not configured');
    const { data } = await axios.post(`${WA_SERVICE_URL}/init`, { userId }, { headers: headers() });
    return data;
};

const sendInvoiceWhatsApp = async (userId, phone, message, pdfBuffer) => {
    if (!WA_SERVICE_URL) throw new Error('WHATSAPP_SERVICE_URL not configured');
    const payload = {
        userId,
        phone,
        message,
        pdfBase64: pdfBuffer ? pdfBuffer.toString('base64') : null,
    };
    const { data } = await axios.post(`${WA_SERVICE_URL}/send`, payload, { headers: headers() });
    return data;
};

const getQRStatus = async (userId) => {
    if (!WA_SERVICE_URL) return 'SERVICE_NOT_CONFIGURED';
    try {
        const { data } = await axios.get(`${WA_SERVICE_URL}/status/${userId}`, { headers: headers() });
        return data.status;
    } catch {
        return 'SERVICE_UNAVAILABLE';
    }
};

module.exports = { initWhatsApp, sendInvoiceWhatsApp, getQRStatus };
