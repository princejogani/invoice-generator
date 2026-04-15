import { useState, useEffect } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ChevronLeft, User, Mail, Lock, Building, Smartphone, MapPin, ShieldCheck, CheckCircle } from 'lucide-react';

const UserEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        businessName: '',
        tagline: '',
        gstin: '',
        businessAddress: '',
        businessPhone: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        upiId: '',
        logo: ''
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchUser();
    }, [id]);

    const fetchUser = async () => {
        setFetching(true);
        try {
            const { data } = await api.get(`/auth/user/${id}`);
            setFormData({
                name: data.name,
                email: data.email,
                password: '',
                businessName: data.businessName || '',
                tagline: data.tagline || '',
                gstin: data.gstin || '',
                businessAddress: data.businessAddress || '',
                businessPhone: data.businessPhone || '',
                bankName: data.bankName || '',
                accountNumber: data.accountNumber || '',
                ifscCode: data.ifscCode || '',
                upiId: data.upiId || '',
                logo: data.logo || ''
            });
        } catch (err) {
            console.error(err);
        }
        setFetching(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/auth/user/${id}`, formData);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user');
        }
        setLoading(false);
    };

    if (fetching) return <div className="p-8 text-center text-slate-400">Loading user data...</div>;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center space-x-1 text-slate-500 hover:text-slate-800 font-bold mb-6 transition"
            >
                <ChevronLeft size={20} />
                <span>Back to User List</span>
            </button>

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Edit Account</h1>
                        <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">{formData.name || 'Shop Owner'}</p>
                    </div>
                </div>
                {success && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-4">
                        <CheckCircle size={18} />
                        <span className="text-sm font-bold">Changes Saved!</span>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Credentials Section */}
                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <ShieldCheck size={20} className="mr-2 text-blue-600" />
                        Credentials & Access
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Email Address</label>
                            <input
                                required
                                type="email"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">New Password (leave blank to keep same)</label>
                            <input
                                type="password"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                </section>

                <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Building size={20} className="mr-2 text-slate-400" />
                        Business Profile (Locked for User)
                    </h2>

                    <div className="flex flex-col md:flex-row gap-6 mb-8 items-center">
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center relative group overflow-hidden shrink-0">
                            {formData.logo ? (
                                <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-contain" />
                            ) : (
                                <Building size={24} className="text-slate-300" />
                            )}
                            <div className="absolute inset-0 bg-slate-800/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer">
                                <label className="cursor-pointer text-white text-[10px] uppercase font-bold tracking-widest text-center px-1">Upload Logo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => setFormData({ ...formData, logo: reader.result });
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 uppercase tracking-widest">Business Logo</p>
                            <p className="text-xs text-slate-500 mt-1">Logo for the shop owner's invoices. Square PNG recommended.</p>
                            {formData.logo && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, logo: '' })}
                                    className="text-red-500 text-[10px] uppercase font-bold mt-2 hover:underline"
                                >
                                    Remove Logo
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Business Name</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-bold"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Tagline</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 italic"
                                value={formData.tagline}
                                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">GSTIN</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 font-mono"
                                value={formData.gstin}
                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Business Phone</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                value={formData.businessPhone}
                                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Address</label>
                            <textarea
                                required
                                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50 resize-none"
                                value={formData.businessAddress}
                                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 mt-8">
                        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest">Payment Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Bank Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">Account Number</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={formData.accountNumber}
                                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">IFSC Code</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={formData.ifscCode}
                                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1 tracking-widest">UPI ID (VPA)</label>
                                <input
                                    type="text"
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                                    value={formData.upiId}
                                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-slate-800 text-white p-4 rounded-2xl font-black text-lg hover:bg-slate-900 transition shadow-xl disabled:bg-slate-400"
                    >
                        {loading ? 'Saving Changes...' : 'Update Account Info'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserEdit;
