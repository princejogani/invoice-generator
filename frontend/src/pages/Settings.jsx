import { useState, useEffect } from 'react';
import { Building, FileText, MessageSquareMore, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SettingsProfile from './settings/SettingsProfile';
import SettingsInvoice from './settings/SettingsInvoice';
import SettingsWhatsApp from './settings/SettingsWhatsApp';
import SettingsTeam from './settings/SettingsTeam';

const DEFAULT_CUSTOMIZATIONS = {
    primaryColor: '#1e293b',
    secondaryColor: '#64748b',
    accentColor: '#3b82f6',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    fontSize: 10,
    headerFontSize: 22,
    logoSize: 60,
    logoPosition: 'left',
};

const TABS = [
    { id: 'profile', label: 'Profile', icon: Building },
    { id: 'invoice', label: 'Invoice Customization', icon: FileText },
    { id: 'whatsapp', label: 'WhatsApp & Messages', icon: MessageSquareMore },
];

const Settings = () => {
    const { user: authUser } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        name: '', email: '', whatsappTemplate: '',
        invoiceCustomizations: DEFAULT_CUSTOMIZATIONS,
        businessName: '', tagline: '', gstin: '',
        businessAddress: '', businessPhone: '', logo: '',
        upiId: '', bankName: '', accountNumber: '', ifscCode: '',
    });

    useEffect(() => {
        api.get('/auth/profile').then(({ data }) => {
            setProfile({
                ...data,
                invoiceCustomizations: { ...DEFAULT_CUSTOMIZATIONS, ...(data.invoiceCustomizations || {}) },
            });
        }).catch(() => console.error('Failed to fetch profile'));
    }, []);

    const handleSave = async (data) => {
        setLoading(true);
        try {
            await api.put('/auth/profile', data);
            toast.success('Settings updated successfully!');
        } catch (err) {
            toast.error('Failed to update settings');
        }
        setLoading(false);
    };

    const tabs = authUser?.role === 'user'
        ? [...TABS, { id: 'team', label: 'Team Members', icon: Users }]
        : TABS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto p-4 md:p-8">
                <h1 className="text-4xl font-black text-slate-800 mb-8">Settings</h1>

                {/* Tab Navigation */}
                <div className="flex flex-wrap gap-2 mb-8 bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}>
                                <Icon size={18} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className={`bg-white rounded-2xl shadow-lg border border-slate-200 ${activeTab === 'invoice' ? 'overflow-hidden' : ''}`}>
                    {activeTab === 'profile' && (
                        <SettingsProfile profile={profile} setProfile={setProfile} onSave={handleSave} loading={loading} />
                    )}
                    {activeTab === 'invoice' && (
                        <SettingsInvoice profile={profile} setProfile={setProfile} onSave={handleSave} loading={loading} />
                    )}
                    {activeTab === 'whatsapp' && (
                        <SettingsWhatsApp profile={profile} setProfile={setProfile} onSave={handleSave} loading={loading} />
                    )}
                    {activeTab === 'team' && authUser?.role === 'user' && (
                        <SettingsTeam />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
