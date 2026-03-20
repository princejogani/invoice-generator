import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Download, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data } = await api.get('/invoice/list');
            setInvoices(data);
        } catch (err) {
            console.error(err);
        }
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

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Invoices</h1>
                <Link to="/invoices/create" className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow-md transition">
                    + New Invoice
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
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
                    <tbody>
                        {invoices.map((inv) => (
                            <tr key={inv._id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                <td className="p-4 text-sm text-slate-500">#{inv._id.slice(-6)}</td>
                                <td className="p-4">
                                    <p className="font-bold text-slate-800 text-sm">{inv.customerName}</p>
                                    <p className="text-xs text-slate-500">{inv.customerPhone}</p>
                                </td>
                                <td className="p-4 font-bold text-slate-800 text-sm">₹{inv.finalAmount.toLocaleString()}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-slate-100 text-slate-600">
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
                                    <button className="text-slate-400 hover:text-blue-600 transition">
                                        <Download size={18} />
                                    </button>
                                    <button className="text-slate-400 hover:text-blue-600 transition">
                                        <ExternalLink size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && (
                    <div className="p-12 text-center text-slate-500">
                        No invoices found. Create your first one!
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
