import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import {
    Search, FileDown, Check, Edit, Copy, Download,
    MoreVertical, CreditCard, History, X, CheckCircle, Clock, XCircle, ShieldCheck
} from 'lucide-react';

// ── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status, paidAmount, finalAmount }) => {
    const cfg = {
        paid:    { icon: <CheckCircle size={12} />, cls: 'bg-green-100 text-green-700',   label: 'Paid' },
        partial: { icon: <Clock size={12} />,        cls: 'bg-yellow-100 text-yellow-700', label: 'Partial' },
        unpaid:  { icon: <XCircle size={12} />,      cls: 'bg-red-100 text-red-700',       label: 'Unpaid' },
    }[status] || { icon: <XCircle size={12} />, cls: 'bg-red-100 text-red-700', label: status };

    return (
        <div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${cfg.cls}`}>
                {cfg.icon} {cfg.label}
            </span>
            {status === 'partial' && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                    ₹{(paidAmount || 0).toLocaleString()} / ₹{finalAmount.toLocaleString()}
                </p>
            )}
        </div>
    );
};
StatusBadge.propTypes = {
    status: PropTypes.string.isRequired,
    paidAmount: PropTypes.number,
    finalAmount: PropTypes.number.isRequired,
};
StatusBadge.defaultProps = { paidAmount: 0 };

// ── 3-dot Action Dropdown (portal-based to escape overflow:hidden) ────────────
const ActionMenu = ({ inv, onDownload, onClone, onEdit, onConvert, onPayment, onHistory, onVerifyUpi }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                btnRef.current && !btnRef.current.contains(e.target) &&
                menuRef.current && !menuRef.current.contains(e.target)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            const dropdownH = inv.isDraft ? 160 : 120;
            const spaceBelow = window.innerHeight - rect.bottom;
            const top = spaceBelow < dropdownH
                ? rect.top - dropdownH - 4
                : rect.bottom + 4;
            setPos({ top, left: rect.right - 192 });
        }
        setOpen(v => !v);
    };

    const menuItem = (icon, label, onClick, cls = '') => (
        <button
            key={label}
            onMouseDown={e => e.stopPropagation()}
            onClick={() => { setOpen(false); onClick(); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-slate-700 transition ${cls}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <>
            <button
                ref={btnRef}
                onClick={handleOpen}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
                <MoreVertical size={16} />
            </button>

            {open && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
                    className="w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden"
                >
                    {inv.isDraft && menuItem(<Edit size={13} />, 'Edit Draft', onEdit)}
                    {inv.isDraft && menuItem(<Check size={13} />, 'Convert to Final', onConvert, 'text-green-700')}
                    {menuItem(<Download size={13} />, 'Download PDF', onDownload)}
                    {menuItem(<Copy size={13} />, 'Clone Invoice', onClone)}
                    {!inv.isDraft && inv.status !== 'paid' && menuItem(<CreditCard size={13} />, 'Record Payment', onPayment, 'text-blue-700')}
                    {!inv.isDraft && inv.upiClaimedAt && inv.status !== 'paid' && menuItem(<ShieldCheck size={13} />, 'Verify UPI Payment', onVerifyUpi, 'text-yellow-700 font-black')}
                    {!inv.isDraft && menuItem(<History size={13} />, 'Transaction History', onHistory)}
                </div>,
                document.body
            )}
        </>
    );
};
ActionMenu.propTypes = {
    inv: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        isDraft: PropTypes.bool,
        status: PropTypes.string,
    }).isRequired,
    onDownload: PropTypes.func.isRequired,
    onClone: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onConvert: PropTypes.func.isRequired,
    onPayment: PropTypes.func.isRequired,
    onHistory: PropTypes.func.isRequired,
};
ActionMenu.defaultProps = {
    inv: { isDraft: false, status: 'unpaid' },
};

// ── Payment Modal ─────────────────────────────────────────────────────────────
const PaymentModal = ({ inv, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('CASH');
    const [receiveAll, setReceiveAll] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const remaining = inv.finalAmount - (inv.paidAmount || 0);

    const handleReceiveAll = (checked) => {
        setReceiveAll(checked);
        if (checked) setAmount(String(remaining));
        else setAmount('');
        setError('');
    };

    const handleSubmit = async () => {
        const num = Number(amount);
        if (!num || num <= 0) return setError('Enter a valid amount');
        if (num > remaining) return setError(`Max receivable is ₹${remaining.toLocaleString()}`);
        setLoading(true);
        try {
            await api.post('/invoice/payment', { id: inv._id, amount: num, method });
            toast.success('Payment recorded successfully!');
            onSuccess();
            onClose();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to record payment');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-800">Record Payment</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{inv.customerName}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-slate-500">Total Amount</p>
                            <p className="font-bold text-slate-800 text-sm mt-0.5">₹{inv.finalAmount.toLocaleString()}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-slate-500">Remaining</p>
                            <p className="font-bold text-orange-600 text-sm mt-0.5">₹{remaining.toLocaleString()}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Amount Received (₹)</label>
                        <input
                            type="number" value={amount}
                            onChange={e => { setAmount(e.target.value); setReceiveAll(false); setError(''); }}
                            placeholder={`Max ₹${remaining.toLocaleString()}`}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={receiveAll}
                            onChange={e => handleReceiveAll(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 rounded"
                        />
                        <span className="text-xs text-slate-600">
                            Receive full pending amount
                            <span className="ml-1 font-bold text-blue-600">₹{remaining.toLocaleString()}</span>
                        </span>
                    </label>
                    <div>
                        <label className="text-xs font-medium text-slate-600 block mb-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['CASH', 'ONLINE'].map(m => (
                                <button key={m} onClick={() => setMethod(m)}
                                    className={`py-2 rounded-lg text-xs font-bold border transition ${method === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'}`}>
                                    {m === 'CASH' ? '💵 Cash' : '📱 Online'}
                                </button>
                            ))}
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
                <div className="px-5 pb-5 flex gap-2">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition disabled:opacity-50">
                        {loading ? 'Saving...' : 'Receive Payment'}
                    </button>
                </div>
            </div>
        </div>
    );
};
PaymentModal.propTypes = {
    inv: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        customerName: PropTypes.string.isRequired,
        finalAmount: PropTypes.number.isRequired,
        paidAmount: PropTypes.number,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
};

