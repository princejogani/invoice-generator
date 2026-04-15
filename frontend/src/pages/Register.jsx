import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', businessPhone: '', gstin: '' });
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h2>
                    <p className="text-slate-500 mb-6">Your account is pending admin approval. You'll be able to login once an admin activates your account.</p>
                    <Link to="/login" className="text-blue-600 font-bold hover:underline">Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-2 text-slate-800 text-center">Create Account</h2>
                <p className="text-slate-500 text-sm text-center mb-6">Your account will be reviewed and activated by an admin.</p>
                {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {[
                        { name: 'name', label: 'Full Name', type: 'text', required: true },
                        { name: 'email', label: 'Email', type: 'email', required: true },
                        { name: 'password', label: 'Password', type: 'password', required: true },
                        { name: 'businessName', label: 'Business Name', type: 'text', required: false },
                        { name: 'businessPhone', label: 'Business Phone', type: 'text', required: false },
                        { name: 'gstin', label: 'GSTIN (optional)', type: 'text', required: false },
                    ].map(field => (
                        <div key={field.name}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                            <input
                                type={field.type}
                                name={field.name}
                                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={form[field.name]}
                                onChange={handleChange}
                                required={field.required}
                            />
                        </div>
                    ))}
                    <button type="submit" disabled={loading}
                        className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition shadow-md disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Register'}
                    </button>
                </form>
                <p className="mt-6 text-center text-slate-600 text-sm">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login here</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
