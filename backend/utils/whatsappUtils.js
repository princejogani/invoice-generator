const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const User = require('../models/User');

const clients = {};
const qrStrings = {};

const initWhatsApp = async (userId) => {
    if (clients[userId]) return clients[userId];

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: {
            args: ['--no-sandbox'],
        }
    });

    qrStrings[userId] = 'INITIALIZING';

    client.on('qr', (qr) => {
        qrStrings[userId] = qr;
    });

    client.on('ready', () => {
        console.log(`Client is ready for ${userId}`);
        qrStrings[userId] = 'CONNECTED';
    });

    client.on('authenticated', () => {
        qrStrings[userId] = 'AUTHENTICATED';
    });

    client.on('auth_failure', () => {
        qrStrings[userId] = 'AUTH_FAILURE';
    });

    client.on('disconnected', () => {
        qrStrings[userId] = 'DISCONNECTED';
    });

    client.initialize();
    clients[userId] = client;
    return client;
};

const sendInvoiceWhatsApp = async (userId, phone, message, pdfBuffer) => {
    const client = clients[userId];
    if (!client) throw new Error('WhatsApp not initialized');

    // Remove any non-digits for getNumberId
    const cleanedPhone = phone.replace(/\D/g, '');
    const numberId = await client.getNumberId(cleanedPhone);

    if (!numberId) {
        throw new Error(`The number ${cleanedPhone} is not registered on WhatsApp.`);
    }

    const chatId = numberId._serialized;

    if (pdfBuffer) {
        const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), 'invoice.pdf');
        await client.sendMessage(chatId, media, { caption: message });
    } else {
        await client.sendMessage(chatId, message);
    }
};

const getQRStatus = (userId) => {
    return qrStrings[userId] || 'NOT_INITIALIZED';
};

module.exports = { initWhatsApp, sendInvoiceWhatsApp, getQRStatus };
