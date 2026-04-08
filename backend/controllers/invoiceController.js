const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const User = require('../models/User');
const { sendInvoiceWhatsApp } = require('../utils/whatsappUtils');
const { generateInvoicePDFBuffer } = require('../utils/pdfUtils');
const { generatePaymentToken } = require('../utils/upiUtils');

// @desc    Create a new invoice
// @route   POST /api/invoice/create
// @access  Private
const createInvoice = async (req, res) => {
    const {
        customerName,
        customerPhone: rawPhone,
        items,
        type,
        subtotal,
        gst,
        gstPercentage,
        adjustments,
        adjustment, // For backward compatibility
        finalAmount,
        isDraft = false
    } = req.body;

    const customerPhone = rawPhone.trim();

    // 1. Find or create customer
    let customer = await Customer.findOne({ userId: req.businessId, phone: customerPhone });

    if (!customer) {
        customer = await Customer.create({
            userId: req.businessId,
            name: customerName,
            phone: customerPhone,
        });
    }

    // Handle backward compatibility: if adjustments is not provided but adjustment is, convert it
    let invoiceAdjustments = adjustments || [];

    // If old adjustment format is provided (for backward compatibility), convert it
    if (!adjustments && adjustment && adjustment.type !== 'none') {
        const label = adjustment.type === 'percent' ? 'Adjustment (%)' : 'Adjustment';
        const operation = adjustment.value >= 0 ? 'add' : 'subtract';
        const absValue = Math.abs(adjustment.value);

        invoiceAdjustments = [{
            label,
            value: absValue,
            type: adjustment.type === 'percent' ? 'percent' : 'fixed',
            operation
        }];
    }

    // 2. Create invoice
    const invoice = await Invoice.create({
        userId: req.businessId,
        customerId: customer._id,
        customerName,
        customerPhone,
        items,
        type,
        subtotal,
        gstPercentage: gstPercentage || 0,
        gst,
        adjustments: invoiceAdjustments,
        finalAmount,
        isDraft,
        upiPaymentToken: generatePaymentToken(),
    });

    // 3. Update customer stats only for non-draft invoices
    if (!isDraft) {
        customer.totalInvoices += 1;
        customer.totalPendingAmount += invoice.status === 'unpaid' ? finalAmount : 0;
        customer.lastTransactionDate = Date.now();
        await customer.save();
    }

    res.status(201).json(invoice);
};

