import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Save, RefreshCcw, CheckCircle, Smartphone, Building, ShieldCheck } from 'lucide-react';
import _QRCode from 'react-qr-code';
const QRCode = _QRCode.default || _QRCode;

const Settings = () => {
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.role === 'admin';

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        whatsappTemplate: '',
        businessName: '',
        tagline: '',
        gstin: '',
        businessAddress: '',
        businessPhone: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: ''
    });
    const [status, setStatus] = useState('NOT_INITIALIZED');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        let interval;
        if (status !== 'CONNECTED' && status !== 'AUTHENTICATED') {
            interval = setInterval(fetchStatus, 3000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setProfile(data);
        } catch (err) {
            console.error('Failed to fetch profile');
        }
    };

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
        } catch (err) {
            console.error(err);
            setStatus('ERROR');
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const updateData = {
                name: profile.name,
                email: profile.email,
                whatsappTemplate: profile.whatsappTemplate
            };

            // Only admins can send these fields (backend enforces it too)
            if (isAdmin) {
                updateData.businessName = profile.businessName;
                updateData.tagline = profile.tagline;
                updateData.gstin = profile.gstin;
                updateData.businessAddress = profile.businessAddress;
                updateData.businessPhone = profile.businessPhone;
                updateData.bankName = profile.bankName;
                updateData.accountNumber = profile.accountNumber;
                updateData.ifscCode = profile.ifscCode;
                updateData.upiId = profile.upiId;
            }

            await api.put('/auth/profile', updateData);
            alert('Settings updated successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to update settings');
        }
        setLoading(false);
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

        if (status && status.length > 20) {
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
                </div>
            );
        }

        return (
            <div className="py-12 text-center px-4">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Smartphone size={32} />
                </div>
                <p className="text-slate-500 mb-6">Connect your WhatsApp to send invoices automatically.</p>
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
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">Settings</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Business Profile */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-3">
                                <Building className="text-blue-600" size={24} />
                                <h2 className="text-xl font-bold text-slate-800">Business Profile</h2>
                            </div>
                            {!isAdmin && (
                                <div className="flex items-center space-x-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                    <ShieldCheck size={12} />
                                    <span>Managed by Admin</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Name</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500 font-bold"
                                    value={profile.businessName}
                                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 text-xs">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Tagline</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin}
                                    placeholder="e.g. Your partner in success"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500 italic"
                                    value={profile.tagline || ''}
                                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">GSTIN</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500 font-mono"
                                    value={profile.gstin}
                                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Phone</label>
                                <input
                                    type="text"
                                    disabled={!isAdmin}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500"
                                    value={profile.businessPhone}
                                    onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Address</label>
                                <textarea
                                    disabled={!isAdmin}
                                    placeholder="Area, Landmark, City, State, Pincode"
                                    className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500 resize-none"
                                    value={profile.businessAddress}
                                    onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="pt-8 border-t border-slate-100 mt-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Payment Details (For Invoice)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500"
                                        value={profile.bankName || ''}
                                        onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account Number</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500"
                                        value={profile.accountNumber || ''}
                                        onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500"
                                        value={profile.ifscCode || ''}
                                        onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">UPI ID (VPA)</label>
                                    <input
                                        type="text"
                                        disabled={!isAdmin}
                                        placeholder="e.g. mobile@upi"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 disabled:text-slate-500"
                                        value={profile.upiId || ''}
                                        onChange={(e) => setProfile({ ...profile, upiId: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 mt-8">
                            <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Account Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Contact Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Login Email</label>
                                    <input
                                        type="email"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveProfile}
                            disabled={loading}
                            className="mt-8 flex items-center space-x-2 bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition shadow-lg"
                        >
                            <Save size={18} />
                            <span>{loading ? 'Saving...' : 'Save Settings'}</span>
                        </button>
                    </section>

                    {/* Message Templates */}
                    <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex items-center space-x-3 mb-6">
                            <MessageSquare className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-slate-800">Message Template</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">
                            Variables: <span className="font-mono text-blue-600">{"{{customerName}}, {{amount}}, {{businessName}}"}</span>
                        </p>
                        <textarea
                            className="w-full h-32 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50"
                            value={profile.whatsappTemplate}
                            onChange={(e) => setProfile({ ...profile, whatsappTemplate: e.target.value })}
                        />
                    </section>
                </div>

                <div className="space-y-8">
                    {/* WhatsApp Connection */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">WhatsApp Status</h2>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 min-h-[300px] flex items-center justify-center">
                            {renderQRSection()}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
