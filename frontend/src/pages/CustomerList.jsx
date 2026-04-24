import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Share2, Edit, MoreVertical, History } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState('');
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuRef = useRef(null);

    useEffect(() => { fetchCustomers(); }, [page, search]);

    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/customer/list?page=${page}&search=${search}`);
            setCustomers(data.customers);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [page, search]);

    const toggleMenu = (e, id) => {
        if (openMenu === id) { setOpenMenu(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({
            top: rect.bottom + window.scrollY + 4,
            left: rect.right + window.scrollX - 160,
        });
        setOpenMenu(id);
    };

    const copyPortalLink = (customer) => {
        setOpenMenu(null);
        if (!customer?.portalToken) { toast.error('No portal token found'); return; }
        const link = `${window.location?.origin}/p/${customer.portalToken}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(link)
                .then(() => toast.success('Portal link copied!'))
                .catch(() => fallbackCopy(link));
        } else { fallbackCopy(link); }
    };

    const fallbackCopy = (text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? toast.success('Copied!') : toast.error('Failed to copy'); }
        catch { toast.error('Failed to copy'); }
        finally { document.body.removeChild(ta); }
    };

    const handleEditClick = (customer) => {
        setOpenMenu(null);
        setEditingCustomer(customer);
        setEditName(customer.name);
        setEditPhone(customer.phone);
        setEditError('');
    };

    const handleCloseEdit = () => { setEditingCustomer(null); setEditName(''); setEditPhone(''); setEditError(''); };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editPhone.trim()) { setEditError('Name and phone are required'); return; }
        setEditLoading(true); setEditError('');
        try {
            await api.put(`/customer/${editingCustomer._id}`, { name: editName.trim(), phone: editPhone.trim() });
            setCustomers(customers.map(c => c._id === editingCustomer._id ? { ...c, name: editName.trim(), phone: editPhone.trim() } : c));
            toast.success('Customer updated!');
            handleCloseEdit();
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update customer');
        } finally { setEditLoading(false); }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Customers (CRM)</h1>
                <div className="w-full md:w-64 relative">
                    <input
                        type="text"
                        placeholder="Search customers..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
            </div>

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
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Phone</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Invoices</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Pending Amount</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Last Transaction</th>
                                        <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {customers.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="text-center py-16 text-slate-400">
                                                No customers found. They will appear here when you create invoices.
                                            </td>
                                        </tr>
                                    ) : customers.map((customer, i) => (
                                        <tr key={customer._id} className="hover:bg-slate-50 transition">
                                            <td className="px-4 py-3 text-slate-400">{(page - 1) * 10 + i + 1}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{customer.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{customer.phone}</td>
                                            <td className="px-4 py-3 text-slate-700 font-semibold">{customer.totalInvoices}</td>
                                            <td className="px-4 py-3 font-semibold text-orange-600">₹{customer.totalPendingAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-slate-500">{customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString('en-IN') : '—'}</td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={(e) => toggleMenu(e, customer._id)}
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

                    {!loading && customers.length > 0 && (
                        <div className="mt-4 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">Showing {customers.length} of {totalItems} customers</p>
                            <div className="flex space-x-2">
                                <button disabled={page === 1} onClick={() => setPage(page - 1)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Previous</button>
                                <span className="flex items-center px-4 text-sm font-medium text-slate-700">Page {page} of {totalPages}</span>
                                <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Next</button>
                            </div>
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
                        const customer = customers.find(c => c._id === openMenu);
                        if (!customer) return null;
                        return (
                            <>
                                <button
                                    onClick={() => { setOpenMenu(null); navigate(`/invoices?search=${customer.phone}`); }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <History size={14} /> View History
                                </button>
                                <button
                                    onClick={() => handleEditClick(customer)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Edit size={14} /> Edit Customer
                                </button>
                                <button
                                    onClick={() => copyPortalLink(customer)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                    <Share2 size={14} /> Copy Portal Link
                                </button>
                            </>
                        );
                    })()}
                </div>
            )}

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} className="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Edit Customer</h3>
                            <p className="text-slate-500 mb-6">Update customer name and phone number</p>
                            {editError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{editError}</div>}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                                    <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Enter customer name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Enter phone number" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-8">
                                <button onClick={handleCloseEdit} disabled={editLoading}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition">Cancel</button>
                                <button onClick={handleSaveEdit} disabled={editLoading}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50">
                                    {editLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
