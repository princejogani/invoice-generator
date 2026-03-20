import { useEffect, useState } from 'react';
import api from '../api';
import { User, Phone, Calendar, IndianRupee } from 'lucide-react';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const { data } = await api.get('/customer/list');
                setCustomers(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCustomers();
    }, []);

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">Customers (CRM)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customers.map((customer) => (
                    <div key={customer._id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition">
                        <div className="flex items-center space-x-4 mb-4">
                            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">{customer.name}</h3>
                                <div className="flex items-center text-slate-500 text-sm">
                                    <Phone size={14} className="mr-1" />
                                    {customer.phone}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Total Invoices</span>
                                <span className="font-bold text-slate-800">{customer.totalInvoices}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Pending Amount</span>
                                <span className="font-bold text-orange-600">₹{customer.totalPendingAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-slate-400 mt-4">
                                <Calendar size={12} className="mr-1" />
                                <span>Last transaction: {customer.lastTransactionDate ? new Date(customer.lastTransactionDate).toLocaleDateString() : 'Never'}</span>
                            </div>
                        </div>

                        <button className="w-full mt-6 bg-slate-50 text-slate-700 py-2 rounded font-medium hover:bg-slate-100 transition border border-slate-200">
                            View History
                        </button>
                    </div>
                ))}
            </div>

            {customers.length === 0 && (
                <div className="text-center p-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No customers found. They will appear here when you create invoices.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
