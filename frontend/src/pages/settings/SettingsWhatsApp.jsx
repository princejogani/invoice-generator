import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, MessageSquare, Save, Eye } from 'lucide-react';
import api from '../../api';
import _QRCode from 'react-qr-code';
const QRCode = _QRCode.default || _QRCode;

const VARIABLES = [
    { key: '{{customerName}}', desc: 'Customer name' },
    { key: '{{amount}}',       desc: 'Invoice total amount' },
    { key: '{{businessName}}', desc: 'Your business name' },
    { key: '{{invoiceNo}}',    desc: 'Invoice number (e.g. #A1B2C3)' },
    { key: '{{paymentLink}}',  desc: 'UPI payment page link' },
];

const PREVIEW_VALUES = {
    '{{customerName}}': 'Rahul Sharma',
    '{{amount}}':       '₹5,000',
    '{{businessName}}': 'Your Business',
    '{{invoiceNo}}':    '#INV001',
    '{{paymentLink}}':  'http://localhost:5173/pay/abc123token',
};

const DEFAULT_TEMPLATE = `Hello {{customerName}},

Your invoice *#{{invoiceNo}}* for *{{amount}}* from *{{businessName}}* is ready.

💳 *Pay Now via UPI:*
{{paymentLink}}

Thank you! 🙏`;

const SettingsWhatsApp = ({ profile, setProfile, onSave, loading }) => {
    const [status, setStatus] = useState('NOT_INITIALIZED');
    const [waLoading, setWaLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    useEffect(() => {
        let interval;
        if (status !== 'CONNECTED' && status !== 'AUTHENTICATED') {
            interval = setInterval(fetchStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/whatsapp/status');
            setStatus(data.status);
        } catch (err) {
            console.error('Failed to fetch WhatsApp status');
        }
    };

    const handleInitWhatsApp = async () => {
        setWaLoading(true);
        setStatus('INITIALIZING');
        try {
            await api.get('/whatsapp/qr');
        } catch (err) {
            setStatus('ERROR');
        }
        setWaLoading(false);
    };

    const renderQRSection = () => {
        if (status === 'CONNECTED' || status === 'AUTHENTICATED') return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="bg-green-100 p-4 rounded-full text-green-600"><CheckCircle size={48} /></div>
                <h3 className="text-xl font-bold text-slate-800">WhatsApp Connected</h3>
                <p className="text-slate-500 text-sm">You are all set! Invoices will be sent from your number.</p>
                <button onClick={handleInitWhatsApp} className="text-slate-400 hover:text-slate-600 text-xs underline">
                    Reconnect another account
                </button>
            </div>
        );

        if (status && status.length > 20) return (
            <div className="flex flex-col items-center justify-center py-6 space-y-6">
                <p className="text-slate-700 font-medium text-center">Scan this QR code with your WhatsApp app</p>
                <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-slate-100 max-w-[250px] w-full">
                    <QRCode size={256} style={{ height: 'auto', maxWidth: '100%', width: '100%' }} value={status} viewBox="0 0 256 256" />
                </div>
            </div>
        );

        return (
            <div className="py-12 text-center px-4">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Smartphone size={32} />
                </div>
                <p className="text-slate-500 mb-6">Connect your WhatsApp to send invoices automatically.</p>
                <button onClick={handleInitWhatsApp} disabled={waLoading || status === 'INITIALIZING'}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md disabled:bg-slate-400">
                    {status === 'INITIALIZING' ? 'Starting Server...' : 'Connect WhatsApp'}
                </button>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8 space-y-10">
            {/* WhatsApp Connection */}
            <div>
                <div className="flex items-center space-x-3 mb-6">
                    <Smartphone className="text-green-600" size={28} />
                    <h2 className="text-2xl font-bold text-slate-800">WhatsApp Connection</h2>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200 min-h-[300px] flex items-center justify-center">
                    {renderQRSection()}
                </div>
            </div>

            {/* Message Template */}
            <div>
                <div className="flex items-center space-x-3 mb-4">
                    <MessageSquare className="text-blue-600" size={28} />
                    <h2 className="text-2xl font-bold text-slate-800">Message Template</h2>
                </div>

                {/* Variable chips */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Available Variables — click to insert</p>
                    <div className="flex flex-wrap gap-2">
                        {VARIABLES.map(v => (
                            <button key={v.key}
                                title={v.desc}
                                onClick={() => {
                                    const ta = document.getElementById('wa-template');
                                    const start = ta.selectionStart;
                                    const end = ta.selectionEnd;
                                    const current = profile.whatsappTemplate || '';
                                    const next = current.slice(0, start) + v.key + current.slice(end);
                                    setProfile({ ...profile, whatsappTemplate: next });
                                    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.key.length, start + v.key.length); }, 0);
                                }}
                                className="font-mono text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-100 transition"
                            >
                                {v.key}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                        <span className="font-semibold text-amber-600">Note:</span> <span className="font-mono">{'{{paymentLink}}'}</span> is only included when your UPI ID is set in Profile settings.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Editor */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Template Editor</label>
                        <textarea
                            id="wa-template"
                            className="w-full h-52 p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm font-mono"
                            value={profile.whatsappTemplate || ''}
                            onChange={(e) => setProfile({ ...profile, whatsappTemplate: e.target.value })}
                            placeholder={DEFAULT_TEMPLATE}
                        />
                        <button
                            onClick={() => setProfile({ ...profile, whatsappTemplate: DEFAULT_TEMPLATE })}
                            className="text-xs text-slate-400 hover:text-blue-600 underline mt-1"
                        >
                            Reset to default template
                        </button>
                    </div>

                    {/* Live Preview */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Eye size={14} className="text-slate-400" />
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Preview</label>
                        </div>
                        <div className="bg-[#e5ddd5] rounded-xl p-4 h-52 overflow-y-auto">
                            <div className="bg-white rounded-xl rounded-tl-none px-4 py-3 shadow-sm max-w-[85%] text-sm text-slate-800 whitespace-pre-wrap break-words">
                                {(profile.whatsappTemplate || DEFAULT_TEMPLATE)
                                    .replace(/\{\{(\w+)\}\}/g, (match) => PREVIEW_VALUES[match] || match)
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={() => onSave(profile)} disabled={loading}
                    className="mt-6 flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400">
                    <Save size={18} />
                    <span>{loading ? 'Saving...' : 'Save Message Template'}</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsWhatsApp;
