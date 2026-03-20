const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

// @desc    Create a new invoice
// @route   POST /api/invoice/create
// @access  Private
const createInvoice = async (req, res) => {
    const { customerName, customerPhone, items, type, subtotal, gst, finalAmount } = req.body;

    // 1. Find or create customer
    let customer = await Customer.findOne({ userId: req.user._id, phone: customerPhone });

    if (!customer) {
        customer = await Customer.create({
            userId: req.user._id,
            name: customerName,
            phone: customerPhone,
        });
    }

    // 2. Create invoice
    const invoice = await Invoice.create({
        userId: req.user._id,
        customerId: customer._id,
        customerName,
        customerPhone,
        items,
        type,
        subtotal,
        gst,
        finalAmount,
    });

    // 3. Update customer stats
    customer.totalInvoices += 1;
    customer.totalPendingAmount += invoice.status === 'unpaid' ? finalAmount : 0;
    customer.lastTransactionDate = Date.now();
    await customer.save();

    res.status(201).json(invoice);
};

// @desc    Get all invoices for a user
// @route   GET /api/invoice/list
// @access  Private
const getInvoices = async (req, res) => {
    const invoices = await Invoice.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(invoices);
};

// @desc    Update invoice status
// @route   PATCH /api/invoice/status
// @access  Private
const updateInvoiceStatus = async (req, res) => {
    const { id, status } = req.body;

    const invoice = await Invoice.findOne({ _id: id, userId: req.user._id });

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

module.exports = { createInvoice, getInvoices, updateInvoiceStatus };
