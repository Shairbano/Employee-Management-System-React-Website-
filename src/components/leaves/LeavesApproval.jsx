import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LeavesApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const navigate = useNavigate();

    const fetchLeaves = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/leave', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) setLeaves(res.data.leaves);
        } catch (error) {
            console.error('Error fetching leaves:', error);
        }
    };

    useEffect(() => {
        (async () => {
            await fetchLeaves();
        })();
    }, []);

    const handleStatus = async (id, status) => {
        const res = await axios.patch(`http://localhost:3000/api/leave/${id}`, { status }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
            setSelectedLeave(null);
            fetchLeaves();
        }
    };

    return (
        <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">Leave Requests</h3>
            
            <div className="overflow-x-auto shadow-md rounded">
                <table className="w-full bg-white text-sm text-left">
                    <thead className="bg-gray-200 text-gray-700 uppercase text-xs">
                        <tr>
                            <th className="p-3">Employee</th>
                            <th className="p-3">Department</th>
                            <th className="p-3">Leave Type</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-semibold">{leave.employeeId?.userId?.name || "N/A"}</td>
                                <td className="p-3">{leave.employeeId?.department?.dep_name || "N/A"}</td>
                                <td className="p-3">{leave.leaveType}</td>
                                <td className={`p-3 font-bold ${
                                    leave.status === 'Pending' ? 'text-yellow-600' : 
                                    leave.status === 'Approved' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {leave.status}
                                </td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => setSelectedLeave(leave)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-1 rounded"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- EMS STYLED MODAL --- */}
            {selectedLeave && (
                <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded shadow-xl max-w-2xl w-full p-8 border-4 border-teal-600">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Leave Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Employee Name Style */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Employee Name</label>
                                <p className="border p-2 rounded bg-gray-50">{selectedLeave.employeeId?.userId?.name}</p>
                            </div>

                            {/* Designation / Department Style */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                                <p className="border p-2 rounded bg-gray-50">{selectedLeave.employeeId?.department?.dep_name}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Leave Type</label>
                                <p className="border p-2 rounded bg-gray-50">{selectedLeave.leaveType}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Current Status</label>
                                <p className="border p-2 rounded bg-gray-50">{selectedLeave.status}</p>
                            </div>
                        </div>

                        {/* Full Width Reason Box */}
                        <div className="mt-6">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Reason</label>
                            <div className="border p-3 rounded bg-gray-50 min-h-25 text-gray-700 italic">
                                {selectedLeave.reason}
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            {selectedLeave.status === 'Pending' ? (
                                <>
                                    <button 
                                        onClick={() => handleStatus(selectedLeave._id, 'Approved')}
                                        className="flex-1 bg-teal-600 text-white py-2 rounded font-bold hover:bg-teal-700 transition-colors"
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleStatus(selectedLeave._id, 'Rejected')}
                                        className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </>
                            ) : (
                                <button 
                                    disabled 
                                    className="flex-1 bg-gray-200 text-gray-500 py-2 rounded font-bold"
                                >
                                    This request is already {selectedLeave.status}
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedLeave(null)}
                                className="sm:w-24 bg-gray-500 text-white py-2 rounded font-bold hover:bg-gray-600"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button onClick={() => navigate('/admin-dashboard/')} className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2">
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default LeavesApproval;