const User = require('../models/User');
const Invoice = require('../models/Invoice');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { saveBase64Image } = require('../utils/fileUpload');

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
    try {
        // In SaaS, the current business context might be a parent user (for staff)
        const businessUser = await User.findById(req.businessId);
        const currentUser = await User.findById(req.user._id);

        if (currentUser && businessUser) {
            res.json({
                _id: currentUser._id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role,
                whatsappTemplate: businessUser.whatsappTemplate,
                businessName: businessUser.businessName,
                tagline: businessUser.tagline,
                gstin: businessUser.gstin,
                businessAddress: businessUser.businessAddress,
                businessPhone: businessUser.businessPhone,
                bankName: businessUser.bankName,
                accountNumber: businessUser.accountNumber,
                ifscCode: businessUser.ifscCode,
                upiId: businessUser.upiId,
                logo: businessUser.logo
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const businessUser = await User.findById(req.businessId);

        if (user && businessUser) {
            // Update personal details
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            await user.save();

            // Only update business details if the user is the owner (not staff)
            if (user.role !== 'staff') {
                businessUser.whatsappTemplate = req.body.whatsappTemplate || businessUser.whatsappTemplate;
                businessUser.businessName = req.body.businessName || businessUser.businessName;
                businessUser.tagline = req.body.tagline || businessUser.tagline;
                businessUser.gstin = req.body.gstin || businessUser.gstin;
                businessUser.businessAddress = req.body.businessAddress || businessUser.businessAddress;
                businessUser.businessPhone = req.body.businessPhone || businessUser.businessPhone;
                businessUser.bankName = req.body.bankName || businessUser.bankName;
                businessUser.accountNumber = req.body.accountNumber || businessUser.accountNumber;
                businessUser.ifscCode = req.body.ifscCode || businessUser.ifscCode;
                businessUser.upiId = req.body.upiId || businessUser.upiId;

                if (req.body.logo !== undefined) {
                    businessUser.logo = saveBase64Image(req.body.logo, 'logos', businessUser._id.toString());
                }

                await businessUser.save();
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                whatsappTemplate: businessUser.whatsappTemplate,
                businessName: businessUser.businessName,
                tagline: businessUser.tagline,
                gstin: businessUser.gstin,
                businessAddress: businessUser.businessAddress,
                businessPhone: businessUser.businessPhone,
                bankName: businessUser.bankName,
                accountNumber: businessUser.accountNumber,
                ifscCode: businessUser.ifscCode,
                upiId: businessUser.upiId,
                logo: businessUser.logo,
                token: generateToken(user._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin create a new user
// @route   POST /api/auth/create-user
// @access  Private/Admin
const adminCreateUser = async (req, res) => {
    const { name, email, password, businessName, gstin, businessAddress, businessPhone, logo } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: hashedPassword,
        businessName,
        gstin,
        businessAddress,
        businessPhone,
        role: 'user' // Default to shop owner
    });

    if (logo) {
        user.logo = saveBase64Image(logo, 'logos', user._id.toString());
    }

    await user.save();

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            businessName: user.businessName,
            logo: user.logo,
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
        if (req.body.logo !== undefined) {
            user.logo = saveBase64Image(req.body.logo, 'logos', user._id.toString());
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
            businessName: updatedUser.businessName,
            tagline: updatedUser.tagline,
            gstin: updatedUser.gstin,
            businessAddress: updatedUser.businessAddress,
            businessPhone: updatedUser.businessPhone,
            bankName: updatedUser.bankName,
            accountNumber: updatedUser.accountNumber,
            ifscCode: updatedUser.ifscCode,
            upiId: updatedUser.upiId,
            logo: updatedUser.logo,
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

        console.log('Fetching user:', user._id, 'Logo exists:', !!user.logo);

        const invoiceCount = await Invoice.countDocuments({ userId: user._id });
        res.json({ ...user, invoiceCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Store owner creates a staff account
// @route   POST /api/auth/staff
// @access  Private/User (Shop Owner)
const createStaff = async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const staff = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'staff',
        parentUserId: req.user._id,
        businessName: req.user.businessName,
        gstin: req.user.gstin,
        businessAddress: req.user.businessAddress,
        businessPhone: req.user.businessPhone
    });

    res.status(201).json({
        _id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role
    });
};

// @desc    Store owner gets all their staff
// @route   GET /api/auth/staff
// @access  Private/User (Shop Owner)
const getStaff = async (req, res) => {
    const staff = await User.find({ parentUserId: req.user._id, role: 'staff' }).select('-password');
    res.json(staff);
};

// @desc    Store owner deletes a staff account
// @route   DELETE /api/auth/staff/:id
// @access  Private/User (Shop Owner)
const deleteStaff = async (req, res) => {
    const staff = await User.findOne({ _id: req.params.id, parentUserId: req.user._id });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });

    await User.deleteOne({ _id: req.params.id });
    res.json({ message: 'Staff member removed successfully' });
};

// @desc    Admin impersonate user
// @route   GET /api/auth/impersonate/:id
// @access  Private/Admin
const impersonateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            businessName: user.businessName,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    adminCreateUser,
    getAllUsers,
    adminUpdateUser,
    getUserById,
    createStaff,
    getStaff,
    deleteStaff,
    impersonateUser
};
