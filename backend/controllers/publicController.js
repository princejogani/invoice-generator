const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const User = require('../models/User');

// @desc    Get customer portal data
// @route   GET /api/public/portal/:token
// @access  Public
const getPortalData = async (req, res) => {
    try {
        const { token } = req.params;
        const customer = await Customer.findOne({ portalToken: token });

        if (!customer) {
            return res.status(404).json({ message: 'Portal link is invalid or expired.' });
        }

        const business = await User.findById(customer.userId).select('businessName tagline logo businessAddress businessPhone bankName accountNumber ifscCode upiId');
        const invoices = await Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 });

        res.json({
            customer,
            business,
            invoices
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPortalData };
