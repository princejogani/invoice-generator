import { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, MessageSquare, Save } from 'lucide-react';
import api from '../../api';
import _QRCode from 'react-qr-code';
const QRCode = _QRCode.default || _QRCode;

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
                <p className="text-sm text-slate-600 mb-4">
                    Available variables:{' '}
                    <span className="font-mono bg-blue-50 px-2 py-1 rounded text-blue-700">
                        {'{{customerName}}, {{amount}}, {{businessName}}'}
                    </span>
                </p>
                <textarea
                    className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                    value={profile.whatsappTemplate}
                    onChange={(e) => setProfile({ ...profile, whatsappTemplate: e.target.value })}
                    placeholder="e.g., Hi {{customerName}}, your invoice of ₹{{amount}} from {{businessName}} is ready!"
                />
                <button onClick={() => onSave(profile)} disabled={loading}
                    className="mt-4 flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400">
                    <Save size={18} />
                    <span>{loading ? 'Saving...' : 'Save Message Template'}</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsWhatsApp;
