import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { Download, CheckCircle, XCircle, ExternalLink, Search, FileDown } from 'lucide-react';

const InvoiceList = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchInvoices();
    }, [page, search]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/invoice/list?page=${page}&search=${search}`);
            setInvoices(data.invoices);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.patch('/invoice/status', {
                id,
                status: currentStatus === 'paid' ? 'unpaid' : 'paid'
            });
            fetchInvoices();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDownload = async (invoice) => {
        try {
            const response = await api.get(`/whatsapp/download/${invoice._id}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoice._id.slice(-6)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download failed', err);
            alert('Failed to download PDF');
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await api.get('/invoice/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `gst_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Export failed', err);
            alert('Failed to export report');
        }
    };

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Invoices</h1>

                <div className="flex flex-col md:flex-row w-full md:w-auto gap-4">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search customer name..."
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
                        onClick={handleExportCSV}
                        className="flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 border border-slate-200 transition text-center"
                    >
                        <FileDown size={18} />
                        <span className="hidden md:inline">Export Report</span>
                        <span className="md:hidden">Export</span>
                    </button>
                    <Link to="/invoices/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition text-center flex items-center justify-center">
                        + New Invoice
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-sm font-bold text-slate-600">ID</th>
                                <th className="p-4 text-sm font-bold text-slate-600">Customer</th>
                                <th className="p-4 text-sm font-bold text-slate-600">Amount</th>
                                <th className="p-4 text-sm font-bold text-slate-600">Type</th>
                                <th className="p-4 text-sm font-bold text-slate-600">Date</th>
                                <th className="p-4 text-sm font-bold text-slate-600">Status</th>
                                <th className="p-4 text-sm font-bold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-slate-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : invoices.map((inv) => (
                                <tr key={inv._id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 text-sm text-slate-500 font-mono">#{inv._id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 text-sm">{inv.customerName}</p>
                                        <p className="text-xs text-slate-500">{inv.customerPhone}</p>
                                    </td>
                                    <td className="p-4 font-bold text-slate-800 text-sm">₹{inv.finalAmount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${inv.type?.toLowerCase() === 'gst' ? 'bg-blue-100 text-blue-700' :
                                            inv.type?.toLowerCase() === 'estimate' ? 'bg-purple-100 text-purple-700' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {inv.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleStatus(inv._id, inv.status)}
                                            className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold transition ${inv.status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}
                                        >
                                            {inv.status === 'paid' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            <span className="capitalize">{inv.status}</span>
                                        </button>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button
                                            onClick={() => handleDownload(inv)}
                                            className="text-slate-400 hover:text-blue-600 transition p-1"
                                            title="Download PDF"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            className="text-slate-400 hover:text-green-600 transition p-1"
                                            title="View / Send"
                                        >
                                            <ExternalLink size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && invoices.length === 0 && (
                    <div className="p-12 text-center text-slate-500 bg-white">
                        No invoices found. Create your first one!
                    </div>
                )}
            </div>

            {!loading && invoices.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                        Showing {invoices.length} of {totalItems} invoices
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
        </div>
    );
};

export default InvoiceList;
