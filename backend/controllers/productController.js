const Product = require('../models/Product');

// @desc    Get all products for a user
// @route   GET /api/product/list
// @access  Private
const getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    const query = { userId: req.businessId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ];
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        products,
        page,
        pages: Math.ceil(total / limit),
        total
    });
};

// @desc    Get single product by ID
// @route   GET /api/product/:id
// @access  Private
const getProductById = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, userId: req.businessId });

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: 'Product not found' });
    }
};

// @desc    Create a new product
// @route   POST /api/product/create
// @access  Private
const createProduct = async (req, res) => {
    const { name, description, price, unit, taxRate, sku, category, isActive } = req.body;

    if (!name || price === undefined) {
        return res.status(400).json({ message: 'Name and price are required' });
    }

    const product = new Product({
        userId: req.businessId,
        name,
        description: description || '',
        price: parseFloat(price),
        unit: unit || 'pcs',
        taxRate: taxRate || 0,
        sku: sku || '',
        category: category || '',
        isActive: isActive !== undefined ? isActive : true
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
};

// @desc    Update a product
// @route   PUT /api/product/:id
// @access  Private
const updateProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, userId: req.businessId });

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    const { name, description, price, unit, taxRate, sku, category, isActive } = req.body;

    product.name = name !== undefined ? name : product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? parseFloat(price) : product.price;
    product.unit = unit !== undefined ? unit : product.unit;
    product.taxRate = taxRate !== undefined ? taxRate : product.taxRate;
    product.sku = sku !== undefined ? sku : product.sku;
    product.category = category !== undefined ? category : product.category;
    product.isActive = isActive !== undefined ? isActive : product.isActive;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();
    res.json(updatedProduct);
};

// @desc    Delete a product
// @route   DELETE /api/product/:id
// @access  Private
const deleteProduct = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, userId: req.businessId });

    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.json({ message: 'Product removed' });
};

// @desc    Get products for dropdown (minimal fields)
// @route   GET /api/product/dropdown
// @access  Private
const getProductDropdown = async (req, res) => {
    const products = await Product.find(
        { userId: req.businessId, isActive: true },
        { _id: 1, name: 1, price: 1, unit: 1, taxRate: 1 }
    ).sort({ name: 1 });

    res.json(products);
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductDropdown
};