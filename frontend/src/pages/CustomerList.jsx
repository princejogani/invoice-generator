import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Phone, Calendar, Search, Share2, Edit } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

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

    useEffect(() => {
        fetchCustomers();
    }, [page, search]);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/customer/list?page=${page}&search=${search}`);
            setCustomers(data.customers);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    }, [page, search]);

    const copyPortalLink = (customer) => {
        if (!customer?.portalToken) {
            toast.error('No portal token found for this customer');
            return;
        }
        const token = customer.portalToken;
        const link = `${window.location?.origin}/p/${token}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link)
                .then(() => toast.success('Portal link copied to clipboard!'))
                .catch(() => fallbackCopyToClipboard(link));
        } else {
            fallbackCopyToClipboard(link);
        }
    };

    const fallbackCopyToClipboard = (text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy')
                ? toast.success('Portal link copied to clipboard!')
                : toast.error('Failed to copy. Link: ' + text);
        } catch {
            toast.error('Failed to copy link');
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const handleEditClick = (customer) => {
        setEditingCustomer(customer);
        setEditName(customer.name);
        setEditPhone(customer.phone);
        setEditError('');
    };

    const handleCloseEdit = () => {
        setEditingCustomer(null);
        setEditName('');
        setEditPhone('');
        setEditError('');
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editPhone.trim()) {
            setEditError('Name and phone are required');
            return;
        }

        setEditLoading(true);
        setEditError('');
        try {
            await api.put(`/customer/${editingCustomer._id}`, {
                name: editName.trim(),
                phone: editPhone.trim()
            });
            setCustomers(customers.map(cust =>
                cust._id === editingCustomer._id
                    ? { ...cust, name: editName.trim(), phone: editPhone.trim() }
                    : cust
            ));
            toast.success('Customer updated successfully!');
            handleCloseEdit();
        } catch (err) {
            console.error('Update failed:', err);
            setEditError(err.response?.data?.message || 'Failed to update customer');
        } finally {
            setEditLoading(false);
        }
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
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customers.map((customer) => (
                            <div key={customer._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{customer.name}</h3>
                                        <div className="flex items-center text-slate-500 text-sm">
                                            <Phone size={14} className="mr-1" />
                                            {customer.phone}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Total Invoices</span>
                                        <span className="font-bold text-slate-800">{customer.totalInvoices}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Pending Amount</span>
                                        <span className="font-bold text-orange-600">₹{customer.totalPendingAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400 mt-4">
                                        <Calendar size={12} className="mr-1" />
                                        <span>Last transaction: {customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString() : 'Never'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-6">
                                    <button
                                        onClick={() => navigate(`/invoices?search=${customer.phone}`)}
                                        className="flex-1 bg-slate-50 text-slate-700 py-2 rounded font-medium hover:bg-slate-100 transition border border-slate-200"
                                    >
                                        View History
                                    </button>
                                    <button
                                        onClick={() => handleEditClick(customer)}
                                        className="bg-amber-50 text-amber-600 px-3 py-2 rounded font-medium hover:bg-amber-100 transition border border-amber-100"
                                        title="Edit Customer"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => copyPortalLink(customer)}
                                        className="bg-blue-50 text-blue-600 px-3 py-2 rounded font-medium hover:bg-blue-100 transition border border-blue-100"
                                        title="Copy Portal Link"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!loading && customers.length === 0 && (
                        <div className="text-center p-20 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">No customers found. They will appear here when you create invoices.</p>
                        </div>
                    )}

                    {!loading && customers.length > 0 && (
                        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                Showing {customers.length} of {totalItems} customers
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="flex items-center px-4 text-sm font-medium text-slate-700">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }} className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Edit Customer</h3>
                            <p className="text-slate-500 mb-6">Update customer name and phone number</p>

                            {editError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                    {editError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Enter customer name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={editPhone}
                                        onChange={(e) => setEditPhone(e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={handleCloseEdit}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
                                    disabled={editLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
                                    disabled={editLoading}
                                >
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
