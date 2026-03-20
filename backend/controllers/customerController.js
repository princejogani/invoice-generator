const Customer = require('../models/Customer');

// @desc    Get all customers for a user
// @route   GET /api/customer/list
// @access  Private
const getCustomers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
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
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });

    if (customer) {
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
};

module.exports = { getCustomers, getCustomerById };
