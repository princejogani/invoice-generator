import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Loader, AlertCircle, Copy, QrCode } from 'lucide-react';
import _QRCode from 'react-qr-code';
const QRCode = _QRCode.default || _QRCode;

const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

/**
 * Android intent:// links — Chrome handles these natively, routes to installed app.
 * This is the ONLY link-based method that works from a browser without security errors.
 * Format: intent://<path>#Intent;scheme=<appscheme>;package=<package>;end
 */
const buildAppLinks = (upiId, name, amount, note) => {
    const params = `pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;

    return [
        {
            name: 'PhonePe',
            bg: 'bg-[#5f259f]',
            intent: `intent://pay?${params}#Intent;scheme=phonepe;package=com.phonepe.app;end`,
        },
        {
            name: 'Google Pay',
            bg: 'bg-white border border-slate-200',
            text: 'text-slate-800',
            intent: `intent://upi/pay?${params}#Intent;scheme=tez;package=com.google.android.apps.nbu.paisa.user;end`,
        },
        {
            name: 'Paytm',
            bg: 'bg-[#00b9f1]',
            intent: `intent://pay?${params}#Intent;scheme=paytmmp;package=net.one97.paytm;end`,
        },
        {
            name: 'BHIM',
            bg: 'bg-[#00529c]',
            intent: `intent://upi/pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end`,
        },
    ];
};

const UpiPaymentPage = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(null);
    const [error, setError] = useState(null);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        setIsAndroid(/android/i.test(navigator.userAgent));
        publicApi.get(`/public/pay/${token}`)
            .then(r => setData(r.data))
            .catch(e => setError(e.response?.data?.message || 'Invalid payment link.'))
            .finally(() => setLoading(false));
    }, [token]);

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            const { data: result } = await publicApi.post(`/public/pay/${token}/confirm`);
            setConfirmed(result.status === 'already_paid' ? 'paid' : 'claimed');
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to submit. Please try again.');
        }
        setConfirming(false);
    };

    const copyUpiId = (upiId) => {
        navigator.clipboard.writeText(upiId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader className="animate-spin text-blue-600" size={40} />
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-200">
                <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-black text-slate-800 mb-2">Oops!</h2>
                <p className="text-slate-500">{error}</p>
            </div>
        </div>
    );

    if (confirmed === 'claimed' || (data?.invoice?.upiClaimedAt && data?.invoice?.status !== 'paid')) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-200">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader className="text-yellow-500" size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Awaiting Verification</h2>
                <p className="text-slate-500 mb-4">
                    Your payment claim has been submitted.<br />
                    The business will verify and send you a WhatsApp confirmation.
                </p>
                <p className="text-xs text-slate-400">This usually takes a few minutes.</p>
            </div>
        </div>
    );

    if (confirmed === 'paid' || data?.invoice?.status === 'paid') return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-200">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
                <h2 className="text-2xl font-black text-slate-800 mb-2">Payment Confirmed!</h2>
                <p className="text-slate-500 mb-4">
                    Thank you, <span className="font-bold text-slate-700">{data.invoice.customerName}</span>!<br />
                    ₹{data.invoice.finalAmount.toLocaleString()} has been recorded.
                </p>
                <p className="text-xs text-slate-400">A WhatsApp confirmation has been sent to you.</p>
            </div>
        </div>
    );

    const { invoice, business } = data;
    const invNo = invoice._id.slice(-6).toUpperCase();
    const note = `Invoice-${invNo}`;
    const appLinks = buildAppLinks(business.upiId, business.businessName, invoice.finalAmount, note);
    const upiQrValue = `upi://pay?pa=${encodeURIComponent(business.upiId)}&pn=${encodeURIComponent(business.businessName)}&am=${invoice.finalAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">

                {/* Header */}
                <div className="bg-blue-600 p-6 text-white text-center">
                    {business.logo && (
                        <img src={business.logo} alt={business.businessName} className="w-16 h-16 object-contain mx-auto mb-3 rounded-2xl bg-white p-1" />
                    )}
                    <h1 className="text-xl font-black">{business.businessName}</h1>
                    <p className="text-blue-200 text-sm mt-1">Invoice #{invNo}</p>
                </div>

                {/* Amount */}
                <div className="p-6 text-center border-b border-slate-100">
                    <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-1">Amount Due</p>
                    <p className="text-4xl font-black text-slate-800">₹{invoice.finalAmount.toLocaleString()}</p>
                    <p className="text-sm text-slate-500 mt-1">{invoice.customerName}</p>
                </div>

                <div className="p-5 space-y-4">

                    {/* UPI ID + Copy */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">UPI ID</p>
                            <p className="font-bold text-slate-800 text-sm break-all">{business.upiId}</p>
                        </div>
                        <button
                            onClick={() => copyUpiId(business.upiId)}
                            className="ml-3 flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
                        >
                            <Copy size={14} />
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    {/* Android: intent-based app buttons */}
                    {isAndroid ? (
                        <div>
                            <p className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">Pay via App</p>
                            <div className="grid grid-cols-2 gap-2">
                                {appLinks.map(app => (
                                    <a
                                        key={app.name}
                                        href={app.intent}
                                        className={`flex items-center justify-center py-3 rounded-xl font-black text-sm transition ${app.bg} ${app.text || 'text-white'}`}
                                    >
                                        {app.name}
                                    </a>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                                Tap your app → complete payment → come back and confirm below
                            </p>
                        </div>
                    ) : (
                        /* iOS / Desktop: only QR works reliably */
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                            <p className="text-sm font-bold text-amber-800 mb-1">Use QR Code to Pay</p>
                            <p className="text-xs text-amber-600">
                                On iPhone, open any UPI app → Scan QR → Pay. Direct app links are not supported on iOS browsers.
                            </p>
                        </div>
                    )}

                    {/* QR Code */}
                    <button
                        onClick={() => setShowQR(v => !v)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 text-sm font-bold hover:border-blue-400 hover:text-blue-600 transition"
                    >
                        <QrCode size={16} />
                        {showQR ? 'Hide QR Code' : 'Show QR Code'}
                    </button>

                    {showQR && (
                        <div className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl p-4">
                            <QRCode value={upiQrValue} size={180} />
                            <p className="text-xs text-slate-400 mt-3 text-center">
                                Open camera or any UPI app → Scan → Pay
                            </p>
                        </div>
                    )}

                    {/* Confirm after payment */}
                    <div className="pt-1">
                        <p className="text-xs text-slate-400 mb-2 text-center">After paying in your UPI app, tap below:</p>
                        <button
                            onClick={handleConfirm}
                            disabled={confirming}
                            className="w-full bg-green-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {confirming ? <Loader className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                            {confirming ? 'Submitting...' : 'I Have Paid — Notify Business'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpiPaymentPage;
