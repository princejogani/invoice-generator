import { useState, useEffect } from 'react';
import api from '../api';
import { MessageSquare, Save, RefreshCcw, CheckCircle, Smartphone } from 'lucide-react';
import _QRCode from 'react-qr-code';
const QRCode = _QRCode.default || _QRCode;

const Settings = () => {
    const [template, setTemplate] = useState('Hello {{customerName}}, your invoice for {{amount}} from {{businessName}} is ready. Download it here.');
    const [status, setStatus] = useState('NOT_INITIALIZED');
    const [loading, setLoading] = useState(false);

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
        setLoading(true);
        setStatus('INITIALIZING');
        try {
            await api.get('/whatsapp/qr');
            // Status will be updated by polling
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
        }
        setLoading(false);
    };

    const handleSaveTemplate = async () => {
        alert('Template saved locally (Backend implementation pending)');
    };

    const renderQRSection = () => {
        if (status === 'CONNECTED' || status === 'AUTHENTICATED') {
            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="bg-green-100 p-4 rounded-full text-green-600">
                        <CheckCircle size={48} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">WhatsApp Connected</h3>
                    <p className="text-slate-500 text-sm">You're all set! Invoices will be sent from your number.</p>
                    <button
                        onClick={handleInitWhatsApp}
                        className="text-slate-400 hover:text-slate-600 text-xs underline"
                    >
                        Reconnect another account
                    </button>
                </div>
            );
        }

        if (status && status.length > 20) { // Likely a QR string
            return (
                <div className="flex flex-col items-center justify-center py-6 space-y-6">
                    <p className="text-slate-700 font-medium text-center">Scan this QR code with your WhatsApp app</p>
                    <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-slate-100 max-w-[250px] w-full">
                        <QRCode
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            value={status}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 animate-pulse">
                        <RefreshCcw size={12} />
                        <span>Waiting for scan...</span>
                    </div>
                </div>
            );
        }

        return (
            <div className="py-12 text-center">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Smartphone size={32} />
                </div>
                <p className="text-slate-500 mb-6">Connect your WhatsApp to send invoices and reminders automatically.</p>
                <button
                    onClick={handleInitWhatsApp}
                    disabled={loading || status === 'INITIALIZING'}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition shadow-md disabled:bg-slate-400"
                >
                    {status === 'INITIALIZING' ? 'Starting Server...' : 'Connect WhatsApp'}
                </button>
            </div>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">Settings</h1>

            <div className="space-y-6 md:space-y-8">
                {/* WhatsApp Connection */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                        {/* <QrCode className="text-green-600" size={24} /> */}
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">WhatsApp Integration</h2>
                    </div>

                    <div className="bg-slate-50 rounded-lg border border-slate-200 min-h-[300px] flex items-center justify-center">
                        {renderQRSection()}
                    </div>
                </section>

                {/* Message Templates */}
                <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center space-x-3 mb-6">
                        <MessageSquare className="text-blue-600" size={24} />
                        <h2 className="text-lg md:text-xl font-bold text-slate-800">WhatsApp Message Template</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs md:text-sm text-slate-500">
                            Customize the message sent with your invoices. Use variables:
                            <span className="font-mono text-blue-600 mx-1">{"{{customerName}}"}</span>,
                            <span className="font-mono text-blue-600 mx-1">{"{{amount}}"}</span>,
                            <span className="font-mono text-blue-600 mx-1">{"{{businessName}}"}</span>
                        </p>
                        <textarea
                            className="w-full h-32 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm md:text-base"
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                        />
                        <button
                            onClick={handleSaveTemplate}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition"
                        >
                            <Save size={18} />
                            <span>Save Template</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Settings;
