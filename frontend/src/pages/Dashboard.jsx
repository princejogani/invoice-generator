import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Clock } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, sub }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
    </div>
);

const PIE_COLORS = ['#22c55e', '#f97316', '#eab308'];

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/invoice/stats')
            .then(({ data }) => setStats(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-4 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-24" />
                    ))}
                </div>
            </div>
        );
    }

    const pieData = [
        { name: 'Paid', value: stats?.paidCount || 0 },
        { name: 'Unpaid', value: stats?.unpaidCount || 0 },
        { name: 'Partial', value: stats?.partialCount || 0 },
    ].filter(d => d.value > 0);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6">Business Overview</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Invoices" value={stats?.totalInvoices || 0} icon={FileText} color="bg-blue-500" />
                <StatCard title="Paid Revenue" value={`₹${(stats?.paidAmount || 0).toLocaleString()}`} icon={DollarSign} color="bg-green-500" />
                <StatCard title="Pending Amount" value={`₹${(stats?.pendingAmount || 0).toLocaleString()}`} icon={Clock} color="bg-orange-500" />
                <StatCard title="Total Customers" value={stats?.totalCustomers || 0} icon={Users} color="bg-purple-500" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Monthly Revenue Bar Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Monthly Revenue</h2>
                    {stats?.monthlyRevenue?.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={stats.monthlyRevenue} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                    tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`} />
                                <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No invoice data yet</div>
                    )}
                </div>

                {/* Paid vs Unpaid Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Payment Status</h2>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80}
                                    paddingAngle={3} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Legend iconType="circle" iconSize={10}
                                    formatter={(v) => <span style={{ fontSize: 12, color: '#64748b' }}>{v}</span>} />
                                <Tooltip formatter={(v, n) => [v, n]}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No invoice data yet</div>
                    )}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Customers */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Top Customers</h2>
                    {stats?.topCustomers?.length > 0 ? (
                        <div className="space-y-3">
                            {stats.topCustomers.map((c, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                        <span className="text-sm font-medium text-slate-700 truncate max-w-[160px]">{c._id}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">₹{c.total.toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400">{c.count} invoice{c.count > 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm">No customer data yet</p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/invoices/create')}
                            className="bg-blue-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-blue-700 transition text-sm">
                            + New Invoice
                        </button>
                        <button onClick={() => navigate('/customers')}
                            className="bg-slate-800 text-white px-4 py-3 rounded-lg font-bold hover:bg-slate-900 transition text-sm">
                            View Customers
                        </button>
                        <button onClick={() => navigate('/invoices')}
                            className="bg-orange-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-orange-600 transition text-sm">
                            Pending Invoices
                        </button>
                        <button onClick={() => navigate('/products')}
                            className="bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 transition text-sm">
                            Manage Products
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