// @desc    Get all invoices for a user
// @route   GET /api/invoice/list
// @access  Private
const getInvoices = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const draft = req.query.draft;
    const skip = (page - 1) * limit;

    try {
        const pipeline = [
            { $match: { userId: new mongoose.Types.ObjectId(req.businessId) } }
        ];

        // Filter by draft status if provided
        if (draft !== undefined && draft !== 'all') {
            const isDraft = draft === 'true';
            pipeline.push({
                $match: { isDraft: isDraft }
            });
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            pipeline.push({
                $addFields: {
                    idString: { $toString: "$_id" }
                }
            });
            pipeline.push({
                $match: {
                    $or: [
                        { customerName: { $regex: escapedSearch, $options: 'i' } },
                        { customerPhone: { $regex: escapedSearch, $options: 'i' } },
                        { idString: { $regex: escapedSearch, $options: 'i' } }
                    ]
                }
            });
        }

        const countPipeline = [...pipeline, { $count: "total" }];
        const totalResult = await Invoice.aggregate(countPipeline);
        const total = totalResult[0]?.total || 0;

        const invoices = await Invoice.aggregate([
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        res.json({
            invoices,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update invoice status
// @route   PATCH /api/invoice/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
    const { id, status } = req.body;

    const invoice = await Invoice.findOne({ _id: id, userId: req.businessId });

    if (invoice) {
        const oldStatus = invoice.status;
        invoice.status = status;
        await invoice.save();

        // Update customer pending amount if status changed
        if (oldStatus !== status) {
            const customer = await Customer.findById(invoice.customerId);
            if (customer) {
                if (status === 'paid') {
                    customer.totalPendingAmount -= invoice.finalAmount;
                } else {
                    customer.totalPendingAmount += invoice.finalAmount;
                }
                await customer.save();
            }
        }

        res.json(invoice);
    } else {
        res.status(404).json({ message: 'Invoice not found' });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/invoice/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.businessId);

        const [invoiceStats, customerCount] = await Promise.all([
            Invoice.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        totalInvoices: { $sum: 1 },
                        paidAmount: {
                            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$finalAmount", 0] }
                        },
                        pendingAmount: {
                            $sum: { $cond: [{ $eq: ["$status", "unpaid"] }, "$finalAmount", 0] }
                        }
                    }
                }
            ]),
            Customer.countDocuments({ userId })
        ]);

        const stats = invoiceStats[0] || { totalInvoices: 0, paidAmount: 0, pendingAmount: 0 };

        res.json({
            totalInvoices: stats.totalInvoices,
            paidAmount: stats.paidAmount,
            pendingAmount: stats.pendingAmount,
            totalCustomers: customerCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Export invoices as CSV
// @route   GET /api/invoice/export
// @access  Private
const exportInvoices = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.businessId);
        const { startDate, endDate } = req.query;

        let query = { userId };
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const invoices = await Invoice.find(query).sort({ createdAt: -1 });

        // Manually build CSV
        let csv = 'Date,InvoiceNo,Customer,Phone,Type,Subtotal,GST,Adjustment,FinalAmount,Status\n';
        invoices.forEach(inv => {
            const date = new Date(inv.createdAt).toLocaleDateString('en-IN');
            const invNo = inv._id.toString().slice(-6).toUpperCase();
            // Escape commas in customer name
            const escapedName = inv.customerName.replace(/"/g, '""');

            // Calculate total adjustment amount (for backward compatibility)
            let totalAdjustment = 0;

            // New adjustments array
            if (inv.adjustments && inv.adjustments.length > 0) {
                inv.adjustments.forEach(adj => {
                    let amount = 0;
                    if (adj.type === 'percent') {
                        amount = (inv.subtotal * adj.value) / 100;
                    } else {
                        amount = adj.value;
                    }

                    if (adj.operation === 'subtract') {
                        totalAdjustment -= amount;
                    } else {
                        totalAdjustment += amount;
                    }
                });
            }
            // Old adjustment object (backward compatibility)
            else if (inv.adjustment && inv.adjustment.value !== 0) {
                if (inv.adjustment.type === 'percent') {
                    totalAdjustment = (inv.subtotal * inv.adjustment.value) / 100;
                } else {
                    totalAdjustment = inv.adjustment.value;
                }
            }

            csv += `${date},#${invNo},"${escapedName}",${inv.customerPhone},${inv.type},${inv.subtotal},${inv.gst},${totalAdjustment},${inv.finalAmount},${inv.status}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=gst_report_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Convert draft invoice to final invoice
// @route   PATCH /api/invoice/convert-draft
// @access  Private
const convertDraftToFinal = async (req, res) => {
    const { id, sendWhatsApp = false } = req.body;

    const invoice = await Invoice.findOne({ _id: id, userId: req.businessId, isDraft: true });

    if (!invoice) {
        return res.status(404).json({ message: 'Draft invoice not found' });
    }

    try {
        // Update invoice to final
        invoice.isDraft = false;
        await invoice.save();

        // Update customer stats (since draft invoices don't update stats)
        const customer = await Customer.findById(invoice.customerId);
        if (customer) {
            customer.totalInvoices += 1;
            customer.totalPendingAmount += invoice.status === 'unpaid' ? invoice.finalAmount : 0;
            customer.lastTransactionDate = Date.now();
            await customer.save();
        }

        // Send WhatsApp if requested
        if (sendWhatsApp) {
            try {
                const user = await User.findById(req.businessId);

                const invNo = `#${invoice._id.toString().slice(-6).toUpperCase()}`;
                const upiInstructions = user.upiId
                    ? `\n\n💳 *Pay via UPI*\nUPI ID: *${user.upiId}*\nAmount: *₹${invoice.finalAmount.toLocaleString()}*\nRef: ${invNo}\n\nOpen PhonePe / GPay / Paytm → Send Money → Enter UPI ID above`
                    : '';

                let finalMessage = user.whatsappTemplate;
                if (!finalMessage) {
                    finalMessage = `Hello ${invoice.customerName}, your invoice ${invNo} for ₹${invoice.finalAmount.toLocaleString()} is ready.`;
                    finalMessage += upiInstructions;
                } else {
                    finalMessage = finalMessage
                        .replace(/\{\{customerName\}\}/g, invoice.customerName)
                        .replace(/\{\{amount\}\}/g, `₹${invoice.finalAmount.toLocaleString()}`)
                        .replace(/\{\{businessName\}\}/g, user.businessName || user.name || '')
                        .replace(/\{\{invoiceNo\}\}/g, invNo)
                        .replace(/\{\{paymentLink\}\}/g, user.upiId || '');
                    if (user.upiId && !user.whatsappTemplate.includes('{{paymentLink}}')) {
                        finalMessage += upiInstructions;
                    }
                }

                // Generate PDF Buffer
                const pdfBuffer = await generateInvoicePDFBuffer(invoice, user);

                // Send with PDF
                await sendInvoiceWhatsApp(
                    req.businessId.toString(),
                    invoice.customerPhone,
                    finalMessage,
                    pdfBuffer
                );

                invoice.sentOnWhatsapp = true;
                await invoice.save();
            } catch (whatsappError) {
                console.error('WhatsApp sending failed:', whatsappError);
                // Don't fail the whole request if WhatsApp sending fails
            }
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update invoice details
// @route   PUT /api/invoice/update
// @access  Private
const updateInvoice = async (req, res) => {
    const {
        id,
        customerName,
        customerPhone: rawPhone,
        items,
        type,
        subtotal,
        gst,
        gstPercentage,
        adjustments,
        finalAmount,
        isDraft
    } = req.body;

    try {
        const invoice = await Invoice.findOne({ _id: id, userId: req.businessId });

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        // If converting from draft to final, update customer stats
        const wasDraft = invoice.isDraft;
        const willBeFinal = isDraft === false;

        // Update invoice fields
        if (customerName !== undefined) invoice.customerName = customerName;
        if (rawPhone !== undefined) {
            const customerPhone = rawPhone.trim();
            invoice.customerPhone = customerPhone;

            // Update customer if phone changed
            if (customerPhone !== invoice.customerPhone) {
                let customer = await Customer.findById(invoice.customerId);
                if (customer) {
                    customer.phone = customerPhone;
                    if (customerName !== undefined) customer.name = customerName;
                    await customer.save();
                }
            }
        }
        if (items !== undefined) invoice.items = items;
        if (type !== undefined) invoice.type = type;
        if (subtotal !== undefined) invoice.subtotal = subtotal;
        if (gst !== undefined) invoice.gst = gst;
        if (gstPercentage !== undefined) invoice.gstPercentage = gstPercentage;
        if (adjustments !== undefined) invoice.adjustments = adjustments;
        if (finalAmount !== undefined) invoice.finalAmount = finalAmount;
        if (isDraft !== undefined) invoice.isDraft = isDraft;

        await invoice.save();

        // If converting from draft to final, update customer stats
        if (wasDraft && willBeFinal) {
            const customer = await Customer.findById(invoice.customerId);
            if (customer) {
                customer.totalInvoices += 1;
                customer.totalPendingAmount += invoice.status === 'unpaid' ? invoice.finalAmount : 0;
                customer.lastTransactionDate = Date.now();
                await customer.save();
            }
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Record a payment against an invoice
// @route   POST /api/invoice/payment
// @access  Private
const recordPayment = async (req, res) => {
    const { id, amount, method } = req.body;
    if (!id || !amount || !method) return res.status(400).json({ message: 'id, amount and method are required' });

    try {
        const invoice = await Invoice.findOne({ _id: id, userId: req.businessId });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        const user = req.user;

        invoice.payments.push({
            amount: Number(amount),
            method,
            recordedBy: user?._id,
            recordedByName: user?.name || user?.email || 'Unknown',
        });

        invoice.paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

        if (invoice.paidAmount >= invoice.finalAmount) {
            invoice.status = 'paid';
            invoice.paidAmount = invoice.finalAmount;
        } else if (invoice.paidAmount > 0) {
            invoice.status = 'partial';
        } else {
            invoice.status = 'unpaid';
        }

        await invoice.save();

        // Update customer pending amount
        const customer = await Customer.findById(invoice.customerId);
        if (customer) {
            customer.totalPendingAmount = Math.max(0, invoice.finalAmount - invoice.paidAmount);
            await customer.save();
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Business owner verifies and confirms a customer UPI payment claim
// @route   POST /api/invoice/verify-upi-payment
// @access  Private
const verifyUpiPayment = async (req, res) => {
    const { id } = req.body;
    try {
        const invoice = await Invoice.findOne({ _id: id, userId: req.businessId });
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        if (invoice.status === 'paid') return res.status(400).json({ message: 'Invoice already paid' });
        if (!invoice.upiClaimedAt) return res.status(400).json({ message: 'No payment claim found for this invoice' });

        invoice.status = 'paid';
        invoice.paidAmount = invoice.finalAmount;
        invoice.payments.push({
            amount: invoice.finalAmount,
            method: 'ONLINE',
            recordedByName: req.user?.name || 'Business Owner (UPI Verified)',
            date: new Date(),
        });
        await invoice.save();

        const customer = await Customer.findById(invoice.customerId);
        if (customer) {
            customer.totalPendingAmount = Math.max(0, customer.totalPendingAmount - invoice.finalAmount);
            await customer.save();
        }

        // Send WhatsApp confirmation to customer
        const user = await User.findById(req.businessId);
        if (user) {
            try {
                const invNo = invoice._id.toString().slice(-6).toUpperCase();
                const msg =
                    `✅ *Payment Received & Verified!*

Hi ${invoice.customerName}, your UPI payment of *₹${invoice.finalAmount.toLocaleString()}* for Invoice *#${invNo}* has been verified and confirmed.

Thank you for your payment! 🙏

— ${user.businessName || user.name}`;
                await sendInvoiceWhatsApp(invoice.userId.toString(), invoice.customerPhone, msg, null);
            } catch (waErr) {
                console.error('Customer WhatsApp notification failed:', waErr.message);
            }
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get payment history for an invoice
// @route   GET /api/invoice/:id/payments
// @access  Private
const getPayments = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.businessId }).select('payments paidAmount finalAmount status customerName');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createInvoice, getInvoices, updateInvoiceStatus, getDashboardStats, exportInvoices, convertDraftToFinal, updateInvoice, recordPayment, getPayments, verifyUpiPayment };
