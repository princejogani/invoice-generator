import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import InvoiceList from './pages/InvoiceList';
import CustomerList from './pages/CustomerList';
import Settings from './pages/Settings';
import AdminUserCreate from './pages/AdminUserCreate';
import UserList from './pages/UserList';
import UserEdit from './pages/UserEdit';
import CustomerPortal from './pages/CustomerPortal';
import { Menu } from 'lucide-react';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;

  return children;
};

const AppContent = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex flex-col lg:flex-row bg-slate-50 min-h-screen overflow-hidden">
      {user && (
        <>
          <Navbar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          {/* Mobile Header */}
          <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
            <span className="font-bold text-xl text-slate-800">InvoiceSaaS</span>
            <button onClick={toggleSidebar} className="p-2 text-slate-600 hover:bg-slate-100 rounded">
              <Menu size={24} />
            </button>
          </header>
        </>
      )}

      <main className="flex-1 overflow-y-auto h-screen relative">
        <Routes>
          <Route path="/p/:token" element={<CustomerPortal />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          {/* <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} /> */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><InvoiceList /></ProtectedRoute>} />
          <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin/create-user" element={<AdminRoute><AdminUserCreate /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserList /></AdminRoute>} />
          <Route path="/admin/edit-user/:id" element={<AdminRoute><UserEdit /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
