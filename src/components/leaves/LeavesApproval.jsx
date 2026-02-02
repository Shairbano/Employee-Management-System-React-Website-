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
        const loadLeaves = async () => {
            await fetchLeaves();
        };
        loadLeaves();
    }, []);

    const handleStatus = async (id, status) => {
        try {
            const res = await axios.patch(`http://localhost:3000/api/leave/${id}`, { status }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setSelectedLeave({ ...selectedLeave, status: status });
                fetchLeaves();
            }
        } catch (err) {
            alert("Status update failed");
            console.log(err);
        }
    };

    return (
        <div className={`p-6 bg-gray-100 min-h-screen transition-all duration-300 ${selectedLeave ? 'overflow-hidden' : ''}`}>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Leave Requests</h3>
            
            {/* Table Container */}
            <div className="overflow-x-auto shadow-lg rounded-xl">
                <table className="w-full bg-white text-sm text-left">
                    <thead className="bg-teal-600 text-white uppercase text-xs">
                        <tr>
                            <th className="p-4">Employee</th>
                            <th className="p-4">Department</th>
                            <th className="p-4">Leave Type</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaves.map(leave => (
                            <tr key={leave._id} className="border-b hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-semibold text-gray-700">{leave.employeeId?.userId?.name || "N/A"}</td>
                                <td className="p-4 text-gray-600">{leave.employeeId?.department?.dep_name || "N/A"}</td>
                                <td className="p-4 text-gray-600">{leave.leaveType}</td>
                                <td className={`p-4 font-bold ${
                                    leave.status === 'Pending' ? 'text-yellow-600' : 
                                    leave.status === 'Approved' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {leave.status}
                                </td>
                                <td className="p-4 text-center">
                                    <button 
                                        onClick={() => setSelectedLeave(leave)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-full shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                                    >
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- FLOATING POPUP --- */}
            {selectedLeave && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Background Blur Overlay */}
                    <div 
                        className="absolute inset-0 bg-black/30 backdrop-blur-md transition-opacity duration-300" 
                        onClick={() => setSelectedLeave(null)}
                    ></div>

                    {/* The Floating Card */}
                    <div className="relative bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-lg w-full border border-gray-100 transform transition-all animate-in fade-in zoom-in duration-300">
                        
                        {/* Close Button ("X") */}
                        <button 
                            onClick={() => setSelectedLeave(null)}
                            className="absolute -top-3 -right-3 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-xl border border-gray-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-2 bg-teal-600 rounded-full"></div>
                                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Leave Details</h2>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Employee</p>
                                        <p className="text-gray-900 font-semibold">{selectedLeave.employeeId?.userId?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-teal-600 uppercase mb-1">Department</p>
                                        <p className="text-gray-900 font-semibold">{selectedLeave.employeeId?.department?.dep_name}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Leave Reason</p>
                                    <p className="text-gray-700 italic text-sm leading-relaxed">
                                        "{selectedLeave.reason || "No specific reason provided."}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between bg-teal-50 p-4 rounded-xl">
                                    <span className="text-sm font-bold text-teal-800">{selectedLeave.leaveType}</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                                        selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                        selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {selectedLeave.status}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-8 flex gap-3">
                                {selectedLeave.status === 'Pending' ? (
                                    <>
                                        <button 
                                            onClick={() => handleStatus(selectedLeave._id, 'Approved')}
                                            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-md transition-all active:scale-95"
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            onClick={() => handleStatus(selectedLeave._id, 'Rejected')}
                                            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-md transition-all active:scale-95"
                                        >
                                            Reject
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedLeave(null)}
                                        className="w-full bg-gray-800 text-white py-3 rounded-xl font-bold hover:bg-black transition-all"
                                    >
                                        Close Details
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => navigate('/admin-dashboard/')} 
                className="mt-8 text-gray-500 hover:text-teal-600 font-bold flex items-center gap-2 transition-colors"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default LeavesApproval;