import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Save, GripVertical, ChevronDown, ChevronRight, Palette, Type, LayoutTemplate, Rows, Maximize2 } from 'lucide-react';

// ─── Sample Data ────────────────────────────────────────────────────────────
const SAMPLE = {
    invoiceNumber: 'INV-001234',
    date: new Date().toLocaleDateString('en-IN'),
    dueDate: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN'),
    customerName: 'Rahul Sharma',
    customerPhone: '+91 98765 43210',
    customerAddress: '42, MG Road, Bengaluru, Karnataka 560001',
    items: [
        { name: 'Web Design Service', qty: 1, price: 15000 },
        { name: 'SEO Package (3 months)', qty: 3, price: 3000 },
        { name: 'Domain & Hosting', qty: 1, price: 2500 },
    ],
    subtotal: 26500,
    gst: 4770,
    finalAmount: 31270,
};

const DEFAULT_SECTIONS = [
    { id: 'header', label: 'Header' },
    { id: 'billInfo', label: 'Bill From / Bill To' },
    { id: 'items', label: 'Items Table' },
    { id: 'summary', label: 'Amount Summary' },
    { id: 'footer', label: 'Footer / Notes' },
];

// ─── Reusable Controls ───────────────────────────────────────────────────────
const Slider = ({ label, min, max, value, unit, onChange }) => (
    <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-500">{label}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{value}{unit}</span>
        </div>
        <input type="range" min={min} max={max} value={value}
            onChange={e => onChange(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-blue-500 bg-slate-200" />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>{min}{unit}</span><span>{max}{unit}</span>
        </div>
    </div>
);

Slider.propTypes = {
    label: PropTypes.string.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
    unit: PropTypes.string,
    onChange: PropTypes.func.isRequired,
};
Slider.defaultProps = { unit: 'px' };

const ColorRow = ({ label, value, onChange }) => (
    <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</label>
        <div className="relative flex-shrink-0">
            <input type="color" value={value} onChange={e => onChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-slate-200 p-0.5" />
        </div>
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
            className="flex-1 text-xs font-mono p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-400 outline-none" />
    </div>
);

ColorRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
};

const SelectRow = ({ label, value, options, onChange }) => (
    <div className="flex items-center gap-2 mb-3">
        <label className="text-xs text-slate-500 w-28 flex-shrink-0">{label}</label>
        <select value={value} onChange={e => onChange(e.target.value)}
            className="flex-1 text-xs p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-400 outline-none bg-white">
            {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    </div>
);

SelectRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })).isRequired,
    onChange: PropTypes.func.isRequired,
};

const ToggleRow = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">{label}</span>
        <button onClick={() => onChange(!value)}
            className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? 'bg-blue-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

ToggleRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
};

const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-2">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex items-center gap-2">
                    <Icon size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
                </div>
                {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </button>
            {open && <div className="p-3 bg-white">{children}</div>}
        </div>
    );
};

Section.propTypes = {
    title: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    children: PropTypes.node.isRequired,
    defaultOpen: PropTypes.bool,
};
Section.defaultProps = { defaultOpen: false };

