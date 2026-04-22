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
            executablePath: process.env.CHROME_PATH || require('puppeteer').executablePath(),
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
            ],
        },
    });

    qrStrings[userId] = 'INITIALIZING';

    client.on('qr', (qr) => { qrStrings[userId] = qr; });
    client.on('remote_session_saved', () => console.log(`Session saved for ${userId}`));
    client.on('ready', () => { console.log(`WhatsApp ready for ${userId}`); qrStrings[userId] = 'CONNECTED'; });
    client.on('authenticated', () => { qrStrings[userId] = 'AUTHENTICATED'; });
    client.on('auth_failure', (msg) => { 
        console.log(`Auth failure for ${userId}:`, msg); 
        qrStrings[userId] = 'AUTH_FAILURE'; 
    });
    client.on('disconnected', (reason) => { 
        console.log(`Disconnected ${userId}:`, reason); 
        qrStrings[userId] = 'DISCONNECTED'; 
        delete clients[userId]; 
    });
    
    // Handle errors to prevent crashes
    client.on('error', (error) => {
        console.error(`Client error for ${userId}:`, error.message);
        qrStrings[userId] = 'ERROR';
    });
    
    // Handle page errors
    client.pupPage?.on('error', (error) => {
        console.error(`Page error for ${userId}:`, error.message);
    });
    
    client.pupPage?.on('pageerror', (error) => {
        console.error(`Page script error for ${userId}:`, error.message);
    });

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
                const custNumberId = await safeGetNumberId(client, invoice.customerPhone.replace(/\D/g, ''));
                if (custNumberId) {
                    await safeSendMessage(client, custNumberId._serialized,
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

            const custNumberId = await safeGetNumberId(client, senderPhone);
            if (custNumberId) {
                await safeSendMessage(client, custNumberId._serialized,
                    `🙏 Thank you *${invoice.customerName}*! Your payment claim for Invoice *#${invNo}* (₹${invoice.finalAmount.toLocaleString()}) has been received.\n\nWe'll verify and confirm shortly.`
                );
            }

            // Send verification poll to business owner
            const { data: user } = await axios.get(`${backendUrl}/api/whatsapp/internal/user/${userId}`, {
                headers: { 'x-service-secret': process.env.SERVICE_SECRET }
            });

            if (user?.businessPhone) {
                const ownerNumberId = await safeGetNumberId(client, user.businessPhone.replace(/\D/g, ''));
                if (ownerNumberId) {
                    await safeSendMessage(client, ownerNumberId._serialized,
                        `🔔 *Payment Claim!*\n\n*${invoice.customerName}* (${invoice.customerPhone}) claims to have paid *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}*.\n\nPlease check your UPI app and vote below:`
                    );
                    const ownerPoll = new Poll(
                        `💰 Did you receive ₹${invoice.finalAmount.toLocaleString()} from ${invoice.customerName}?`,
                        ['✅ Yes, Received', '❌ No, Not Received'],
                        { allowMultipleAnswers: false }
                    );
                    const ownerPollMsg = await safeSendMessage(client, ownerNumberId._serialized, ownerPoll);
                    if (ownerPollMsg) {
                        ownerPollMap[ownerPollMsg.id._serialized] = { invoiceId: invoice._id, backendUrl };
                    }
                }
            }
        } catch (err) {
            console.error('Poll vote handler error:', err.message);
        }
    });

    try {
        await client.initialize();
        clients[userId] = client;
        return client;
    } catch (error) {
        console.error(`Failed to initialize WhatsApp for ${userId}:`, error.message);
        qrStrings[userId] = 'INIT_ERROR';
        throw error;
    }
};

// Safe wrapper functions to handle execution context errors
const safeGetNumberId = async (client, phone, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await client.getNumberId(phone);
        } catch (error) {
            if (error.message.includes('Execution context was destroyed') && i < retries) {
                console.log(`Retrying getNumberId for ${phone} (attempt ${i + 2})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            console.error(`Failed to get number ID for ${phone}:`, error.message);
            return null;
        }
    }
};

const safeSendMessage = async (client, chatId, message, retries = 2) => {
    for (let i = 0; i <= retries; i++) {
        try {
            return await client.sendMessage(chatId, message);
        } catch (error) {
            if (error.message.includes('Execution context was destroyed') && i < retries) {
                console.log(`Retrying sendMessage to ${chatId} (attempt ${i + 2})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            console.error(`Failed to send message to ${chatId}:`, error.message);
            return null;
        }
    }
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
        console.error(`Init error for ${userId}:`, err.message);
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
        const numberId = await safeGetNumberId(client, cleanedPhone);
        if (!numberId) return res.status(400).json({ message: `${cleanedPhone} is not on WhatsApp` });

        const chatId = numberId._serialized;

        if (pdfBase64) {
            const media = new MessageMedia('application/pdf', pdfBase64, 'invoice.pdf');
            await safeSendMessage(client, chatId, media, { caption: message });
        } else {
            await safeSendMessage(client, chatId, message);
        }

        // Payment confirmation poll
        const poll = new Poll(
            '💳 Have you completed the payment?',
            ['✅ Yes, I Have Paid', '❌ Not Yet'],
            { allowMultipleAnswers: false }
        );
        await safeSendMessage(client, chatId, poll);

        res.json({ message: 'Sent successfully' });
    } catch (err) {
        console.error(`Send error for ${userId}:`, err.message);
        res.status(500).json({ message: err.message });
    }
});

// Disconnect
app.post('/disconnect', requireSecret, async (req, res) => {
    const { userId } = req.body;
    const client = clients[userId];
    if (client) {
        try {
            await client.destroy();
        } catch (error) {
            console.error(`Error destroying client for ${userId}:`, error.message);
        }
        delete clients[userId];
        delete qrStrings[userId];
    }
    res.json({ message: 'Disconnected' });
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error.message);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`WhatsApp service running on port ${PORT}`));
