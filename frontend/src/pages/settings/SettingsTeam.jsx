import { useState } from 'react';
import { Users, Shield, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import { useEffect } from 'react';

const SettingsTeam = () => {
    const [staff, setStaff] = useState([]);
    const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
    const [staffLoading, setStaffLoading] = useState(false);
    const [fetched, setFetched] = useState(false);

    const fetchStaff = async () => {
        setStaffLoading(true);
        try {
            const { data } = await api.get('/auth/staff');
            setStaff(data);
            setFetched(true);
        } catch (err) {
            console.error('Failed to fetch staff');
        }
        setStaffLoading(false);
    };

    useEffect(() => {
        if (fetched) return;
        fetchStaff();
    }, [])

    const handleAddStaff = async (e) => {
        e.preventDefault();
        setStaffLoading(true);
        try {
            await api.post('/auth/staff', newStaff);
            setNewStaff({ name: '', email: '', password: '' });
            fetchStaff();
            toast.success('Staff member added successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add staff');
        }
        setStaffLoading(false);
    };

    const handleDeleteStaff = async (id) => {
        try {
            await api.delete(`/auth/staff/${id}`);
            toast.success('Staff member removed!');
            fetchStaff();
        } catch (err) {
            toast.error('Failed to remove staff');
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
                <Users className="text-blue-600" size={28} />
                <h2 className="text-2xl font-bold text-slate-800">Team Members</h2>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Your Team</h3>
                {staff.length === 0 ? (
                    <p className="text-slate-500 italic p-6 bg-slate-50 rounded-lg text-center">No team members added yet.</p>
                ) : (
                    <div className="space-y-3">
                        {staff.map(s => (
                            <div key={s._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-blue-100 text-blue-600 p-3 rounded-lg"><Shield size={20} /></div>
                                    <div>
                                        <p className="font-bold text-slate-800">{s.name}</p>
                                        <p className="text-sm text-slate-500">{s.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteStaff(s._id)}
                                    className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Add Team Member</h3>
                <form onSubmit={handleAddStaff} className="space-y-4">
                    <input type="text" placeholder="Full Name" required
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} />
                    <input type="email" placeholder="Email Address" required
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                    <input type="password" placeholder="Password" required
                        className="w-full p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                    <button type="submit" disabled={staffLoading}
                        className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-slate-400">
                        {staffLoading ? 'Adding...' : 'Add Team Member'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SettingsTeam;
