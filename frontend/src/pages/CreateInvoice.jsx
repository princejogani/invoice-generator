import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, Trash2, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isEditMode = !!id;

    const [customer, setCustomer] = useState({ name: '', phone: '' });
    const [items, setItems] = useState([{ name: '', qty: 1, price: 0, productId: '' }]);
    const [type, setType] = useState('GST');
    const [gstPercentage, setGstPercentage] = useState(18);
    const [adjustments, setAdjustments] = useState([]);
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [loading, setLoading] = useState(false);
    const [whatsappStatus, setWhatsappStatus] = useState('NOT_INITIALIZED');
    const [newAdjustment, setNewAdjustment] = useState({ label: '', value: '', type: 'fixed', operation: 'add' });
    const [products, setProducts] = useState([]);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    useEffect(() => {
        fetchStatus();
        fetchProducts();

        // Load invoice data if in edit mode
        if (isEditMode) {
            loadInvoiceData();
        }
    }, [isEditMode]);

    const loadInvoiceData = useCallback(async () => {
        try {
            // First check if we have invoice data in location state (from InvoiceList)
            if (location.state?.invoice) {
                const invoice = location.state.invoice;
                populateFormWithInvoice(invoice);
            } else {
                // Otherwise fetch from API
                const { data } = await api.get(`/invoice/list?id=${id}`);
                if (data.invoices && data.invoices.length > 0) {
                    const invoice = data.invoices[0];
                    populateFormWithInvoice(invoice);
                } else {
                    alert('Invoice not found');
                    navigate('/invoices');
                }
            }
        } catch (err) {
            console.error('Failed to load invoice:', err);
            alert('Failed to load invoice data');
            navigate('/invoices');
        }
    }, [id, location.state, navigate]);

    const populateFormWithInvoice = (invoice) => {
        setCustomer({
            name: invoice.customerName || '',
            phone: invoice.customerPhone || ''
        });
        setItems(invoice.items?.map(item => ({
            name: item.name || '',
            qty: item.qty || 1,
            price: item.price || 0,
            productId: item.productId || ''
        })) || [{ name: '', qty: 1, price: 0, productId: '' }]);
        setType(invoice.type || 'GST');
        setGstPercentage(invoice.gstPercentage || 18);
        setAdjustments(invoice.adjustments || []);
        // Note: sendWhatsApp is not restored from invoice
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/product/dropdown');
            setProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const searchTimeoutRef = useRef(null);

    const fetchCustomers = async (searchTerm) => {
        if (!searchTerm.trim()) {
            setCustomerOptions([]);
            setShowCustomerDropdown(false);
            return;
        }
        setLoadingCustomers(true);
        try {
            const { data } = await api.get(`/customer/list?search=${encodeURIComponent(searchTerm)}&limit=10`);
            setCustomerOptions(data.customers || []);
            setShowCustomerDropdown(true);
        } catch (err) {
            console.error(err);
            setCustomerOptions([]);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const handleCustomerNameChange = (value) => {
        setCustomer({ ...customer, name: value });
        // Debounce search
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
            fetchCustomers(value);
        }, 300);
    };

    const handleCustomerSelect = (selectedCustomer) => {
        setCustomer({
            name: selectedCustomer.name,
            phone: selectedCustomer.phone
        });
        setCustomerOptions([]);
        setShowCustomerDropdown(false);
    };

    const fetchStatus = async () => {
        try {
            const { data } = await api.get('/whatsapp/status');
            setWhatsappStatus(data.status);
            if (data.status === 'CONNECTED' || data.status === 'AUTHENTICATED') {
                setSendWhatsApp(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const addItem = () => setItems([...items, { name: '', qty: 1, price: 0, productId: '' }]);
    const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = field === 'name' ? value : Number(value);
        setItems(newItems);
    };

    const handleProductSelect = (index, productId) => {
        const newItems = [...items];
        if (!productId) {
            // Clear if empty selection
            newItems[index].productId = '';
            newItems[index].name = '';
            newItems[index].price = 0;
        } else {
            const selectedProduct = products.find(p => p._id === productId);
            if (selectedProduct) {
                newItems[index].productId = selectedProduct._id;
                newItems[index].name = selectedProduct.name;
                newItems[index].price = selectedProduct.price;
            }
        }
        setItems(newItems);
    };

    // Adjustment management functions
    const addAdjustment = () => {
        if (!newAdjustment.label.trim() || newAdjustment.value === '') {
            alert('Please enter adjustment label and value');
            return;
        }

        const value = parseFloat(newAdjustment.value);
        if (isNaN(value)) {
            alert('Please enter a valid number for adjustment value');
            return;
        }

        setAdjustments([...adjustments, {
            label: newAdjustment.label.trim(),
            value: value,
            type: newAdjustment.type,
            operation: newAdjustment.operation
        }]);

        // Reset new adjustment form
        setNewAdjustment({ label: '', value: '', type: 'fixed', operation: 'add' });
    };

    const removeAdjustment = (index) => {
        setAdjustments(adjustments.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
    const gst = type === 'GST' ? (subtotal * gstPercentage) / 100 : 0;

    // Calculate total adjustments
    let totalAdjustments = 0;
    adjustments.forEach(adj => {
        let amount = 0;
        if (adj.type === 'percent') {
            amount = (subtotal * adj.value) / 100;
        } else {
            amount = adj.value;
        }

        if (adj.operation === 'subtract') {
            totalAdjustments -= amount;
        } else {
            totalAdjustments += amount;
        }
    });

    const total = subtotal + gst + totalAdjustments;

    const handleSubmit = async (saveAsDraft = false) => {
        setLoading(true);
        try {
            if (isEditMode) {
                // Update existing invoice
                await api.put('/invoice/update', {
                    id,
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    items,
                    type,
                    subtotal,
                    gstPercentage,
                    gst,
                    adjustments,
                    finalAmount: total,
                    isDraft: saveAsDraft
                });

                // Send WhatsApp if converting from draft to final and WhatsApp is enabled
                if (sendWhatsApp && !saveAsDraft) {
                    await api.post('/whatsapp/send-invoice', {
                        invoiceId: id
                    });
                }

                alert('Invoice updated successfully!');
                navigate('/invoices?draft=' + (saveAsDraft ? 'true' : 'false'));
            } else {
                // Create new invoice
                const { data } = await api.post('/invoice/create', {
                    customerName: customer.name,
                    customerPhone: customer.phone,
                    items,
                    type,
                    subtotal,
                    gstPercentage,
                    gst,
                    adjustments,
                    finalAmount: total,
                    isDraft: saveAsDraft
                });

                // Don't send WhatsApp for draft invoices
                if (sendWhatsApp && !saveAsDraft) {
                    // Fetch template first (optional, but better to use stored one on backend)
                    await api.post('/whatsapp/send-invoice', {
                        invoiceId: data._id
                    });
                }

                if (saveAsDraft) {
                    alert('Invoice saved as draft successfully!');
                    navigate('/invoices?draft=true');
                } else {
                    navigate('/invoices');
                }
            }
        } catch (err) {
            console.error(err);
            alert(isEditMode ? 'Failed to update invoice' : 'Failed to create invoice');
        }
        setLoading(false);
    };

    const renderForm = () => (
        <div className="space-y-6 md:space-y-8 bg-white p-4 md:p-8 rounded-xl shadow-sm border border-slate-200">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded outline-none focus:ring-2 focus:ring-blue-500"
                        value={customer.name}
                        onChange={(e) => handleCustomerNameChange(e.target.value)}
                        onFocus={() => {
                            if (customer.name.trim()) {
                                fetchCustomers(customer.name);
                            }
                        }}
                        onBlur={() => {
                            // Hide dropdown after a short delay to allow click selection
                            setTimeout(() => setShowCustomerDropdown(false), 200);
                        }}
                        required
                    />
                    {showCustomerDropdown && customerOptions.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {loadingCustomers ? (
                                <div className="p-2 text-sm text-slate-500">Loading...</div>
                            ) : (
                                customerOptions.map((cust) => (
                                    <div
                                        key={cust._id}
                                        className="p-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-b-0"
                                        onMouseDown={() => handleCustomerSelect(cust)}
                                    >
                                        <div className="font-medium text-slate-800">{cust.name}</div>
                                        <div className="text-xs text-slate-500">{cust.phone}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
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

            {/* Type & Tax Setting */}
            <div className="flex flex-col md:flex-row md:items-end gap-6 p-4 bg-slate-50 rounded-lg">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Invoice Type</label>
                    <div className="flex space-x-4">
                        {['GST', 'NON-GST', 'ESTIMATE'].map((t) => (
                            <label key={t} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="type"
                                    value={t}
                                    checked={type === t}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="capitalize text-slate-700 text-sm">{t}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {type === 'GST' && (
                    <div className="w-full md:w-32">
                        <label className="block text-xs font-medium text-slate-500 mb-1">GST %</label>
                        <input
                            type="number"
                            className="w-full p-2 border border-slate-300 rounded text-sm font-bold"
                            value={gstPercentage}
                            onChange={(e) => setGstPercentage(Number(e.target.value))}
                        />
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Items</h3>
                    <button
                        type="button"
                        onClick={addItem}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                        <Plus size={16} />
                        <span>Add Item</span>
                    </button>
                </div>

                {items.map((item, index) => (
                    <div key={index} className="flex flex-col md:grid md:grid-cols-12 gap-4 bg-slate-50 p-4 rounded-lg relative border border-slate-100">
                        <div className="md:col-span-6">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Select Product (Optional)</label>
                            <select
                                className="w-full p-2 border border-slate-300 rounded text-sm mb-2"
                                value={item.productId || ''}
                                onChange={(e) => handleProductSelect(index, e.target.value)}
                            >
                                <option value="">-- Choose a product --</option>
                                {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                        {product.name} - ₹{product.price}
                                    </option>
                                ))}
                            </select>
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
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Adjustments & Total */}
            <div className="grid grid-cols-1 md:grid-cols-2 pt-6 border-t border-slate-200 gap-8">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-slate-700 mb-3">Adjustments</label>

                    {/* List of existing adjustments */}
                    {adjustments.length > 0 && (
                        <div className="space-y-3 mb-4">
                            {adjustments.map((adj, index) => (
                                <div key={index} className="flex items-center space-x-2 p-3 bg-white rounded border border-slate-200">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-slate-700 truncate">{adj.label}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${adj.operation === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {adj.operation === 'add' ? '+' : '-'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {adj.type === 'percent' ? `${adj.value}%` : `₹${adj.value}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => removeAdjustment(index)}
                                            className="text-red-500 hover:text-red-600 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add new adjustment form */}
                    <div className="space-y-3 border-t pt-4">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Label</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Shipping, Discount"
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAdjustment.label}
                                    onChange={(e) => setNewAdjustment({ ...newAdjustment, label: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Value</label>
                                <input
                                    type="number"
                                    placeholder={newAdjustment.type === 'percent' ? 'Percentage' : 'Amount'}
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAdjustment.value}
                                    onChange={(e) => setNewAdjustment({ ...newAdjustment, value: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAdjustment.type}
                                    onChange={(e) => setNewAdjustment({ ...newAdjustment, type: e.target.value })}
                                >
                                    <option value="fixed">Fixed Amount (₹)</option>
                                    <option value="percent">Percentage (%)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Operation</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={newAdjustment.operation}
                                    onChange={(e) => setNewAdjustment({ ...newAdjustment, operation: e.target.value })}
                                >
                                    <option value="add">Add (+)</option>
                                    <option value="subtract">Subtract (-)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={addAdjustment}
                            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            <Plus size={16} />
                            <span>Add Adjustment</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3 text-right">
                    <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {type === 'GST' && (
                        <div className="flex justify-between text-slate-600">
                            <span>GST ({gstPercentage}%):</span>
                            <span className="font-bold text-slate-800">₹{gst.toLocaleString()}</span>
                        </div>
                    )}
                    {adjustments.map((adj, index) => {
                        let amount = 0;
                        if (adj.type === 'percent') {
                            amount = (subtotal * adj.value) / 100;
                        } else {
                            amount = adj.value;
                        }

                        // Determine display amount based on operation
                        const displayAmount = adj.operation === 'subtract' ? -amount : amount;

                        return (
                            <div key={index} className="flex justify-between text-slate-600">
                                <span className="text-sm">{adj.label}:</span>
                                <span className="font-bold text-slate-800">
                                    ₹{displayAmount.toLocaleString()}
                                </span>
                            </div>
                        );
                    })}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                        <span className="text-xl font-bold text-slate-800">Final Total:</span>
                        <span className="text-3xl font-bold text-blue-600">₹{total.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button
                    type="button"
                    onClick={() => {
                        if (!customer.name || !customer.phone) {
                            alert('Please fill customer details');
                            return;
                        }
                        setShowPreview(true);
                    }}
                    className="flex items-center space-x-2 bg-slate-800 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-900 transition shadow-xl"
                >
                    <span>Proceed to Preview</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderPreview = () => (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-white p-8 md:p-12 rounded-2xl shadow-2xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>

                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">INVOICE</h2>
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs mt-1">Draft Preview</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-800">Business Name</p>
                        <p className="text-xs text-slate-500">GSTIN: 22AAAAA0000A1Z5</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</p>
                        <p className="text-xl font-bold text-slate-800">{customer.name}</p>
                        <p className="text-slate-500 font-medium">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Invoice Details</p>
                        <p className="text-sm font-bold text-slate-800 capitalize">Type: {type}</p>
                        <p className="text-sm text-slate-500">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <table className="w-full mb-12">
                    <thead>
                        <tr className="border-b-2 border-slate-100 text-left">
                            <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Qty</th>
                            <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Price</th>
                            <th className="py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-4 text-slate-800 font-medium">{item.name}</td>
                                <td className="py-4 text-center text-slate-600 font-mono">{item.qty}</td>
                                <td className="py-4 text-right text-slate-600 font-mono">₹{item.price.toLocaleString()}</td>
                                <td className="py-4 text-right text-slate-800 font-bold font-mono">₹{(item.qty * item.price).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-full md:w-64 space-y-3">
                        <div className="flex justify-between text-slate-500 text-sm">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-800">₹{subtotal.toLocaleString()}</span>
                        </div>
                        {type === 'GST' && (
                            <div className="flex justify-between text-slate-500 text-sm">
                                <span>GST ({gstPercentage}%)</span>
                                <span className="font-bold text-slate-800">₹{gst.toLocaleString()}</span>
                            </div>
                        )}
                        {adjustments.map((adj, index) => {
                            let amount = 0;
                            if (adj.type === 'percent') {
                                amount = (subtotal * adj.value) / 100;
                            } else {
                                amount = adj.value;
                            }

                            return (
                                <div key={index} className="flex justify-between text-slate-500 text-sm">
                                    <span>{adj.label}</span>
                                    <span className="font-bold text-slate-800">
                                        {adj.operation === 'add' ? '' : '-'}₹{amount.toLocaleString()}
                                    </span>
                                </div>
                            );
                        })}
                        <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                            <span className="text-lg font-black text-slate-800">Total</span>
                            <span className="text-2xl font-black text-blue-600">₹{total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm">
                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => setShowPreview(false)}
                        className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 font-bold transition group"
                    >
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Edit Details</span>
                    </button>

                    {(whatsappStatus === 'CONNECTED' || whatsappStatus === 'AUTHENTICATED') && (
                        <label className="flex items-center space-x-3 cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={sendWhatsApp}
                                    onChange={(e) => setSendWhatsApp(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            </div>
                            <span className="text-slate-700 font-bold text-sm">Send to WhatsApp after saving</span>
                        </label>
                    )}
                </div>

                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
                    <button
                        onClick={() => handleSubmit(true)}
                        disabled={loading}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-slate-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-slate-700 transition shadow-xl disabled:bg-slate-400"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Check size={20} />
                                <span>{isEditMode ? 'Update as Draft' : 'Save as Draft'}</span>
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => handleSubmit(false)}
                        disabled={loading}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-blue-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-xl disabled:bg-slate-400"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                            <>
                                <Check size={20} />
                                <span>{isEditMode ? 'Update Invoice' : 'Confirm & Generate'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${!showPreview ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-green-100 text-green-600'}`}>
                    {showPreview ? <Check size={20} /> : '1'}
                </div>
                <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${showPreview ? 'bg-green-200' : 'bg-slate-200'}`}></div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${showPreview ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    2
                </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-8 tracking-tight">
                {isEditMode ? (showPreview ? 'Update Invoice - Preview' : 'Edit Invoice') : (showPreview ? 'Final Preview' : 'Invoice Details')}
            </h1>

            {showPreview ? renderPreview() : renderForm()}
        </div>
    );
};

export default CreateInvoice;
