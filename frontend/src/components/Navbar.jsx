import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Plus, X, Menu, ShieldCheck } from 'lucide-react';

const Navbar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const navLinks = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/invoices', icon: FileText, label: 'Invoices' },
        { to: '/invoices/create', icon: Plus, label: 'New Invoice' },
        { to: '/customers', icon: Users, label: 'Customers' },
        { to: '/settings', icon: Settings, label: 'Settings' },
    ];

    if (user?.role === 'admin') {
        navLinks.push({ to: '/admin/users', icon: ShieldCheck, label: 'User Management' });
    }

    const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-4 flex flex-col transition-transform duration-300 ease-in-out transform
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:relative lg:translate-x-0 lg:flex
  `;

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            <nav className={sidebarClasses}>
                <div className="flex items-center justify-between mb-8 p-2">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        InvoiceSaaS
                    </div>
                    <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => { if (window.innerWidth < 1024) toggleSidebar(); }}
                            className={`flex items-center space-x-3 p-3 rounded-lg transition ${location.pathname === link.to
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <link.icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={logout}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-red-900/30 text-red-400 mt-auto transition group border border-transparent hover:border-red-900/30"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </nav>
        </>
    );
};

export default Navbar;
