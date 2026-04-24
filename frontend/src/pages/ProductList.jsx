import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Plus, Edit, Trash2, MoreVertical, FileText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

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
            toast.error('Failed to save product');
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

    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggleMenu = (e, id) => {
        if (openMenu === id) { setOpenMenu(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right + window.scrollX - 160,
        });
        setOpenMenu(id);
    };

    const handleDelete = async (id) => {
        if (deleteConfirm !== id) { setDeleteConfirm(id); return; }
        try {
            await api.delete(`/product/${id}`);
            toast.success('Product deleted!');
            setDeleteConfirm(null);
            fetchProducts();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete product');
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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">#</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Category</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Price</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Unit</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">GST %</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">SKU</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="text-center py-16 text-slate-400">
                                                No products found. Add your first product to speed up invoice creation.
                                            </td>
                                        </tr>
                                    ) : products.map((product, i) => (
                                        <tr key={product._id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 text-slate-400">{(page - 1) * 10 + i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{product.name}</td>
                                            <td className="px-4 py-3 text-slate-500">{product.category || '—'}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">₹{product.price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-slate-600">{product.unit}</td>
                                            <td className="px-4 py-3 text-slate-600">{product.taxRate}%</td>
                                            <td className="px-4 py-3 text-slate-500 font-mono">{product.sku || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => toggleMenu(e, product._id)}
                                                    className="p-1.5 rounded hover:bg-slate-100 text-slate-500 transition"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-4">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50">Previous</button>
                            <span className="text-slate-700 text-sm">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                                className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50">Next</button>
                        </div>
                    )}
                </>
            )}

            {/* Dropdown Menu — fixed position to avoid scrollbar */}
            {openMenu && (
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 9999, width: 160 }}
                    className="bg-white border border-slate-200 rounded-lg shadow-lg py-1"
                >
                    {(() => {
                        const product = products.find(p => p._id === openMenu);
                        if (!product) return null;
                        return (
                            <>
                                {/* <button
                                    onClick={() => { setOpenMenu(null); navigate('/invoices/create', { state: { selectedProduct: product } }); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <FileText size={14} /> Use in Invoice
                                </button> */}
                                <button
                                    onClick={() => { setOpenMenu(null); handleEdit(product); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Edit size={14} /> Edit Product
                                </button>
                                <button
                                    onClick={() => { setOpenMenu(null); handleDelete(product._id); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 size={14} />
                                    {deleteConfirm === product._id ? 'Click again to confirm' : 'Delete Product'}
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default ProductList;