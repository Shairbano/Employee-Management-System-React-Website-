import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

const LeaveHistory = () => {
    const [leaves, setLeaves] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate();
     

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem('token');
                // Use user.profileId to fetch specific history
                const res = await axios.get(`http://localhost:3000/api/leave/${user.profileId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) setLeaves(res.data.leaves);
            } catch (err) {
                console.log(err);
            }
        };
        if(user?.profileId) fetchHistory();
    }, [user]);

    return (
        <div>
        <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">My Leave History</h3>
            <table className="w-full bg-white shadow-md rounded overflow-hidden">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">From</th>
                        <th className="p-3 text-left">To</th>
                        <th className="p-3 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {leaves.map((l) => (
                        <tr key={l._id} className="border-b">
                            <td className="p-3">{l.leaveType}</td>
                            <td className="p-3">{new Date(l.startDate).toLocaleDateString()}</td>
                            <td className="p-3">{new Date(l.endDate).toLocaleDateString()}</td>
                            <td className={`p-3 font-bold ${l.status === 'Approved' ? 'text-green-600' : l.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>
                                {l.status}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <button 
                onClick={() => navigate('/employee-dashboard')}
                className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default LeaveHistory;