// ─── A4 Invoice Preview ──────────────────────────────────────────────────────
const InvoicePreview = ({ c, profile, sections }) => {
    const headerAlign = c.logoPosition === 'right' ? 'row-reverse' : c.logoPosition === 'center' ? 'column' : 'row';
    const tableHeaderStyle = {
        backgroundColor: c.tableHeaderBg,
        color: c.tableHeaderColor,
        fontSize: c.fontSize + 'px',
        padding: `${c.cellPaddingV}px ${c.cellPaddingH}px`,
        fontWeight: 'bold',
    };
    const cellStyle = {
        fontSize: c.fontSize + 'px',
        padding: `${c.cellPaddingV}px ${c.cellPaddingH}px`,
        color: c.primaryColor,
        borderBottom: c.showRowDividers ? `1px solid ${c.borderColor}` : 'none',
    };

    const renderSection = (id) => {
        switch (id) {
            case 'header': return (
                <div key="header" style={{
                    display: 'flex', flexDirection: headerAlign, alignItems: c.logoPosition === 'center' ? 'center' : 'flex-start',
                    justifyContent: 'space-between', gap: 12,
                    paddingBottom: c.sectionSpacing + 'px',
                    borderBottom: c.showHeaderBorder ? `${c.borderWidth}px solid ${c.borderColor}` : 'none',
                    marginBottom: c.sectionSpacing + 'px',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: c.logoPosition === 'center' ? 'column' : 'row' }}>
                        {profile.logo && c.showLogo !== false && (
                            <img src={profile.logo} alt="logo" style={{ width: c.logoSize + 'px', height: c.logoSize + 'px', objectFit: 'contain', borderRadius: c.logoBorderRadius + 'px' }} />
                        )}
                        <div style={{ textAlign: c.logoPosition === 'center' ? 'center' : 'left' }}>
                            <div style={{ color: c.primaryColor, fontSize: c.headerFontSize + 'px', fontWeight: 'bold', fontFamily: c.fontFamily, lineHeight: 1.2 }}>
                                {profile.businessName || 'Business Name'}
                            </div>
                            {profile.tagline && (
                                <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px', fontStyle: 'italic', marginTop: 2 }}>{profile.tagline}</div>
                            )}
                            {c.showBusinessAddress && profile.businessAddress && (
                                <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px', marginTop: 4, whiteSpace: 'pre-line' }}>{profile.businessAddress}</div>
                            )}
                            {c.showGstin && profile.gstin && (
                                <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px' }}>GSTIN: {profile.gstin}</div>
                            )}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ color: c.primaryColor, fontSize: c.fontSize + 4 + 'px', fontWeight: 'bold', letterSpacing: 2 }}>INVOICE</div>
                        <div style={{ color: c.secondaryColor, fontSize: c.fontSize + 'px', marginTop: 4 }}>#{SAMPLE.invoiceNumber}</div>
                        <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px', marginTop: 2 }}>Date: {SAMPLE.date}</div>
                        {c.showDueDate && <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px' }}>Due: {SAMPLE.dueDate}</div>}
                    </div>
                </div>
            );

            case 'billInfo': return (
                <div key="billInfo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: c.columnGap + 'px', marginBottom: c.sectionSpacing + 'px' }}>
                    {[
                        { title: 'BILL FROM', name: profile.businessName || 'N/A', phone: profile.businessPhone || 'N/A', addr: profile.businessAddress },
                        { title: 'BILL TO', name: SAMPLE.customerName, phone: SAMPLE.customerPhone, addr: SAMPLE.customerAddress },
                    ].map(({ title, name, phone, addr }) => (
                        <div key={title} style={{
                            padding: c.cardPadding + 'px',
                            backgroundColor: c.cardBg,
                            borderRadius: c.cardBorderRadius + 'px',
                            border: c.showCardBorder ? `1px solid ${c.borderColor}` : 'none',
                        }}>
                            <div style={{ color: c.accentColor, fontSize: c.fontSize - 1 + 'px', fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 }}>{title}</div>
                            <div style={{ color: c.primaryColor, fontSize: c.fontSize + 1 + 'px', fontWeight: 'bold' }}>{name}</div>
                            <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px', marginTop: 2 }}>{phone}</div>
                            {c.showCustomerAddress && addr && (
                                <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px', marginTop: 2 }}>{addr}</div>
                            )}
                        </div>
                    ))}
                </div>
            );

            case 'items': return (
                <div key="items" style={{ marginBottom: c.sectionSpacing + 'px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: c.tableBorderRadius + 'px', overflow: 'hidden' }}>
                        <thead>
                            <tr>
                                {['#', 'Item Description', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                                    <th key={h} style={{ ...tableHeaderStyle, textAlign: i > 1 ? 'right' : i === 0 ? 'center' : 'left', width: i === 0 ? '5%' : i === 1 ? '45%' : 'auto' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SAMPLE.items.map((item, idx) => (
                                <tr key={idx} style={{ backgroundColor: c.showAlternateRows && idx % 2 === 1 ? c.alternateRowBg : 'transparent' }}>
                                    <td style={{ ...cellStyle, textAlign: 'center' }}>{idx + 1}</td>
                                    <td style={cellStyle}>{item.name}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>{item.qty}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right' }}>₹{item.price.toLocaleString()}</td>
                                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>₹{(item.qty * item.price).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );

            case 'summary': return (
                <div key="summary" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: c.sectionSpacing + 'px' }}>
                    <div style={{ width: '220px' }}>
                        {[
                            { label: 'Subtotal', value: `₹${SAMPLE.subtotal.toLocaleString()}` },
                            { label: 'GST (18%)', value: `₹${SAMPLE.gst.toLocaleString()}` },
                        ].map(row => (
                            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: `${c.summaryRowPadding}px 0`, borderBottom: c.showSummaryBorders ? `1px solid ${c.borderColor}` : 'none' }}>
                                <span style={{ color: c.secondaryColor, fontSize: c.fontSize + 'px' }}>{row.label}</span>
                                <span style={{ color: c.primaryColor, fontSize: c.fontSize + 'px' }}>{row.value}</span>
                            </div>
                        ))}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: c.totalPadding + 'px',
                            marginTop: 6,
                            backgroundColor: c.accentColor,
                            borderRadius: c.cardBorderRadius + 'px',
                        }}>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: c.fontSize + 1 + 'px' }}>TOTAL</span>
                            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: c.fontSize + 1 + 'px' }}>₹{SAMPLE.finalAmount.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            );

            case 'footer': {
                const hasFooterContent = c.footerText?.trim() || c.showThankYou;
                if (!hasFooterContent) return null;
                return (
                    <div key="footer" style={{
                        marginTop: c.sectionSpacing + 'px',
                        paddingTop: c.sectionSpacing / 2 + 'px',
                        borderTop: `${c.borderWidth}px solid ${c.borderColor}`,
                        textAlign: 'center',
                    }}>
                        {c.footerText?.trim() && <div style={{ color: c.secondaryColor, fontSize: c.fontSize - 1 + 'px' }}>{c.footerText}</div>}
                        {c.showThankYou && <div style={{ color: c.accentColor, fontSize: c.fontSize + 'px', fontWeight: 'bold', marginTop: 4 }}>Thank you for your business!</div>}
                    </div>
                );
            }

            default: return null;
        }
    };

    return (
        <div style={{
            width: '100%',
            backgroundColor: c.backgroundColor,
            fontFamily: c.fontFamily,
            padding: c.pagePadding + 'px',
            boxSizing: 'border-box',
            minHeight: '297mm',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        }}>
            {sections.map(s => renderSection(s.id))}
        </div>
    );
};

