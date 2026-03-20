import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Users, Search, ChevronLeft, ChevronRight, Edit3, FileText, Mail, Building, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserList = () => {
    const navigate = useNavigate();
    const { switchUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/auth/users?page=${page}&search=${search}`);
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleImpersonate = async (userId) => {
        if (!window.confirm('Are you sure you want to login as this user?')) return;
        try {
            const { data } = await api.get(`/auth/impersonate/${userId}`);
            switchUser(data);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Failed to impersonate user');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                        <Users className="mr-3 text-blue-600" size={32} />
                        User Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Monitor and manage shop owner accounts</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <button
                        onClick={() => navigate('/admin/create-user')}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        <UserPlus size={18} />
                        <span>Create New User</span>
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search users or business..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Owner</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Business Detail</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Invoices</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="4" className="px-6 py-4"><div className="h-10 bg-slate-100 rounded"></div></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold mr-3 uppercase">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800">{user.name}</div>
                                                    <div className="text-xs text-slate-500 flex items-center">
                                                        <Mail size={12} className="mr-1" />
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-700">{user.businessName || 'N/A'}</div>
                                            <div className="text-xs text-slate-400 flex items-center italic">
                                                <Building size={12} className="mr-1" />
                                                {user.gstin || 'No GSTIN'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-black">
                                                <FileText size={12} className="mr-1" />
                                                {user.invoiceCount} Generated
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 flex items-center space-x-4">
                                            <button
                                                onClick={() => navigate(`/admin/edit-user/${user._id}`)}
                                                className="flex items-center space-x-1 text-slate-600 hover:text-blue-600 font-bold text-xs"
                                            >
                                                <Edit3 size={14} />
                                                <span>Edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleImpersonate(user._id)}
                                                className="flex items-center space-x-1 text-slate-600 hover:text-green-600 font-bold text-xs"
                                            >
                                                <LogIn size={14} />
                                                <span>Login As</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-50 flex items-center justify-between">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className="flex items-center space-x-1 text-sm font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30"
                    >
                        <ChevronLeft size={18} />
                        <span>Prev</span>
                    </button>
                    <div className="text-sm font-bold text-slate-400">
                        Page <span className="text-slate-800">{page}</span> of {totalPages}
                    </div>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                        className="flex items-center space-x-1 text-sm font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30"
                    >
                        <span>Next</span>
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserList;
