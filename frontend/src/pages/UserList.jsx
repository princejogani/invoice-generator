import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users, Search, ChevronLeft, ChevronRight, Edit3, FileText, Mail, Building, UserPlus, LogIn, CheckCircle, Ban, CreditCard, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserList = () => {
    const navigate = useNavigate();
    const { switchUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchUsers();
    }, [page, search, statusFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let url = `/auth/users?page=${page}&search=${search}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            const { data } = await api.get(url);
            setUsers(data.users);
            setTotalPages(data.pages);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleApprove = async (userId) => {
        try {
            await api.patch(`/auth/user/${userId}/approve`);
            toast.success('User approved!');
            fetchUsers();
        } catch { toast.error('Failed to approve user'); }
    };

    const handleSuspend = async (userId, currentStatus) => {
        try {
            await api.patch(`/auth/user/${userId}/suspend`);
            toast.success(currentStatus === 'suspended' ? 'User reactivated!' : 'User suspended!');
            fetchUsers();
        } catch { toast.error('Failed to update user status'); }
    };

    const handleTogglePlan = async (userId, currentPlan) => {
        try {
            await api.patch(`/auth/user/${userId}/plan`);
            toast.success(`Plan changed to ${currentPlan === 'paid' ? 'free' : 'paid'}!`);
            fetchUsers();
        } catch { toast.error('Failed to update plan'); }
    };

    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, openUp: false });
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleToggleDropdown = useCallback((e, userId) => {
        if (openDropdown === userId) { setOpenDropdown(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownHeight = 220;
        const openUp = rect.bottom + dropdownHeight > window.innerHeight;
        setDropdownPos({
            top: openUp ? rect.top - dropdownHeight : rect.bottom + 4,
            left: rect.right - 176,
            openUp,
        });
        setOpenDropdown(userId);
    }, [openDropdown]);

    const handleImpersonate = async (userId) => {
        try {
            const { data } = await api.get(`/auth/impersonate/${userId}`);
            switchUser(data);
            navigate('/');
        } catch (err) {
            console.error(err);
            toast.error('Failed to login as user');
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

            {/* Status Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {['all', 'pending', 'active', 'suspended'].map(s => (
                    <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                            statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}>
                        {s === 'pending' ? '⏳ Pending' : s === 'active' ? '✅ Active' : s === 'suspended' ? '🚫 Suspended' : 'All'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Shop Owner</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Business Detail</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Invoices</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Status / Plan</th>
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
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                                    user.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>{user.status || 'active'}</span>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${
                                                    user.plan === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                                }`}>{user.plan || 'free'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={(e) => handleToggleDropdown(e, user._id)}
                                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition"
                                            >
                                                <MoreVertical size={18} />
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
            {openDropdown && (() => {
                const user = users.find(u => u._id === openDropdown);
                if (!user) return null;
                return (
                    <div
                        ref={dropdownRef}
                        style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, zIndex: 9999 }}
                        className="w-44 bg-white border border-slate-200 rounded-xl shadow-lg py-1"
                    >
                        {user.status === 'pending' && (
                            <button onClick={() => { handleApprove(user._id); setOpenDropdown(null); }}
                                className="flex items-center w-full px-4 py-2 text-xs font-bold text-green-600 hover:bg-green-50 gap-2">
                                <CheckCircle size={14} /> Approve
                            </button>
                        )}
                        <button onClick={() => { navigate(`/admin/edit-user/${user._id}`); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 gap-2">
                            <Edit3 size={14} /> Edit
                        </button>
                        <button onClick={() => { handleTogglePlan(user._id, user.plan); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 gap-2">
                            <CreditCard size={14} /> {user.plan === 'paid' ? '→ Free Plan' : '→ Paid Plan'}
                        </button>
                        <button onClick={() => { handleImpersonate(user._id); setOpenDropdown(null); }}
                            className="flex items-center w-full px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 gap-2">
                            <LogIn size={14} /> Login As
                        </button>
                        <div className="border-t border-slate-100 my-1" />
                        <button onClick={() => { handleSuspend(user._id, user.status); setOpenDropdown(null); }}
                            className={`flex items-center w-full px-4 py-2 text-xs font-bold gap-2 ${
                                user.status === 'suspended' ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'
                            }`}>
                            <Ban size={14} /> {user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </button>
                    </div>
                );
            })()}
        </div>
    );
};

export default UserList;
