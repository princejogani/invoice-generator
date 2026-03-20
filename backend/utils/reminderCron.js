const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const { sendInvoiceWhatsApp } = require('../utils/whatsappUtils');

const startReminderCron = () => {
    // Run every day at 10 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('Running Payment Reminder Cron...');

        const unpaidInvoices = await Invoice.find({ status: 'unpaid' }).populate('userId');

        for (const invoice of unpaidInvoices) {
            if (invoice.userId && invoice.userId.plan === 'paid') {
                const message = `Reminder: Your invoice of INR ${invoice.finalAmount} is still pending. Please pay at your earliest convenience.`;
                try {
                    await sendInvoiceWhatsApp(invoice.userId._id.toString(), invoice.customerPhone, message);
                    console.log(`Reminder sent for invoice ${invoice._id}`);
                } catch (error) {
                    console.error(`Failed to send reminder for invoice ${invoice._id}: ${error.message}`);
                }
            }
        }
    });
};

module.exports = startReminderCron;