InvoicePreview.propTypes = {
    c: PropTypes.shape({
        logoPosition: PropTypes.string,
        tableHeaderBg: PropTypes.string,
        tableHeaderColor: PropTypes.string,
        fontSize: PropTypes.number,
        cellPaddingV: PropTypes.number,
        cellPaddingH: PropTypes.number,
        primaryColor: PropTypes.string,
        secondaryColor: PropTypes.string,
        accentColor: PropTypes.string,
        backgroundColor: PropTypes.string,
        borderColor: PropTypes.string,
        fontFamily: PropTypes.string,
        headerFontSize: PropTypes.number,
        pagePadding: PropTypes.number,
        sectionSpacing: PropTypes.number,
        columnGap: PropTypes.number,
        cardPadding: PropTypes.number,
        cardBg: PropTypes.string,
        cardBorderRadius: PropTypes.number,
        tableBorderRadius: PropTypes.number,
        alternateRowBg: PropTypes.string,
        summaryRowPadding: PropTypes.number,
        totalPadding: PropTypes.number,
        logoSize: PropTypes.number,
        logoBorderRadius: PropTypes.number,
        borderWidth: PropTypes.number,
        showHeaderBorder: PropTypes.bool,
        showCardBorder: PropTypes.bool,
        showRowDividers: PropTypes.bool,
        showAlternateRows: PropTypes.bool,
        showSummaryBorders: PropTypes.bool,
        showDueDate: PropTypes.bool,
        showBusinessAddress: PropTypes.bool,
        showGstin: PropTypes.bool,
        showCustomerAddress: PropTypes.bool,
        showThankYou: PropTypes.bool,
        showLogo: PropTypes.bool,
        footerText: PropTypes.string,
    }).isRequired,
    profile: PropTypes.shape({
        logo: PropTypes.string,
        businessName: PropTypes.string,
        tagline: PropTypes.string,
        businessAddress: PropTypes.string,
        businessPhone: PropTypes.string,
        gstin: PropTypes.string,
        invoiceCustomizations: PropTypes.object,
    }).isRequired,
    sections: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
    })).isRequired,
};