// ── Transaction History Modal ─────────────────────────────────────────────────
const HistoryModal = ({ inv, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/invoice/${inv._id}/payments`)
            .then(r => setData(r.data))
            .catch(() => setData({ payments: [] }))
            .finally(() => setLoading(false));
    }, [inv._id]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-800">Transaction History</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{inv.customerName} · #{inv._id.slice(-6).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                </div>
                <div className="p-5 max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                    ) : !data?.payments?.length ? (
                        <p className="text-center text-slate-400 text-sm py-8">No payments recorded yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {data.payments.map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">₹{p.amount.toLocaleString()}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            {new Date(p.date).toLocaleString('en-IN')} · by {p.recordedByName || 'Unknown'}
                                        </p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.method === 'CASH' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.method}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                    {data && (
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                            <span>Total Paid</span>
                            <span className="font-bold text-green-700">₹{(data.paidAmount || 0).toLocaleString()} / ₹{inv.finalAmount.toLocaleString()}</span>
                        </div>
                    )}
                </div>
                <div className="px-5 pb-5">
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Close</button>
                </div>
            </div>
        </div>
    );
};
HistoryModal.propTypes = {
    inv: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        customerName: PropTypes.string.isRequired,
        finalAmount: PropTypes.number.isRequired,
    }).isRequired,
    onClose: PropTypes.func.isRequired,
};

// ── Main Component ────────────────────────────────────────────────────────────
const InvoiceList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialSearch = new URLSearchParams(location.search).get('search') || '';

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialSearch);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [draftFilter, setDraftFilter] = useState('all');
    const [paymentModal, setPaymentModal] = useState(null);
    const [historyModal, setHistoryModal] = useState(null);

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/invoice/list?page=${page}&search=${search}`;
            if (draftFilter !== 'all') url += `&draft=${draftFilter === 'draft' ? 'true' : 'false'}`;
            const { data } = await api.get(url);
            setInvoices(data.invoices);
            setTotalPages(data.pages);
            setTotalItems(data.total);
        } catch (err) { console.error(err); }
        setLoading(false);
    }, [page, search, draftFilter]);

    useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

    const [convertModal, setConvertModal] = useState(null);
    const [verifyModal, setVerifyModal] = useState(null);

    const convertToFinal = async (id, sendWhatsApp = false) => {
        try {
            await api.patch('/invoice/convert-draft', { id, sendWhatsApp });
            toast.success('Invoice converted to final!');
            setConvertModal(null);
            fetchInvoices();
        } catch { toast.error('Failed to convert draft'); }
    };

    const verifyUpiPayment = async (inv) => {
        if (!verifyModal) { setVerifyModal(inv); return; }
        try {
            await api.post('/invoice/verify-upi-payment', { id: verifyModal._id });
            toast.success('UPI payment verified! Invoice marked as paid.');
            setVerifyModal(null);
            fetchInvoices();
        } catch (e) {
            toast.error(e.response?.data?.message || 'Failed to verify payment');
        }
    };

    const handleDownload = async (inv) => {
        try {
            const response = await api.get(`/whatsapp/download/${inv._id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${inv._id.slice(-6)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch { toast.error('Failed to download PDF'); }
    };

    const handleClone = async (inv) => {
        try {
            await api.post('/invoice/create', {
                customerName: inv.customerName, customerPhone: inv.customerPhone,
                items: inv.items.map(({ name, qty, price, productId }) => ({ name, qty, price, productId: productId || '' })),
                type: inv.type, subtotal: inv.subtotal, gst: inv.gst,
                gstPercentage: inv.gstPercentage, adjustments: inv.adjustments || [],
                finalAmount: inv.finalAmount, isDraft: true,
            });
            toast.success('Invoice cloned as draft!');
            fetchInvoices();
        } catch { toast.error('Failed to clone invoice'); }
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
        } catch { toast.error('Failed to export report'); }
    };

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Invoices</h1>
                <div className="flex flex-col md:flex-row w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text" placeholder="Search customer..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                        />
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    </div>
                    <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-bold hover:bg-slate-200 border border-slate-200 transition text-sm">
                        <FileDown size={16} /> Export
                    </button>
                    <Link to="/invoices/create" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 shadow-md transition text-sm text-center">
                        + New Invoice
                    </Link>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-2 mb-4">
                {['all', 'draft', 'final'].map(f => (
                    <button key={f} onClick={() => setDraftFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm ${draftFilter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                        {f === 'all' ? 'All Invoices' : f === 'draft' ? 'Drafts' : 'Final'}
                    </button>
                ))}
            </div>

            {/* Table — no overflow-hidden so portal dropdown isn't clipped */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-600">ID</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Customer</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Amount</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Type</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Date</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-600">Draft</th>
                                <th className="p-4 text-xs font-bold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="8" className="p-12 text-center">
                                    <div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                                </td></tr>
                            ) : invoices.map(inv => (
                                <tr key={inv._id} className="hover:bg-slate-50 transition">
                                    <td className="p-4 text-sm text-slate-500 font-mono">#{inv._id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800 text-sm">{inv.customerName}</p>
                                        <p className="text-xs text-slate-500">{inv.customerPhone}</p>
                                    </td>
                                    <td className="p-4 font-bold text-slate-800 text-sm">₹{inv.finalAmount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                                            inv.type?.toLowerCase() === 'gst' ? 'bg-blue-100 text-blue-700' :
                                            inv.type?.toLowerCase() === 'estimate' ? 'bg-purple-100 text-purple-700' :
                                            'bg-slate-100 text-slate-600'}`}>
                                            {inv.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <StatusBadge status={inv.status} paidAmount={inv.paidAmount} finalAmount={inv.finalAmount} />
                                        {inv.upiClaimedAt && inv.status !== 'paid' && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">
                                                <ShieldCheck size={10} /> UPI Claimed
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${inv.isDraft ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                            {inv.isDraft ? 'Draft' : 'Final'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <ActionMenu
                                            inv={inv}
                                            onDownload={() => handleDownload(inv)}
                                            onClone={() => handleClone(inv)}
                                            onEdit={() => navigate(`/invoices/edit/${inv._id}`, { state: { invoice: inv } })}
                                            onConvert={() => setConvertModal(inv._id)}
                                            onPayment={() => setPaymentModal(inv)}
                                            onHistory={() => setHistoryModal(inv)}
                                            onVerifyUpi={() => verifyUpiPayment(inv)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && invoices.length === 0 && (
                    <div className="p-12 text-center text-slate-500 rounded-b-xl">No invoices found. Create your first one!</div>
                )}
            </div>

            {/* Pagination */}
            {!loading && invoices.length > 0 && (
                <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">Showing {invoices.length} of {totalItems} invoices</p>
                    <div className="flex space-x-2">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Previous</button>
                        <span className="flex items-center px-4 text-sm font-medium text-slate-700">Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50">Next</button>
                    </div>
                </div>
            )}

            {/* Modals */}
            {paymentModal && <PaymentModal inv={paymentModal} onClose={() => setPaymentModal(null)} onSuccess={fetchInvoices} />}
            {historyModal && <HistoryModal inv={historyModal} onClose={() => setHistoryModal(null)} />}

            {/* Convert Draft Confirm Modal */}
            {convertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-2">Convert to Final Invoice?</h3>
                        <p className="text-sm text-slate-500 mb-5">Do you want to send this invoice via WhatsApp after converting?</p>
                        <div className="flex gap-2">
                            <button onClick={() => setConvertModal(null)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={() => convertToFinal(convertModal, false)} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-800">Convert Only</button>
                            <button onClick={() => convertToFinal(convertModal, true)} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">Convert + WhatsApp</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Verify UPI Confirm Modal */}
            {verifyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-2">Verify UPI Payment?</h3>
                        <p className="text-sm text-slate-500 mb-1">Confirm you received <span className="font-bold text-slate-800">₹{verifyModal.finalAmount?.toLocaleString()}</span> via UPI from <span className="font-bold">{verifyModal.customerName}</span>.</p>
                        <p className="text-xs text-slate-400 mb-5">This will mark the invoice as Paid and send a WhatsApp confirmation.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setVerifyModal(null)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                            <button onClick={() => verifyUpiPayment(verifyModal)} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-bold hover:bg-green-700">Yes, Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoiceList;
