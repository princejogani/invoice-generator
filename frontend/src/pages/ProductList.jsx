import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        unit: 'pcs',
        taxRate: 0,
        sku: '',
        category: '',
        isActive: true
    });

    useEffect(() => {
        fetchProducts();
    }, [page, search]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/product/list?page=${page}&search=${search}`);
            setProducts(data.products);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/product/${editingProduct._id}`, formData);
            } else {
                await api.post('/product/create', formData);
            }
            setShowForm(false);
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                price: '',
                unit: 'pcs',
                taxRate: 0,
                sku: '',
                category: '',
                isActive: true
            });
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to save product');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            unit: product.unit,
            taxRate: product.taxRate,
            sku: product.sku,
            category: product.category,
            isActive: product.isActive
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/product/${id}`);
            fetchProducts();
        } catch (err) {
            console.error(err);
            alert('Failed to delete product');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            unit: 'pcs',
            taxRate: 0,
            sku: '',
            category: '',
            isActive: true
        });
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Product Catalog</h1>
                    <p className="text-slate-500 mt-1">Manage products for quick invoice creation</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full md:w-64 relative">
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        <Plus size={18} />
                        Add Product
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        {editingProduct ? 'Edit Product' : 'Create New Product'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹) *</label>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    step="0.01"
                                    min="0"
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                                <input
                                    type="text"
                                    name="sku"
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.sku}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                <select
                                    name="unit"
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.unit}
                                    onChange={handleInputChange}
                                >
                                    <option value="pcs">Pieces</option>
                                    <option value="kg">Kilogram</option>
                                    <option value="litre">Litre</option>
                                    <option value="meter">Meter</option>
                                    <option value="hour">Hour</option>
                                    <option value="service">Service</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">GST % <span className="text-slate-400 font-normal">(default for this product)</span></label>
                                <input
                                    type="number"
                                    name="taxRate"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    placeholder="e.g. 18"
                                    className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.taxRate}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                name="description"
                                rows="2"
                                className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.description}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="isActive"
                                id="isActive"
                                className="w-4 h-4 text-blue-600 rounded"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="isActive" className="ml-2 text-sm text-slate-700">
                                Product is active (available for selection)
                            </label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                {editingProduct ? 'Update Product' : 'Create Product'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-3 rounded-full ${product.isActive ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-800">{product.name}</h3>
                                            <div className="flex items-center text-slate-500 text-sm">
                                                <Tag size={12} className="mr-1" />
                                                {product.category || 'Uncategorized'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Edit"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Price</span>
                                        <span className="font-bold text-slate-800 flex items-center">
                                            ₹{product.price.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Unit</span>
                                        <span className="font-medium text-slate-700">{product.unit}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">GST</span>
                                        <span className="font-medium text-slate-700">{product.taxRate}%</span>
                                    </div>
                                    {product.sku && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">SKU</span>
                                            <span className="font-mono text-slate-700">{product.sku}</span>
                                        </div>
                                    )}
                                    {product.description && (
                                        <div className="pt-2 text-slate-600 text-xs">
                                            {product.description}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button
                                        onClick={() => navigate('/invoices/create', { state: { selectedProduct: product } })}
                                        className="flex-1 bg-blue-50 text-blue-700 py-2 rounded font-medium hover:bg-blue-100 transition border border-blue-200"
                                    >
                                        Use in Invoice
                                    </button>
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="flex-1 bg-slate-50 text-slate-700 py-2 rounded font-medium hover:bg-slate-100 transition border border-slate-200"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {products.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <Package className="mx-auto text-slate-300" size={64} />
                            <h3 className="text-xl font-medium text-slate-500 mt-4">No products found</h3>
                            <p className="text-slate-400 mt-2">Create your first product to speed up invoice creation</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                <Plus size={18} />
                                Add Product
                            </button>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-12">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <span className="text-slate-700">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProductList;