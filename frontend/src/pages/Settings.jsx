import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Save, RefreshCcw, CheckCircle, Smartphone, Building, ShieldCheck, Users, Trash2, Shield } from 'lucide-react';
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
        logo: ''
    });
    const [status, setStatus] = useState('NOT_INITIALIZED');
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
    const [staffLoading, setStaffLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
        if (authUser?.role === 'user') fetchStaff();
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
    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const { data } = await api.get('/auth/staff');
            setStaff(data);
        } catch (err) {
            console.error('Failed to fetch staff');
        }
        setStaffLoading(false);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            await api.post('/auth/staff', newStaff);
            setNewStaff({ name: '', email: '', password: '' });
            fetchStaff();
            alert('Staff member added successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add staff');
        }
        setStaffLoading(false);
    };

    const handleDeleteStaff = async (id) => {
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;
        try {
            await api.delete(`/auth/staff/${id}`);
            fetchStaff();
        } catch (err) {
            alert('Failed to remove staff');
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

            // Users can update their own business details in this SaaS
            updateData.businessName = profile.businessName;
            updateData.tagline = profile.tagline;
            updateData.gstin = profile.gstin;
            updateData.businessAddress = profile.businessAddress;
            updateData.businessPhone = profile.businessPhone;
            updateData.logo = profile.logo;

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
                        </div>

                        {/* Logo Upload */}
                        <div className="mb-8 flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="w-24 h-24 rounded-xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                {profile.logo ? (
                                    <img src={profile.logo} alt="Business Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest text-center px-2">No Logo</span>
                                )}
                                {authUser?.role !== 'staff' && (
                                    <div className="absolute inset-0 bg-slate-800/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                                        <label className="cursor-pointer text-white text-[10px] uppercase font-bold tracking-widest">Change</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setProfile({ ...profile, logo: reader.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Business Logo</h3>
                                <p className="text-xs text-slate-500 mt-1">Recommended: Square PNG with transparent background. Appears on invoices.</p>
                                {profile.logo && authUser?.role !== 'staff' && (
                                    <button
                                        onClick={() => setProfile({ ...profile, logo: '' })}
                                        className="text-red-500 text-[10px] uppercase font-black mt-2 hover:underline"
                                    >
                                        Remove Logo
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold"
                                    value={profile.businessName}
                                    onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2 text-xs">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Tagline</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Your partner in success"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 italic"
                                    value={profile.tagline || ''}
                                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">GSTIN</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-mono"
                                    value={profile.gstin}
                                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Phone</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={profile.businessPhone}
                                    onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Business Address</label>
                                <textarea
                                    placeholder="Area, Landmark, City, State, Pincode"
                                    className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 resize-none"
                                    value={profile.businessAddress}
                                    onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Payment Details */}

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
                    {/* Staff Management - Only for Shop Owners */}
                    {authUser?.role === 'user' && (
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center space-x-3 mb-6">
                                <Users className="text-blue-600" size={20} />
                                <h2 className="text-lg font-bold text-slate-800">Team Members</h2>
                            </div>

                            <div className="space-y-4 mb-8">
                                {staff.length === 0 ? (
                                    <p className="text-xs text-slate-500 italic">No staff members added yet.</p>
                                ) : staff.map(s => (
                                    <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                                <Shield size={14} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-800">{s.name}</p>
                                                <p className="text-[10px] text-slate-500">{s.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteStaff(s._id)}
                                            className="text-slate-400 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleAddStaff} className="space-y-4 pt-6 border-t border-slate-100">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Add New Salesperson</h3>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    required
                                    className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    required
                                    className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    className="w-full p-2 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newStaff.password}
                                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                />
                                <button
                                    type="submit"
                                    disabled={staffLoading}
                                    className="w-full bg-slate-800 text-white p-2 rounded-lg text-xs font-bold hover:bg-slate-900 transition disabled:bg-slate-300"
                                >
                                    {staffLoading ? 'Adding...' : 'Assign Staff Role'}
                                </button>
                            </form>
                        </section>
                    )}

                    {/* WhatsApp Connection */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-800 mb-6">WhatsApp Status</h2>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 min-h-[300px] flex items-center justify-center">
                            {renderQRSection()}
                        </div>
                    </section>
                </div>
            </div >
        </div >
    );
};

export default Settings;
