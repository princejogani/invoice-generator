const Customer = require('../models/Customer');

// @desc    Get all customers for a user
// @route   GET /api/customer/list
// @access  Private
const getCustomers = async (req, res) => {
    const customers = await Customer.find({ userId: req.user._id });
    res.json(customers);
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
