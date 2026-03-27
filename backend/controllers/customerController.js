const Customer = require('../models/Customer');

// @desc    Get all customers for a user
// @route   GET /api/customer/list
// @access  Private
const getCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { userId: req.businessId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        customers,
        page,
        pages: Math.ceil(total / limit),
        total
    });
};

// @desc    Get single customer by ID
// @route   GET /api/customer/:id
// @access  Private
const getCustomerById = async (req, res) => {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.businessId });

    if (customer) {
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
};

// @desc    Update customer details
// @route   PUT /api/customer/:id
// @access  Private
const updateCustomer = async (req, res) => {
    try {
        const { name, phone } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }

        const customer = await Customer.findOne({ _id: req.params.id, userId: req.businessId });

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check if phone is being changed to a number that already exists for this user
        if (phone !== customer.phone) {
            const existingCustomer = await Customer.findOne({
                userId: req.businessId,
                phone: phone,
                _id: { $ne: req.params.id }
            });

            if (existingCustomer) {
                return res.status(400).json({ message: 'Phone number already exists for another customer' });
            }
        }

        customer.name = name;
        customer.phone = phone;

        const updatedCustomer = await customer.save();

        res.json(updatedCustomer);
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCustomers, getCustomerById, updateCustomer };
