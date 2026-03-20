import api from '../api';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Calendar, Search, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useEffect } from 'react';

const CustomerList = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchCustomers();
    }, [page, search]);

    const fetchCustomers = async () => {
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
    };

    const copyPortalLink = (customer) => {
        const token = customer.portalToken || '';
        const link = `${window.location.origin}/p/${token}`;
        navigator.clipboard.writeText(link);
        alert('Historical portal link copied to clipboard!');
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
        </div>
    );
};

export default CustomerList;
