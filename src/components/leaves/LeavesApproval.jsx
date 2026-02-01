import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LeavesApproval = () => {
    const [leaves, setLeaves] = useState([]);

    const fetchLeaves = async () => {
        const res = await axios.get('http://localhost:3000/api/leave', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) setLeaves(res.data.leaves);
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
        if (res.data.success) fetchLeaves(); // Refresh list
    };

    return (
        <div className="p-6">
            <h3 className="text-2xl font-bold mb-4">Leave Requests</h3>
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-200 text-gray-700">
                    <tr>
                        <th className="p-3 text-left">Employee</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {leaves.map(leave => (
                        <tr key={leave._id} className="border-b">
                            <td className="p-3">{leave.employeeId?.userId?.name || "N/A"}</td>
                            <td className="p-3">{leave.leaveType}</td>
                            <td className={`p-3 font-bold ${leave.status === 'Pending' ? 'text-yellow-600' : leave.status === 'Approved' ? 'text-green-600' : 'text-red-600'}`}>
                                {leave.status}
                            </td>
                            <td className="p-3 flex justify-center space-x-2">
                                {leave.status === 'Pending' && (
                                    <>
                                        <button onClick={() => handleStatus(leave._id, 'Approved')} className="bg-teal-500 text-white px-3 py-1 rounded">Approve</button>
                                        <button onClick={() => handleStatus(leave._id, 'Rejected')} className="bg-red-500 text-white px-3 py-1 rounded">Reject</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LeavesApproval;