const path = require('path');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.resolve(__dirname, envFile) });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Client, RemoteAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const { MongoStore } = require('wwebjs-mongo');
const axios = require('axios');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(cors());

// ── Auth middleware ──────────────────────────────────────────────────────────
const requireSecret = (req, res, next) => {
    if (req.headers['x-service-secret'] !== process.env.SERVICE_SECRET) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    next();
};

// ── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });

// ── WhatsApp state ───────────────────────────────────────────────────────────
const clients = {};
const qrStrings = {};
const ownerPollMap = {};

const initWhatsApp = async (userId) => {
    if (clients[userId]) return clients[userId];

    const store = new MongoStore({ mongoose });

    const client = new Client({
        authStrategy: new RemoteAuth({
            clientId: userId,
            store,
            backupSyncIntervalMs: 300000,
        }),
        puppeteer: {
            executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
            ],
        },
    });

    qrStrings[userId] = 'INITIALIZING';

    client.on('qr', (qr) => { qrStrings[userId] = qr; });
    client.on('remote_session_saved', () => console.log(`Session saved for ${userId}`));
    client.on('ready', () => { console.log(`WhatsApp ready for ${userId}`); qrStrings[userId] = 'CONNECTED'; });
    client.on('authenticated', () => { qrStrings[userId] = 'AUTHENTICATED'; });
    client.on('auth_failure', () => { qrStrings[userId] = 'AUTH_FAILURE'; });
    client.on('disconnected', () => { qrStrings[userId] = 'DISCONNECTED'; delete clients[userId]; });

    client.on('vote_update', async (vote) => {
        try {
            const selectedOptions = vote.selectedOptions || [];
            if (!selectedOptions.length) return;

            const optionName = selectedOptions[0].name;
            const pollMsgId = vote.parentMessage?.id?._serialized;

            // Owner verification poll
            if (ownerPollMap[pollMsgId]) {
                if (optionName !== '✅ Yes, Received') return;

                const { invoiceId, backendUrl } = ownerPollMap[pollMsgId];
                delete ownerPollMap[pollMsgId];

                try { await vote.parentMessage.delete(true); } catch (_) {}

                // Ask backend to mark invoice as paid
                await axios.post(`${backendUrl}/api/whatsapp/internal/mark-paid`, { invoiceId }, {
                    headers: { 'x-service-secret': process.env.SERVICE_SECRET }
                });

                // Fetch invoice info to notify customer
                const { data: invoice } = await axios.get(`${backendUrl}/api/whatsapp/internal/invoice/${invoiceId}`, {
                    headers: { 'x-service-secret': process.env.SERVICE_SECRET }
                });

                const invNo = invoiceId.slice(-6).toUpperCase();
                const custNumberId = await client.getNumberId(invoice.customerPhone.replace(/\D/g, ''));
                if (custNumberId) {
                    await client.sendMessage(custNumberId._serialized,
                        `✅ *Payment Confirmed!*\n\nHi *${invoice.customerName}*, your payment of *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}* has been verified and confirmed.\n\nThank you! 🙏`
                    );
                }
                return;
            }

            // Customer payment poll
            if (optionName !== '✅ Yes, I Have Paid') return;
            try { await vote.parentMessage.delete(true); } catch (_) {}

            const senderPhone = vote.voter.replace('@c.us', '');

            // Ask backend to find & claim the invoice
            const backendUrl = process.env.BACKEND_URL;
            const { data: invoice } = await axios.post(`${backendUrl}/api/whatsapp/internal/claim-payment`, {
                userId, senderPhone
            }, { headers: { 'x-service-secret': process.env.SERVICE_SECRET } });

            if (!invoice) return;

            const invNo = invoice._id.slice(-6).toUpperCase();

            const custNumberId = await client.getNumberId(senderPhone);
            if (custNumberId) {
                await client.sendMessage(custNumberId._serialized,
                    `🙏 Thank you *${invoice.customerName}*! Your payment claim for Invoice *#${invNo}* (₹${invoice.finalAmount.toLocaleString()}) has been received.\n\nWe'll verify and confirm shortly.`
                );
            }

            // Send verification poll to business owner
            const { data: user } = await axios.get(`${backendUrl}/api/whatsapp/internal/user/${userId}`, {
                headers: { 'x-service-secret': process.env.SERVICE_SECRET }
            });

            if (user?.businessPhone) {
                const ownerNumberId = await client.getNumberId(user.businessPhone.replace(/\D/g, ''));
                if (ownerNumberId) {
                    await client.sendMessage(ownerNumberId._serialized,
                        `🔔 *Payment Claim!*\n\n*${invoice.customerName}* (${invoice.customerPhone}) claims to have paid *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}*.\n\nPlease check your UPI app and vote below:`
                    );
                    const ownerPoll = new Poll(
                        `💰 Did you receive ₹${invoice.finalAmount.toLocaleString()} from ${invoice.customerName}?`,
                        ['✅ Yes, Received', '❌ No, Not Received'],
                        { allowMultipleAnswers: false }
                    );
                    const ownerPollMsg = await client.sendMessage(ownerNumberId._serialized, ownerPoll);
                    ownerPollMap[ownerPollMsg.id._serialized] = { invoiceId: invoice._id, backendUrl };
                }
            }
        } catch (err) {
            console.error('Poll vote handler error:', err.message);
        }
    });

    await client.initialize();
    clients[userId] = client;
    return client;
};

// ── Routes ───────────────────────────────────────────────────────────────────

// Health check (public)
app.get('/', (req, res) => res.json({ status: 'WhatsApp service running' }));

// Init / get QR
app.post('/init', requireSecret, async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'userId required' });
    try {
        await initWhatsApp(userId);
        res.json({ status: qrStrings[userId] || 'INITIALIZING' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get QR / status
app.get('/status/:userId', requireSecret, (req, res) => {
    const status = qrStrings[req.params.userId] || 'NOT_INITIALIZED';
    res.json({ status });
});

// Send message (with optional PDF buffer as base64)
app.post('/send', requireSecret, async (req, res) => {
    const { userId, phone, message, pdfBase64 } = req.body;
    if (!userId || !phone) return res.status(400).json({ message: 'userId and phone required' });

    const client = clients[userId];
    if (!client) return res.status(400).json({ message: 'WhatsApp not initialized for this user' });

    try {
        const cleanedPhone = phone.replace(/\D/g, '');
        const numberId = await client.getNumberId(cleanedPhone);
        if (!numberId) return res.status(400).json({ message: `${cleanedPhone} is not on WhatsApp` });

        const chatId = numberId._serialized;

        if (pdfBase64) {
            const media = new MessageMedia('application/pdf', pdfBase64, 'invoice.pdf');
            await client.sendMessage(chatId, media, { caption: message });
        } else {
            await client.sendMessage(chatId, message);
        }

        // Payment confirmation poll
        const poll = new Poll(
            '💳 Have you completed the payment?',
            ['✅ Yes, I Have Paid', '❌ Not Yet'],
            { allowMultipleAnswers: false }
        );
        await client.sendMessage(chatId, poll);

        res.json({ message: 'Sent successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Disconnect
app.post('/disconnect', requireSecret, async (req, res) => {
    const { userId } = req.body;
    const client = clients[userId];
    if (client) {
        await client.destroy();
        delete clients[userId];
        delete qrStrings[userId];
    }
    res.json({ message: 'Disconnected' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WhatsApp service running on port ${PORT}`));
