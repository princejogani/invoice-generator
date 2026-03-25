const cron = require('node-cron');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');
const stepfunAgent = require('./stepfunAgent');

/**
 * Background Agent Cron Service
 * Runs various AI agents periodically to enhance the invoice system
 */
class AgentCronService {
    constructor() {
        this.jobs = [];
    }

    /**
     * Start all background agent cron jobs
     */
    start() {
        console.log('Starting Background Agent Cron Service...');

        // 1. Daily invoice analysis (runs at 2 AM daily)
        this.jobs.push(cron.schedule('0 2 * * *', this.runDailyInvoiceAnalysis.bind(this)));

        // 2. Payment prediction updates (runs every 6 hours)
        this.jobs.push(cron.schedule('0 */6 * * *', this.runPaymentPredictions.bind(this)));

        // 3. Customer communication optimization (runs at 10 AM daily)
        this.jobs.push(cron.schedule('0 10 * * *', this.optimizeCustomerCommunication.bind(this)));

        // 4. Weekly business insights (runs every Monday at 3 AM)
        this.jobs.push(cron.schedule('0 3 * * 1', this.generateWeeklyInsights.bind(this)));

        console.log(`Started ${this.jobs.length} background agent jobs`);
    }

    /**
     * Stop all cron jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('Stopped all background agent jobs');
    }

    /**
     * Daily invoice analysis - analyzes recent invoices for patterns
     */
    async runDailyInvoiceAnalysis() {
        console.log('Running Daily Invoice Analysis Agent...');

        try {
            // Get invoices from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentInvoices = await Invoice.find({
                createdAt: { $gte: sevenDaysAgo }
            }).populate('userId', 'businessName email').populate('customerId', 'name email phone');

            if (recentInvoices.length === 0) {
                console.log('No recent invoices found for analysis');
                return;
            }

            // Group by user/business
            const invoicesByUser = {};
            recentInvoices.forEach(invoice => {
                const userId = invoice.userId?._id?.toString();
                if (!userId) return;

                if (!invoicesByUser[userId]) {
                    invoicesByUser[userId] = {
                        user: invoice.userId,
                        invoices: []
                    };
                }
                invoicesByUser[userId].invoices.push(invoice);
            });

            // Analyze for each user
            for (const [userId, data] of Object.entries(invoicesByUser)) {
                try {
                    const analysis = await stepfunAgent.analyzeInvoicePatterns(
                        data.invoices,
                        { name: data.user.businessName, email: data.user.email }
                    );

                    console.log(`Invoice analysis for user ${data.user.businessName}:`);
                    console.log(analysis.substring(0, 200) + '...');

                    // In a real implementation, you would save this analysis to a database
                    // or send it via email/notification to the user
                } catch (error) {
                    console.error(`Error analyzing invoices for user ${userId}:`, error.message);
                }
            }

