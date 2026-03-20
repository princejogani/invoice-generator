import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, CheckCircle, XCircle, Phone, MapPin, Building2, ExternalLink } from 'lucide-react';

const CustomerPortal = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use a direct axios instance for public routes
    const publicApi = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    });

    useEffect(() => {
        const fetchPortalData = async () => {
            try {
                const { data } = await publicApi.get(`/public/portal/${token}`);
                setData(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load portal');
            }
            setLoading(false);
        };
        fetchPortalData();
    }, [token]);

    const handleDownload = async (invoiceId) => {
        try {
            // Public download endpoint might be needed, but for now we'll use the same structure
            const response = await publicApi.get(`/whatsapp/download/${invoiceId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice-${invoiceId.slice(-6)}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Failed to download PDF');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="text-center bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md">
                <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
                <p className="text-slate-500 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition"
                >
                    Retry
                </button>
            </div>
        </div>
    );

    const { customer, business, invoices } = data;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header / Branding */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                    <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-slate-50 rounded-3xl border border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                            {business.logo ? (
                                <img src={business.logo} alt={business.businessName} className="w-full h-full object-contain p-4" />
                            ) : (
                                <Building2 size={48} className="text-slate-300" />
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">{business.businessName}</h1>
                            {business.tagline && <p className="text-blue-600 font-medium italic mt-1">{business.tagline}</p>}
                            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-slate-500 font-medium">
                                <span className="flex items-center gap-1.5"><Phone size={16} /> {business.businessPhone}</span>
                                <span className="flex items-center gap-1.5"><MapPin size={16} /> {business.businessAddress}</span>
                            </div>
                        </div>
                        <div className="hidden lg:block bg-blue-600 text-white p-6 rounded-3xl shadow-lg ring-4 ring-blue-50">
                            <p className="text-xs uppercase font-black tracking-widest opacity-80 mb-1 text-center">Your Total Pending</p>
                            <p className="text-3xl font-black text-center">₹{customer.totalPendingAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Portal Content */}
            <div className="max-w-5xl mx-auto px-4 -mt-6 md:-mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left: Invoice List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Invoice History</h2>
                                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest">
                                    {invoices.length} Documents
                                </span>
                            </div>

                            <div className="space-y-4">
                                {invoices.map(inv => (
                                    <div key={inv._id} className="group hover:bg-slate-50 p-4 rounded-2xl border border-slate-100 transition-all hover:border-blue-200 hover:shadow-md">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${inv.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                    {inv.status === 'paid' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800">#{inv._id.slice(-6).toUpperCase()}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-800 text-lg">₹{inv.finalAmount.toLocaleString()}</p>
                                                {/* <button
                                                    onClick={() => handleDownload(inv._id)}
                                                    className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline mt-1"
                                                >
                                                    <Download size={14} /> PDF
                                                </button> */}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Info & Customer Card */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Customer Profile</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg">
                                    {customer.name[0]}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800">{customer.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{customer.phone}</p>
                                </div>
                            </div>
                        </div>

                        {/* {business.upiId && (
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl shadow-xl text-white">
                                <h3 className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-4">Pay Now (UPI)</h3>
                                <p className="text-xs opacity-80 mb-1">UPI ID</p>
                                <p className="text-lg font-black break-all mb-6">{business.upiId}</p>
                                <a
                                    href={`upi://pay?pa=${business.upiId}&pn=${business.businessName}`}
                                    className="block w-full bg-white text-blue-700 py-3 rounded-2xl font-black text-center text-sm shadow-lg hover:bg-slate-50 transition"
                                >
                                    Open Payment App
                                </a>
                            </div>
                        )} */}

                        {/* <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Bank Details</h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</p>
                                    <p className="font-bold text-slate-700">{business.bankName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                                    <p className="font-bold text-slate-700 font-mono tracking-wider">{business.accountNumber}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</p>
                                    <p className="font-bold text-slate-700 font-mono">{business.ifscCode}</p>
                                </div>
                            </div>
                        </div> */}
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none">
                <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-lg text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/10 pointer-events-auto">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Powered by</p>
                        <p className="text-sm font-black italic">Saras Invoicing</p>
                    </div>
                    <button className="bg-blue-600 p-2 rounded-xl">
                        <ExternalLink size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerPortal;
