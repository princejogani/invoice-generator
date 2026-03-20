const User = require('../models/User');
const Invoice = require('../models/Invoice');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, businessName, gstin, businessAddress, businessPhone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        businessName,
        gstin,
        businessAddress,
        businessPhone
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            whatsappTemplate: user.whatsappTemplate,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            whatsappTemplate: user.whatsappTemplate,
            businessName: user.businessName,
            gstin: user.gstin,
            businessAddress: user.businessAddress,
            businessPhone: user.businessPhone
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.whatsappTemplate = req.body.whatsappTemplate || user.whatsappTemplate;

        // Only admins can update business details
        if (user.role === 'admin') {
            user.businessName = req.body.businessName || user.businessName;
            user.gstin = req.body.gstin || user.gstin;
            user.businessAddress = req.body.businessAddress || user.businessAddress;
            user.businessPhone = req.body.businessPhone || user.businessPhone;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            whatsappTemplate: updatedUser.whatsappTemplate,
            businessName: updatedUser.businessName,
            gstin: updatedUser.gstin,
            businessAddress: updatedUser.businessAddress,
            businessPhone: updatedUser.businessPhone,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Admin create a new user
// @route   POST /api/auth/create-user
// @access  Private/Admin
const adminCreateUser = async (req, res) => {
    const { name, email, password, businessName, gstin, businessAddress, businessPhone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        businessName,
        gstin,
        businessAddress,
        businessPhone,
        role: 'user' // Default to shop owner
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            businessName: user.businessName,
            message: 'User created successfully'
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Admin get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { role: 'user' }; // Only show shop owners
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { businessName: { $regex: search, $options: 'i' } }
        ];
    }

    try {
        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Add invoice counts for each user
        const usersWithCounts = await Promise.all(users.map(async (u) => {
            const invoiceCount = await Invoice.countDocuments({ userId: u._id });
            return { ...u, invoiceCount };
        }));

        res.json({
            users: usersWithCounts,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin update any user
// @route   PUT /api/auth/user/:id
// @access  Private/Admin
const adminUpdateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.businessName = req.body.businessName || user.businessName;
        user.tagline = req.body.tagline || user.tagline;
        user.gstin = req.body.gstin || user.gstin;
        user.businessAddress = req.body.businessAddress || user.businessAddress;
        user.businessPhone = req.body.businessPhone || user.businessPhone;
        user.bankName = req.body.bankName || user.bankName;
        user.accountNumber = req.body.accountNumber || user.accountNumber;
        user.ifscCode = req.body.ifscCode || user.ifscCode;
        user.upiId = req.body.upiId || user.upiId;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            businessName: updatedUser.businessName,
            message: 'User updated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin get user by ID
// @route   GET /api/auth/user/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password').lean();
        if (!user) return res.status(404).json({ message: 'User not found' });

        const invoiceCount = await Invoice.countDocuments({ userId: user._id });
        res.json({ ...user, invoiceCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile, adminCreateUser, getAllUsers, adminUpdateUser, getUserById };
