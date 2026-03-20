import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Send } from 'lucide-react';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);
    const [type, setType] = useState('gst');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);

    const addItem = () => setItems([...items, { name: '', qty: 1, price: 0 }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = field === 'name' ? value : Number(value);
        setItems(newItems);
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const gst = type === 'gst' ? subtotal * 0.18 : 0;
    const total = subtotal + gst;

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/invoice/create', {
                customerName: customer.name,
                customerPhone: customer.phone,
                items,
                type,
                subtotal,
                gst,
                finalAmount: total
            });

            if (sendWhatsApp) {
                await api.post('/whatsapp/send-invoice', {
                    invoiceId: data._id,
                    message: `Hello ${customer.name}, your invoice for ₹${total} is ready. Track it here.`
                });
            }

            navigate('/invoices');
        } catch (err) {
            console.error(err);
            alert('Failed to create invoice');
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 md:mb-8">Create New Invoice</h1>

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8 bg-white p-4 md:p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                            value={customer.name}
                            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Customer Phone</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                            value={customer.phone}
                            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Type</label>
                    <div className="flex space-x-4">
                        {['gst', 'non-gst', 'estimate'].map((t) => (
                            <label key={t} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value={t}
                                    checked={type === t}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="capitalize text-slate-700">{t}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800">Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus size={18} />
                            <span>Add Item</span>
                        </button>
                    </div>

                    {items.map((item, index) => (
                        <div key={index} className="flex flex-col md:grid md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-lg relative">
                            <div className="md:col-span-6">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Item Name</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded text-sm"
                                    value={item.name}
                                    onChange={(e) => updateItem(index, 'name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex space-x-4 md:space-x-0 md:contents">
                                <div className="flex-1 md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Qty</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                        value={item.qty}
                                        min="1"
                                        onChange={(e) => updateItem(index, 'qty', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex-1 md:col-span-3">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Price</label>
                                    <input
                                        type="number"
                                        className="w-full p-2 border border-slate-300 rounded text-sm"
                                        value={item.price}
                                        onChange={(e) => updateItem(index, 'price', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex items-end md:col-span-1 md:pb-2">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-500 hover:text-red-600 p-2"
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-2 text-right">
                    <p className="text-slate-600">Subtotal: <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span></p>
                    {type === 'gst' && <p className="text-slate-600">GST (18%): <span className="font-bold text-slate-800">₹{gst.toLocaleString()}</span></p>}
                    <h2 className="text-2xl font-bold text-slate-800">Total: ₹{total.toLocaleString()}</h2>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200">
                    <label className="flex items-center space-x-3 cursor-pointer self-start md:self-auto">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-blue-600"
                            checked={sendWhatsApp}
                            onChange={(e) => setSendWhatsApp(e.target.checked)}
                        />
                        <span className="text-slate-700 font-medium flex items-center text-sm md:text-base">
                            <Send size={18} className="mr-2 text-green-600" />
                            Send via WhatsApp
                        </span>
                    </label>

                    <button
                        type="submit"
                        className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 md:py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-lg"
                    >
                        Create & Save Invoice
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateInvoice;
