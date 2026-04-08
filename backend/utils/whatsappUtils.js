const { Client, LocalAuth, MessageMedia, Poll } = require('whatsapp-web.js');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');

const clients = {};
const qrStrings = {};

// Track pending owner verification polls: pollMsgId -> invoiceId
const ownerPollMap = {};

const initWhatsApp = async (userId) => {
    if (clients[userId]) return clients[userId];

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: userId }),
        puppeteer: { args: ['--no-sandbox'] }
    });

    qrStrings[userId] = 'INITIALIZING';

    client.on('qr', (qr) => { qrStrings[userId] = qr; });
    client.on('ready', () => {
        console.log(`WhatsApp ready for ${userId}`);
        qrStrings[userId] = 'CONNECTED';
    });
    client.on('authenticated', () => { qrStrings[userId] = 'AUTHENTICATED'; });
    client.on('auth_failure', () => { qrStrings[userId] = 'AUTH_FAILURE'; });
    client.on('disconnected', () => { qrStrings[userId] = 'DISCONNECTED'; });

    client.on('vote_update', async (vote) => {
        try {
            const selectedOptions = vote.selectedOptions || [];
            if (selectedOptions.length === 0) return;

            const optionName = selectedOptions[0].name;
            const pollMsgId = vote.parentMessage?.id?._serialized;

            // ── Owner verification poll ──────────────────────────────────────
            if (ownerPollMap[pollMsgId]) {
                if (optionName !== '✅ Yes, Received') return;

                const invoiceId = ownerPollMap[pollMsgId];
                delete ownerPollMap[pollMsgId];

                // Close owner poll
                try { await vote.parentMessage.delete(true); } catch (_) {}

                const invoice = await Invoice.findById(invoiceId);
                if (!invoice || invoice.status === 'paid') return;

                // Mark as paid
                invoice.status = 'paid';
                invoice.paidAmount = invoice.finalAmount;
                invoice.upiClaimedAt = invoice.upiClaimedAt || new Date();
                invoice.payments.push({
                    amount: invoice.finalAmount,
                    method: 'ONLINE',
                    recordedByName: 'WhatsApp Poll Verified',
                    date: new Date(),
                });
                await invoice.save();

                // Update customer pending amount
                const customer = await Customer.findById(invoice.customerId);
                if (customer) {
                    customer.totalPendingAmount = Math.max(0, customer.totalPendingAmount - invoice.finalAmount);
                    await customer.save();
                }

                const invNo = invoice._id.toString().slice(-6).toUpperCase();

                // Notify customer payment confirmed
                const customerChatId = `${invoice.customerPhone.replace(/\D/g, '')}@c.us`;
                const custNumberId = await client.getNumberId(invoice.customerPhone.replace(/\D/g, ''));
                if (custNumberId) {
                    await client.sendMessage(custNumberId._serialized,
                        `✅ *Payment Confirmed!*\n\nHi *${invoice.customerName}*, your payment of *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}* has been verified and confirmed.\n\nThank you! 🙏`
                    );
                }
                return;
            }

            // ── Customer payment poll ────────────────────────────────────────
            if (optionName !== '✅ Yes, I Have Paid') return;

            // Close customer poll
            try { await vote.parentMessage.delete(true); } catch (_) {}

            const senderPhone = vote.voter.replace('@c.us', '');

            const invoice = await Invoice.findOne({
                userId,
                customerPhone: { $regex: senderPhone.slice(-10) },
                status: { $ne: 'paid' },
                upiClaimedAt: null,
            }).sort({ createdAt: -1 });

            if (!invoice) return;

            invoice.upiClaimedAt = new Date();
            await invoice.save();

            const invNo = invoice._id.toString().slice(-6).toUpperCase();

            // Confirm to customer
            const custNumberId = await client.getNumberId(senderPhone);
            if (custNumberId) {
                await client.sendMessage(custNumberId._serialized,
                    `🙏 Thank you *${invoice.customerName}*! Your payment claim for Invoice *#${invNo}* (₹${invoice.finalAmount.toLocaleString()}) has been received.\n\nWe'll verify and confirm shortly.`
                );
            }

            // Send verification poll to business owner
            const user = await User.findById(userId);
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
                    // Map poll message id -> invoiceId for the vote handler above
                    ownerPollMap[ownerPollMsg.id._serialized] = invoice._id.toString();
                }
            }
        } catch (err) {
            console.error('Poll vote handler error:', err.message);
        }
    });

    client.initialize();
    clients[userId] = client;
    return client;
};

const sendInvoiceWhatsApp = async (userId, phone, message, pdfBuffer) => {
    const client = clients[userId];
    if (!client) throw new Error('WhatsApp not initialized');

    const cleanedPhone = phone.replace(/\D/g, '');
    const numberId = await client.getNumberId(cleanedPhone);
    if (!numberId) throw new Error(`The number ${cleanedPhone} is not registered on WhatsApp.`);

    const chatId = numberId._serialized;

    if (pdfBuffer) {
        const media = new MessageMedia('application/pdf', pdfBuffer.toString('base64'), 'invoice.pdf');
        await client.sendMessage(chatId, media, { caption: message });
    } else {
        await client.sendMessage(chatId, message);
    }

    // Send payment confirmation poll to customer
    const poll = new Poll(
        '💳 Have you completed the payment?',
        ['✅ Yes, I Have Paid', '❌ Not Yet'],
        { allowMultipleAnswers: false }
    );
    await client.sendMessage(chatId, poll);
};

const getQRStatus = (userId) => qrStrings[userId] || 'NOT_INITIALIZED';

module.exports = { initWhatsApp, sendInvoiceWhatsApp, getQRStatus };
