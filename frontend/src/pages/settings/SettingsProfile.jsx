import { useState } from 'react';
import { Building, Save, CreditCard } from 'lucide-react';

const SettingsProfile = ({ profile, setProfile, onSave, loading }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handleSave = async () => {
        if (password || confirmPassword) {
            if (password !== confirmPassword) return setPasswordError('Passwords do not match');
            if (password.length < 6) return setPasswordError('Password must be at least 6 characters');
        }
        setPasswordError('');
        await onSave(password ? { ...profile, password } : profile);
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex items-center space-x-3 mb-6">
                <Building className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Business Profile</h2>
            </div>

            {/* Logo Upload */}
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                <div className="w-32 h-32 rounded-xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden relative group">
                    {profile.logo ? (
                        <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-slate-400 text-[11px] font-bold uppercase tracking-widest text-center px-2">No Logo</span>
                    )}
                    <div className="absolute inset-0 bg-slate-800/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                        <label className="cursor-pointer text-white text-xs uppercase font-bold tracking-widest">
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => setProfile({ ...profile, logo: reader.result });
                                    reader.readAsDataURL(file);
                                }
                            }} />
                            Change Logo
                        </label>
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Business Logo</h3>
                    <p className="text-xs text-slate-500 mt-2">Square PNG with transparent background recommended.</p>
                    {profile.logo && (
                        <button onClick={() => setProfile({ ...profile, logo: '' })} className="text-red-500 text-xs uppercase font-black mt-3 hover:underline">
                            Remove Logo
                        </button>
                    )}
                </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Name</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                        value={profile.businessName} onChange={(e) => setProfile({ ...profile, businessName: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Tagline</label>
                    <input type="text" placeholder="e.g. Quality products at fair prices" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none italic"
                        value={profile.tagline || ''} onChange={(e) => setProfile({ ...profile, tagline: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">GSTIN</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        value={profile.gstin} onChange={(e) => setProfile({ ...profile, gstin: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Phone</label>
                    <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={profile.businessPhone} onChange={(e) => setProfile({ ...profile, businessPhone: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Business Address</label>
                    <textarea placeholder="Area, Landmark, City, State, Pincode" className="w-full h-24 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={profile.businessAddress} onChange={(e) => setProfile({ ...profile, businessAddress: e.target.value })} />
                </div>
            </div>

            {/* Payment Details */}
            <div className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="text-blue-600" size={20} />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Payment Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">UPI ID</label>
                        <input type="text" placeholder="e.g. yourname@upi or 9876543210@paytm" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={profile.upiId || ''} onChange={(e) => setProfile({ ...profile, upiId: e.target.value })} />
                        <p className="text-xs text-slate-400 mt-1">Used to generate UPI payment links in invoices and WhatsApp messages.</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bank Name</label>
                        <input type="text" placeholder="e.g. State Bank of India" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profile.bankName || ''} onChange={(e) => setProfile({ ...profile, bankName: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">IFSC Code</label>
                        <input type="text" placeholder="e.g. SBIN0001234" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={profile.ifscCode || ''} onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Account Number</label>
                        <input type="text" placeholder="e.g. 1234567890" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={profile.accountNumber || ''} onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })} />
                    </div>
                </div>
            </div>

            {/* Account Details */}
            <div className="pt-8 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Name</label>
                        <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Login Email</label>
                        <input type="email" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">New Password (leave blank to keep same)</label>
                        <input type="password" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                        <input type="password" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} />
                        {passwordError && <p className="text-red-500 text-xs mt-2">{passwordError}</p>}
                    </div>
                </div>
                <button onClick={handleSave} disabled={loading}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400">
                    <Save size={18} />
                    <span>{loading ? 'Saving...' : 'Save Profile'}</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsProfile;
