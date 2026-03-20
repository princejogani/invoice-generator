import { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { DollarSign, FileText, Users, Clock } from 'lucide-react';

const DashboardCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
        <div className={`p-3 rounded-lg ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalInvoices: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalCustomers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [invoices, customers] = await Promise.all([
                    api.get('/invoice/list'),
                    api.get('/customer/list')
                ]);

                const totalInvoices = invoices.data.length;
                const paidAmount = invoices.data
                    .filter(inv => inv.status === 'paid')
                    .reduce((sum, inv) => sum + inv.finalAmount, 0);
                const pendingAmount = invoices.data
                    .filter(inv => inv.status === 'unpaid')
                    .reduce((sum, inv) => sum + inv.finalAmount, 0);

                setStats({
                    totalInvoices,
                    paidAmount,
                    pendingAmount,
                    totalCustomers: customers.data.length
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">Business Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Invoices"
                    value={stats.totalInvoices}
                    icon={FileText}
                    color="bg-blue-500"
                />
                <DashboardCard
                    title="Paid Revenue"
                    value={`₹${stats.paidAmount.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <DashboardCard
                    title="Pending Amount"
                    value={`₹${stats.pendingAmount.toLocaleString()}`}
                    icon={Clock}
                    color="bg-orange-500"
                />
                <DashboardCard
                    title="Total Customers"
                    value={stats.totalCustomers}
                    icon={Users}
                    color="bg-purple-500"
                />
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
                        <button
                            onClick={() => navigate('/invoices/create')}
                            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition"
                        >
                            + New Invoice
                        </button>
                        <button
                            onClick={() => navigate('/customers')}
                            className="bg-slate-800 text-white px-6 py-3 rounded-lg font-bold hover:bg-slate-900 transition"
                        >
                            View Customers
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