// ─── Default Customization Values ────────────────────────────────────────────
export const DEFAULT_CUSTOMIZATIONS = {
    // Colors
    primaryColor: '#1e293b',
    secondaryColor: '#64748b',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    tableHeaderBg: '#1e293b',
    tableHeaderColor: '#ffffff',
    cardBg: '#f8fafc',
    alternateRowBg: '#f1f5f9',
    // Typography
    fontFamily: 'Helvetica, Arial, sans-serif',
    fontSize: 11,
    headerFontSize: 24,
    // Spacing
    pagePadding: 32,
    sectionSpacing: 20,
    cellPaddingV: 8,
    cellPaddingH: 10,
    columnGap: 16,
    cardPadding: 12,
    summaryRowPadding: 6,
    totalPadding: 10,
    // Layout
    logoSize: 60,
    logoPosition: 'left',
    logoBorderRadius: 4,
    badgeBorderRadius: 4,
    cardBorderRadius: 6,
    tableBorderRadius: 6,
    borderWidth: 1,
    // Toggles
    showHeaderBorder: true,
    showCardBorder: true,
    showRowDividers: true,
    showAlternateRows: true,
    showDueDate: true,
    showBusinessAddress: true,
    showGstin: true,
    showCustomerAddress: true,
    showThankYou: true,
    showSummaryBorders: true,
    showLogo: true,
    // Footer
    footerText: 'Payment due within 7 days. Thank you for your business.',
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SettingsInvoice = ({ profile, setProfile, onSave, loading }) => {
    const c = { ...DEFAULT_CUSTOMIZATIONS, ...(profile.invoiceCustomizations || {}) };
    const setC = (patch) => setProfile({ ...profile, invoiceCustomizations: { ...c, ...patch } });

    const [sections, setSections] = useState(DEFAULT_SECTIONS);
    const [mobileTab, setMobileTab] = useState('editor');
    const dragItem = useRef(null);
    const dragOver = useRef(null);

    const handleDragStart = (idx) => { dragItem.current = idx; };
    const handleDragEnter = (idx) => { dragOver.current = idx; };
    const handleDragEnd = () => {
        if (dragItem.current === null || dragOver.current === null) return;
        const updated = [...sections];
        const [dragged] = updated.splice(dragItem.current, 1);
        updated.splice(dragOver.current, 0, dragged);
        dragItem.current = null;
        dragOver.current = null;
        setSections(updated);
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden">
            {/* ── Mobile Tab Bar ── */}
            <div className="lg:hidden flex border-b border-slate-200 bg-white flex-shrink-0">
                <button
                    onClick={() => setMobileTab('editor')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                        mobileTab === 'editor' ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' : 'text-slate-500'
                    }`}>
                    Editor
                </button>
                <button
                    onClick={() => setMobileTab('preview')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                        mobileTab === 'preview' ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50' : 'text-slate-500'
                    }`}>
                    Preview
                </button>
            </div>

            {/* ── Left Panel: Editor ── */}
            <div className={`${
                mobileTab === 'editor' ? 'flex' : 'hidden'
            } lg:flex w-full lg:w-80 flex-shrink-0 bg-white border-r border-slate-200 flex-col lg:h-screen`}>
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Invoice Editor</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Changes reflect live on the right</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3">
                    {/* Colors */}
                    <Section title="Colors" icon={Palette} defaultOpen>
                        <ColorRow label="Primary Text" value={c.primaryColor} onChange={v => setC({ primaryColor: v })} />
                        <ColorRow label="Secondary Text" value={c.secondaryColor} onChange={v => setC({ secondaryColor: v })} />
                        <ColorRow label="Accent / Brand" value={c.accentColor} onChange={v => setC({ accentColor: v })} />
                        <ColorRow label="Background" value={c.backgroundColor} onChange={v => setC({ backgroundColor: v })} />
                        <ColorRow label="Border" value={c.borderColor} onChange={v => setC({ borderColor: v })} />
                        <ColorRow label="Table Header BG" value={c.tableHeaderBg} onChange={v => setC({ tableHeaderBg: v })} />
                        <ColorRow label="Table Header Text" value={c.tableHeaderColor} onChange={v => setC({ tableHeaderColor: v })} />
                        <ColorRow label="Card Background" value={c.cardBg} onChange={v => setC({ cardBg: v })} />
                        <ColorRow label="Alt Row BG" value={c.alternateRowBg} onChange={v => setC({ alternateRowBg: v })} />
                    </Section>

                    {/* Typography */}
                    <Section title="Typography" icon={Type}>
                        <SelectRow label="Font Family" value={c.fontFamily} onChange={v => setC({ fontFamily: v })} options={[
                            { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
                            { value: 'Georgia, serif', label: 'Georgia' },
                            { value: '"Times New Roman", serif', label: 'Times New Roman' },
                            { value: '"Courier New", monospace', label: 'Courier New' },
                            { value: 'Verdana, sans-serif', label: 'Verdana' },
                            { value: 'Tahoma, sans-serif', label: 'Tahoma' },
                        ]} />
                        <Slider label="Body Font Size" min={8} max={14} value={c.fontSize} onChange={v => setC({ fontSize: v })} />
                        <Slider label="Header Font Size" min={16} max={36} value={c.headerFontSize} onChange={v => setC({ headerFontSize: v })} />
                    </Section>

                    {/* Spacing */}
                    <Section title="Spacing" icon={Maximize2}>
                        <Slider label="Page Padding" min={16} max={60} value={c.pagePadding} onChange={v => setC({ pagePadding: v })} />
                        <Slider label="Section Spacing" min={8} max={48} value={c.sectionSpacing} onChange={v => setC({ sectionSpacing: v })} />
                        <Slider label="Column Gap" min={8} max={40} value={c.columnGap} onChange={v => setC({ columnGap: v })} />
                        <Slider label="Card Padding" min={6} max={24} value={c.cardPadding} onChange={v => setC({ cardPadding: v })} />
                        <Slider label="Cell Padding (V)" min={4} max={20} value={c.cellPaddingV} onChange={v => setC({ cellPaddingV: v })} />
                        <Slider label="Cell Padding (H)" min={4} max={24} value={c.cellPaddingH} onChange={v => setC({ cellPaddingH: v })} />
                        <Slider label="Summary Row Padding" min={2} max={16} value={c.summaryRowPadding} onChange={v => setC({ summaryRowPadding: v })} />
                        <Slider label="Total Box Padding" min={6} max={20} value={c.totalPadding} onChange={v => setC({ totalPadding: v })} />
                    </Section>

                    {/* Layout */}
                    <Section title="Layout & Borders" icon={LayoutTemplate}>
                        <SelectRow label="Logo Position" value={c.logoPosition} onChange={v => setC({ logoPosition: v })} options={[
                            { value: 'left', label: '← Left' },
                            { value: 'center', label: '↑ Center' },
                            { value: 'right', label: '→ Right' },
                        ]} />
                        <Slider label="Logo Size" min={30} max={120} value={c.logoSize} onChange={v => setC({ logoSize: v })} />
                        <Slider label="Logo Border Radius" min={0} max={60} value={c.logoBorderRadius} onChange={v => setC({ logoBorderRadius: v })} />
                        <Slider label="Card Border Radius" min={0} max={20} value={c.cardBorderRadius} onChange={v => setC({ cardBorderRadius: v })} />
                        <Slider label="Table Border Radius" min={0} max={20} value={c.tableBorderRadius} onChange={v => setC({ tableBorderRadius: v })} />
                        <Slider label="Badge Border Radius" min={0} max={20} value={c.badgeBorderRadius} onChange={v => setC({ badgeBorderRadius: v })} />
                        <Slider label="Border Width" min={1} max={4} value={c.borderWidth} onChange={v => setC({ borderWidth: v })} />
                        <ToggleRow label="Header Border" value={c.showHeaderBorder} onChange={v => setC({ showHeaderBorder: v })} />
                        <ToggleRow label="Card Border" value={c.showCardBorder} onChange={v => setC({ showCardBorder: v })} />
                        <ToggleRow label="Row Dividers" value={c.showRowDividers} onChange={v => setC({ showRowDividers: v })} />
                        <ToggleRow label="Alternate Row Colors" value={c.showAlternateRows} onChange={v => setC({ showAlternateRows: v })} />
                        <ToggleRow label="Summary Row Borders" value={c.showSummaryBorders} onChange={v => setC({ showSummaryBorders: v })} />
                    </Section>

                    {/* Visibility */}
                    <Section title="Show / Hide Fields" icon={Rows}>
                        <ToggleRow label="Logo" value={c.showLogo !== false} onChange={v => setC({ showLogo: v })} />
                        <ToggleRow label="Due Date" value={c.showDueDate} onChange={v => setC({ showDueDate: v })} />
                        <ToggleRow label="Business Address" value={c.showBusinessAddress} onChange={v => setC({ showBusinessAddress: v })} />
                        <ToggleRow label="GSTIN" value={c.showGstin} onChange={v => setC({ showGstin: v })} />
                        <ToggleRow label="Customer Address" value={c.showCustomerAddress} onChange={v => setC({ showCustomerAddress: v })} />
                        <ToggleRow label="Thank You Message" value={c.showThankYou} onChange={v => setC({ showThankYou: v })} />
                        <div className="mt-2">
                            <label className="text-xs text-slate-500 block mb-1">Footer Note Text</label>
                            <textarea rows={2} value={c.footerText} onChange={e => setC({ footerText: e.target.value })}
                                className="w-full text-xs p-2 border border-slate-200 rounded resize-none focus:ring-1 focus:ring-blue-400 outline-none" />
                        </div>
                    </Section>

                    {/* Section Order */}
                    <Section title="Section Order (Drag)" icon={GripVertical}>
                        <p className="text-xs text-slate-400 mb-2">Drag rows to reorder invoice sections</p>
                        <div className="space-y-1.5">
                            {sections.map((sec, idx) => (
                                <div key={sec.id} draggable
                                    onDragStart={() => handleDragStart(idx)}
                                    onDragEnter={() => handleDragEnter(idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={e => e.preventDefault()}
                                    className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded p-2 cursor-grab active:cursor-grabbing hover:border-blue-400 select-none transition">
                                    <GripVertical size={14} className="text-slate-400 flex-shrink-0" />
                                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                                    <span className="text-xs text-slate-700">{sec.label}</span>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Save / Reset Buttons */}
                <div className="p-3 border-t border-slate-200 bg-white flex gap-2">
                    <button
                        onClick={() => setProfile({ ...profile, invoiceCustomizations: { ...DEFAULT_CUSTOMIZATIONS } })}
                        className="flex-shrink-0 px-3 py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                        title="Reset to defaults"
                    >
                        Reset
                    </button>
                    <button onClick={() => onSave(profile)} disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:bg-slate-400">
                        <Save size={16} />
                        {loading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* ── Right Panel: Live A4 Preview ── */}
            <div className={`${
                mobileTab === 'preview' ? 'flex' : 'hidden'
            } lg:flex flex-1 flex-col overflow-y-auto bg-slate-200 p-4 lg:p-6 lg:h-screen`}>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Preview — A4</span>
                    <span className="text-xs text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200">Changes are instant</span>
                </div>
                <div className="w-full max-w-[794px] mx-auto overflow-x-auto">
                    <div className="min-w-[320px]">
                        <InvoicePreview c={c} profile={profile} sections={sections} />
                    </div>
                </div>
            </div>
        </div>
    );
};

SettingsInvoice.propTypes = {
    profile: PropTypes.shape({
        logo: PropTypes.string,
        businessName: PropTypes.string,
        tagline: PropTypes.string,
        businessAddress: PropTypes.string,
        businessPhone: PropTypes.string,
        gstin: PropTypes.string,
        invoiceCustomizations: PropTypes.object,
    }).isRequired,
    setProfile: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired,
    loading: PropTypes.bool,
};

SettingsInvoice.defaultProps = { loading: false };

export default SettingsInvoice;
