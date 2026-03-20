import { useState } from 'react';
import api from '../api';
import { UserPlus, ShieldCheck, Mail, Lock, Building, FileText, Smartphone, MapPin, CheckCircle } from 'lucide-react';

const AdminUserCreate = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        businessName: '',
        gstin: '',
        businessAddress: '',
        businessPhone: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/create-user', formData);
            setSuccess('Shop owner account created successfully!');
            setFormData({
                name: '', email: '', password: '', businessName: '',
                gstin: '', businessAddress: '', businessPhone: ''
            });
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create user');
        }
        setLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
                <ShieldCheck className="text-blue-600" size={32} />
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Shop Owner</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <Building size={20} className="mr-2 text-slate-400" />
                        Business Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Business Name</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.businessName}
                                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">GSTIN (Optional)</label>
                            <input
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.gstin}
                                onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Business Phone</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.businessPhone}
                                onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Business Address</label>
                            <textarea
                                required
                                className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                value={formData.businessAddress}
                                onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                        <UserPlus size={20} className="mr-2 text-slate-400" />
                        Login Credentials
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email Address</label>
                            <input
                                required
                                type="email"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {success && (
                    <div className="bg-green-100 text-green-700 p-4 rounded-xl flex items-center mb-6">
                        <CheckCircle size={20} className="mr-2" />
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition shadow-xl shadow-blue-200 disabled:bg-slate-400"
                >
                    {loading ? 'Creating Account...' : 'Create Shop Owner Account'}
                </button>
            </form>
        </div>
    );
};

export default AdminUserCreate;
