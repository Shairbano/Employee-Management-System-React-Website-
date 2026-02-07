import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaTimesCircle, FaList, FaArrowLeft, FaSearch } from 'react-icons/fa';

const LeavesApproval = () => {
    const [leaves, setLeaves] = useState([]);
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchQuery, setSearchQuery] = useState(''); // New state for search
    const [selectedLeave, setSelectedLeave] = useState(null);
    const navigate = useNavigate();

    const fetchLeaves = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/leave', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) {
                setLeaves(res.data.leaves);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
        }
    };

    useEffect(() => {
        const abortController = new AbortController();
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/leave', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                    signal: abortController.signal
                });
                if (res.data.success && !abortController.signal.aborted) {
                    setLeaves(res.data.leaves);
                }
            } catch (error) {
                if (!abortController.signal.aborted) {
                    console.error('Error fetching leaves:', error);
                }
            }
        };

        fetchData();
        return () => abortController.abort();
    }, []);

    // Enhanced Filtering Logic (Status + Search)
    const filteredLeaves = React.useMemo(() => {
        return leaves.filter(l => {
            // 1. Filter by Status Card
            const matchesStatus = filterStatus === 'All' || l.status === filterStatus;

            // 2. Filter by Search Query (Department, Leave Type, or Status)
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = 
                l.leaveType.toLowerCase().includes(searchLower) ||
                l.status.toLowerCase().includes(searchLower) ||
                (l.employeeId?.department?.dep_name || "").toLowerCase().includes(searchLower) ||
                (l.employeeId?.userId?.name || "").toLowerCase().includes(searchLower);

            return matchesStatus && matchesSearch;
        });
    }, [filterStatus, leaves, searchQuery]);

    const handleStatus = async (id, status) => {
        try {
            const res = await axios.patch(`http://localhost:3000/api/leave/${id}`, { status }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.data.success) {
                if (selectedLeave) setSelectedLeave({ ...selectedLeave, status: status });
                fetchLeaves();
            }
        } catch (err) {
            alert("Status update failed");
            console.log(err);
        }
    };

    const getCount = (status) => leaves.filter(l => l.status === status).length;

    return (
        <div className={`p-6 bg-gray-100 min-h-screen transition-all duration-300 ${selectedLeave ? 'overflow-hidden' : ''}`}>
            <div className="max-w-7xl mx-auto">
                <h3 className="text-2xl font-black mb-6 text-gray-800 tracking-tight">Leave Approval Management</h3>
                
                {/* --- FILTER STAT CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'All', count: leaves.length, color: 'bg-teal-600', text: 'text-teal-600', icon: <FaList />, border: 'border-teal-600' },
                        { label: 'Pending', count: getCount('Pending'), color: 'bg-yellow-500', text: 'text-yellow-600', icon: <FaClock />, border: 'border-yellow-500' },
                        { label: 'Approved', count: getCount('Approved'), color: 'bg-green-600', text: 'text-green-600', icon: <FaCheckCircle />, border: 'border-green-600' },
                        { label: 'Rejected', count: getCount('Rejected'), color: 'bg-red-500', text: 'text-red-600', icon: <FaTimesCircle />, border: 'border-red-500' },
                    ].map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setFilterStatus(item.label)}
                            className={`flex items-center justify-between p-5 rounded-2xl bg-white border-2 transition-all duration-300 shadow-sm hover:shadow-md ${
                                filterStatus === item.label ? `${item.border} scale-105 z-10` : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${item.color} text-white shadow-lg`}>
                                    {item.icon}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                                    <p className={`text-2xl font-black ${filterStatus === item.label ? item.text : 'text-gray-700'}`}>
                                        {item.count}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* --- SEARCH BAR --- */}
                <div className="relative mb-6 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <FaSearch className="text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                    </div>
                    <input 
                        type="text"
                        placeholder="Search by Leave Type, Department, or Status..."
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-teal-600 rounded-2xl shadow-sm outline-none transition-all font-medium text-gray-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* --- TABLE --- */}
                <div className="overflow-hidden shadow-xl rounded-2xl border border-gray-200">
                    <table className="w-full bg-white text-sm text-left">
                        <thead className="bg-gray-800 text-white uppercase text-[11px] tracking-widest">
                            <tr>
                                <th className="p-4">Employee</th>
                                <th className="p-4">Department</th>
                                <th className="p-4">Leave Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLeaves.length > 0 ? (
                                filteredLeaves.map(leave => (
                                    <tr key={leave._id} className="hover:bg-teal-50/30 transition-colors group">
                                        <td className="p-4 font-bold text-gray-800">{leave.employeeId?.userId?.name || "N/A"}</td>
                                        <td className="p-4 text-gray-500 font-medium">{leave.employeeId?.department?.dep_name || "N/A"}</td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-bold">
                                                {leave.leaveType}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`flex items-center gap-1.5 font-black text-xs ${
                                                leave.status === 'Pending' ? 'text-yellow-600' : 
                                                leave.status === 'Approved' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                <span className={`h-2 w-2 rounded-full animate-pulse ${
                                                    leave.status === 'Pending' ? 'bg-yellow-500' : 
                                                    leave.status === 'Approved' ? 'bg-green-500' : 'bg-red-500'
                                                }`}></span>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => setSelectedLeave(leave)}
                                                className="bg-gray-800 group-hover:bg-teal-600 text-white px-6 py-2 rounded-xl shadow-md transition-all transform active:scale-95 font-bold text-xs"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest">No matching records found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- POPUP MODAL (Remains unchanged) --- */}
                {selectedLeave && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedLeave(null)}></div>
                        <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all animate-in zoom-in duration-200">
                            <div className="bg-teal-600 p-6 text-white flex justify-between items-center">
                                <h2 className="text-xl font-black tracking-tight">Request Details</h2>
                                <button onClick={() => setSelectedLeave(null)} className="hover:rotate-90 transition-transform">
                                    <FaTimesCircle className="text-2xl" />
                                </button>
                            </div>
                            <div className="p-8">
                                <div className="space-y-6">
                                    <div className="flex justify-between border-b pb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Employee Name</p>
                                            <p className="text-gray-900 font-bold">{selectedLeave.employeeId?.userId?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Department</p>
                                            <p className="text-gray-900 font-bold">{selectedLeave.employeeId?.department?.dep_name}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-5 rounded-2xl border-2 border-dashed border-gray-200">
                                        <p className="text-[10px] font-black text-teal-600 uppercase mb-2 italic">Reason for Leave</p>
                                        <p className="text-gray-700 text-sm leading-relaxed font-medium">
                                            {selectedLeave.reason || "No specific reason provided."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{selectedLeave.leaveType}</span>
                                        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                            selectedLeave.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                            selectedLeave.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {selectedLeave.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    {selectedLeave.status === 'Pending' ? (
                                        <>
                                            <button onClick={() => handleStatus(selectedLeave._id, 'Approved')} className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-black hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95 uppercase text-xs">Approve</button>
                                            <button onClick={() => handleStatus(selectedLeave._id, 'Rejected')} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 uppercase text-xs">Reject</button>
                                        </>
                                    ) : (
                                        <button onClick={() => setSelectedLeave(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black hover:bg-black transition-all uppercase text-xs">Close Record</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <button 
                    onClick={() => navigate('/admin-dashboard/')} 
                    className="mt-8 text-gray-400 hover:text-teal-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
                >
                    <FaArrowLeft /> Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default LeavesApproval;