            console.log('Daily invoice analysis completed');
        } catch (error) {
            console.error('Error in daily invoice analysis:', error);
        }
    }

    /**
     * Payment prediction updates - predicts payment probability for unpaid invoices
     */
    async runPaymentPredictions() {
        console.log('Running Payment Prediction Agent...');

        try {
            // Get unpaid invoices
            const unpaidInvoices = await Invoice.find({ status: 'unpaid' })
                .populate('customerId')
                .populate('userId', 'businessName');

            if (unpaidInvoices.length === 0) {
                console.log('No unpaid invoices found for prediction');
                return;
            }

            // Process invoices in batches
            const batchSize = 5;
            for (let i = 0; i < unpaidInvoices.length; i += batchSize) {
                const batch = unpaidInvoices.slice(i, i + batchSize);

                await Promise.all(batch.map(async (invoice) => {
                    try {
                        // Get customer's payment history
                        const customerHistory = await Invoice.find({
                            customerId: invoice.customerId,
                            _id: { $ne: invoice._id }
                        }).sort({ createdAt: -1 }).limit(10);

                        const prediction = await stepfunAgent.predictPaymentProbability(
                            invoice,
                            invoice.customerId || { name: 'Unknown Customer' },
                            customerHistory
                        );

                        console.log(`Payment prediction for invoice ${invoice._id.toString().slice(-6)}:`);
                        console.log(`  Probability: ${prediction.probability}%`);
                        console.log(`  Risk Level: ${prediction.riskLevel}`);
                        console.log(`  Recommended: ${prediction.recommendedActions?.join(', ')}`);

                        // In a real implementation, you would save predictions to the database
                        // and trigger actions based on risk level

                    } catch (error) {
                        console.error(`Error predicting payment for invoice ${invoice._id}:`, error.message);
                    }
                }));

                // Small delay between batches to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            console.log('Payment prediction completed');
        } catch (error) {
            console.error('Error in payment prediction:', error);
        }
    }

    /**
     * Optimize customer communication - generates better reminder messages
     */
    async optimizeCustomerCommunication() {
        console.log('Running Customer Communication Optimization Agent...');

        try {
            // Get customers with unpaid invoices
            const customersWithUnpaid = await Customer.aggregate([
                {
                    $lookup: {
                        from: 'invoices',
                        localField: '_id',
                        foreignField: 'customerId',
                        as: 'invoices'
                    }
                },
                {
                    $match: {
                        'invoices.status': 'unpaid',
                        'invoices.sentOnWhatsapp': { $ne: true }
                    }
                },
                { $limit: 10 } // Limit to 10 customers per run
            ]);

            for (const customer of customersWithUnpaid) {
                try {
                    // Get oldest unpaid invoice for this customer
                    const unpaidInvoice = await Invoice.findOne({
                        customerId: customer._id,
                        status: 'unpaid',
                        sentOnWhatsapp: { $ne: true }
                    }).sort({ createdAt: 1 });

                    if (!unpaidInvoice) continue;

                    // Generate personalized reminder
                    const personalizedMessage = await stepfunAgent.generatePersonalizedReminder(
                        unpaidInvoice,
                        customer
                    );

                    console.log(`Optimized message for customer ${customer.name}:`);
                    console.log(personalizedMessage);

                    // In a real implementation, you would:
                    // 1. Update the message template in database
                    // 2. Send via WhatsApp using whatsappUtils
                    // 3. Mark invoice as sentOnWhatsapp = true

                } catch (error) {
                    console.error(`Error optimizing communication for customer ${customer._id}:`, error.message);
                }
            }

            console.log('Customer communication optimization completed');
        } catch (error) {
            console.error('Error in customer communication optimization:', error);
        }
    }

    /**
     * Generate weekly business insights
     */
    async generateWeeklyInsights() {
        console.log('Running Weekly Business Insights Agent...');

        try {
            // Get all active users
            const activeUsers = await User.find({ isActive: true }).limit(5); // Limit for demo

            for (const user of activeUsers) {
                try {
                    // Get user's weekly stats
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

                    const weeklyInvoices = await Invoice.find({
                        userId: user._id,
                        createdAt: { $gte: oneWeekAgo }
                    });

                    const weeklyStats = {
                        totalInvoices: weeklyInvoices.length,
                        totalAmount: weeklyInvoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0),
                        paidInvoices: weeklyInvoices.filter(inv => inv.status === 'paid').length,
                        unpaidInvoices: weeklyInvoices.filter(inv => inv.status === 'unpaid').length,
                        newCustomers: await Customer.countDocuments({
                            userId: user._id,
                            createdAt: { $gte: oneWeekAgo }
                        })
                    };

                    // Generate insights prompt
                    const prompt = `Generate weekly business insights for ${user.businessName}:
                    
Weekly Performance (Last 7 days):
- Total Invoices: ${weeklyStats.totalInvoices}
- Total Revenue: ₹${weeklyStats.totalAmount}
- Paid Invoices: ${weeklyStats.paidInvoices}
- Unpaid Invoices: ${weeklyStats.unpaidInvoices}
- New Customers: ${weeklyStats.newCustomers}

Please provide:
1. Key achievements from the week
2. Areas needing attention
3. Recommendations for next week
4. One actionable tip to improve collections`;

                    const insights = await stepfunAgent.generateResponse(prompt, { temperature: 0.6 });

                    console.log(`Weekly insights for ${user.businessName}:`);
                    console.log(insights.substring(0, 300) + '...');

                    // In a real implementation, you would send these insights via email
                    // or display them in the user's dashboard

                } catch (error) {
                    console.error(`Error generating insights for user ${user._id}:`, error.message);
                }
            }

            console.log('Weekly business insights completed');
        } catch (error) {
            console.error('Error in weekly business insights:', error);
        }
    }

    /**
     * Manually trigger an agent run (for testing)
     */
    async triggerAgent(agentName) {
        console.log(`Manually triggering agent: ${agentName}`);

        switch (agentName) {
            case 'invoiceAnalysis':
                return await this.runDailyInvoiceAnalysis();
            case 'paymentPrediction':
                return await this.runPaymentPredictions();
            case 'communicationOptimization':
                return await this.optimizeCustomerCommunication();
            case 'weeklyInsights':
                return await this.generateWeeklyInsights();
            default:
                throw new Error(`Unknown agent: ${agentName}`);
        }
    }
}

// Create singleton instance
const agentCronService = new AgentCronService();

module.exports = agentCronService;