const axios = require('axios');

/**
 * StepFun Agent Service for invoice generator
 * Uses Step 3.5 Flash model for AI-powered background tasks
 */
class StepFunAgent {
    constructor() {
        this.initialized = false;
        this.model = process.env.STEPFUN_MODEL || 'stepfun/step-3.5-flash:free';
        this.apiKey = process.env.STEPFUN_API_KEY;
        this.baseURL = process.env.STEPFUN_BASE_URL || 'https://openrouter.ai/api/v1';
        this.init();
    }

    async init() {
        console.log('StepFun Agent init - API Key present:', !!this.apiKey);
        console.log('StepFun Agent init - API Key starts with:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none');
        
        if (!this.apiKey || this.apiKey === 'your_stepfun_api_key_here') {
            console.log('StepFun API key not configured, using mock mode');
            this.initialized = false;
        } else {
            this.initialized = true;
            console.log('StepFun Agent initialized successfully with model:', this.model);
        }
    }

    /**
     * Generate AI response using StepFun model via OpenRouter API
     * @param {string} prompt - The prompt to send to the model
     * @param {object} options - Additional options (temperature, max_tokens, etc.)
     * @returns {Promise<string>} - AI generated response
     */
    async generateResponse(prompt, options = {}) {
        if (!this.initialized) {
            // Mock response for development/testing
            console.log('StepFun API key not configured, using mock response');
            return this.mockResponse(prompt);
        }

        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: options.temperature || 0.7,
                    max_tokens: options.max_tokens || 500,
                    ...options
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'http://localhost:5000',
                        'X-Title': 'Invoice Generator SaaS'
                    },
                    timeout: 30000
                }
            );

            return response.data.choices[0]?.message?.content || 'No response generated';
        } catch (error) {
            console.error('StepFun API error:', error.response?.data || error.message);
            // Fall back to mock response on API error
            return this.mockResponse(prompt);
        }
    }

    /**
     * Mock response for development when API key is not configured
     */
    mockResponse(prompt) {
        // Simple mock responses based on prompt content
        if (prompt.includes('invoice') && prompt.includes('analyze')) {
            return 'Analysis: This invoice shows healthy payment patterns. Customer has paid 8 out of 10 invoices on time. Consider offering a small discount for early payment to improve cash flow.';
        }
        if (prompt.includes('reminder') && prompt.includes('message')) {
            return 'Hi [Customer Name], this is a friendly reminder that your invoice #INV-2024-001 for ₹5,250 is due in 3 days. You can pay via UPI, bank transfer, or credit card. Let us know if you need any assistance!';
        }
        if (prompt.includes('payment') && prompt.includes('predict')) {
            return 'Prediction: Based on historical data, this customer has a 85% probability of paying within 7 days. Recommended action: Send a gentle reminder in 3 days.';
        }
        return 'This is a mock response from StepFun Agent. Please configure STEPFUN_API_KEY in .env file to use real AI capabilities.';
    }

    /**
     * Analyze invoice patterns and provide insights
     * @param {Array} invoices - Array of invoice documents
     * @param {object} customer - Customer information
     * @returns {Promise<string>} - Analysis insights
     */
    async analyzeInvoicePatterns(invoices, customer) {
        const prompt = `Analyze these invoice patterns and provide business insights:
Customer: ${customer.name || 'Unknown'} (${customer.email || 'No email'})
Total Invoices: ${invoices.length}
Total Amount: ₹${invoices.reduce((sum, inv) => sum + (inv.finalAmount || 0), 0)}
Paid Invoices: ${invoices.filter(inv => inv.status === 'paid').length}
Unpaid Invoices: ${invoices.filter(inv => inv.status === 'unpaid').length}

Recent invoices (last 5):
${invoices.slice(0, 5).map(inv => `- ${new Date(inv.createdAt).toLocaleDateString()}: ₹${inv.finalAmount} (${inv.status})`).join('\n')}

Please provide:
1. Payment behavior analysis
2. Risk assessment
3. Recommendations for improving collection
4. Suggested communication strategy`;

        return this.generateResponse(prompt, { temperature: 0.5 });
    }

    /**
     * Generate personalized reminder message for unpaid invoice
     * @param {object} invoice - Invoice document
     * @param {object} customer - Customer information
     * @returns {Promise<string>} - Personalized message
     */
    async generatePersonalizedReminder(invoice, customer) {
        const daysOverdue = invoice.dueDate ?
            Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)) : 0;

        const prompt = `Generate a friendly, professional WhatsApp reminder message for an unpaid invoice with these details:
Customer: ${customer.name}
Invoice: #${invoice._id.toString().slice(-6).toUpperCase()}
Amount: ₹${invoice.finalAmount}
Days overdue: ${daysOverdue > 0 ? `${daysOverdue} days` : 'Not yet due'}
Customer history: ${customer.totalInvoices || 0} total invoices, ${customer.totalPendingAmount || 0} pending amount

The message should be:
1. Polite and professional
2. Include invoice details
3. Offer payment options (UPI, bank transfer, etc.)
4. Provide assistance contact
5. Keep it under 200 characters for WhatsApp

Generate the message:`;

        return this.generateResponse(prompt, { temperature: 0.8, max_tokens: 150 });
    }

    /**
     * Predict payment probability for an invoice
     * @param {object} invoice - Invoice document
     * @param {object} customer - Customer information
     * @param {Array} history - Customer's payment history
     * @returns {Promise<object>} - Prediction with probability and recommendations
     */
    async predictPaymentProbability(invoice, customer, history) {
        const prompt = `Predict payment probability for this invoice:
Invoice Amount: ₹${invoice.finalAmount}
Customer: ${customer.name}
Customer's Payment History:
- Total invoices: ${history.length}
- Paid on time: ${history.filter(h => h.status === 'paid' && h.paidDate <= h.dueDate).length}
- Paid late: ${history.filter(h => h.status === 'paid' && h.paidDate > h.dueDate).length}
- Unpaid: ${history.filter(h => h.status === 'unpaid').length}
- Average days to pay: ${this.calculateAverageDays(history)}

Current invoice due date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Not set'}
Days since invoice: ${Math.floor((new Date() - new Date(invoice.createdAt)) / (1000 * 60 * 60 * 24))} days

Provide a JSON response with:
1. probability (0-100%)
2. predictedDaysToPay (integer)
3. riskLevel (low/medium/high)
4. recommendedActions (array of strings)
5. confidenceScore (0-1)`;

        const response = await this.generateResponse(prompt, { temperature: 0.3 });

        try {
            // Try to parse JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse JSON response:', e);
        }

        // Fallback response
        return {
            probability: 75,
            predictedDaysToPay: 7,
            riskLevel: 'medium',
            recommendedActions: ['Send reminder in 3 days', 'Offer early payment discount'],
            confidenceScore: 0.7
        };
    }

    /**
     * Calculate average days to pay from history
     */
    calculateAverageDays(history) {
        const paidInvoices = history.filter(h => h.status === 'paid' && h.paidDate && h.dueDate);
        if (paidInvoices.length === 0) return 'N/A';

        const totalDays = paidInvoices.reduce((sum, inv) => {
            const days = Math.floor((new Date(inv.paidDate) - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
            return sum + Math.max(0, days); // Only count positive days (late payments)
        }, 0);

        return (totalDays / paidInvoices.length).toFixed(1);
    }
}

// Create singleton instance
const stepfunAgent = new StepFunAgent();

module.exports = stepfunAgent;