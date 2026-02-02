import React, { useState } from 'react';
import { useAuth } from '../../context/authContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ApplyLeave = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leave, setLeave] = useState({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
    });

    const handleChange = (e) => {
        setLeave({ ...leave, [e.target.name]: e.target.value });
    };

   const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Current User Object:", user); // Check if profileId exists here
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post('http://localhost:3000/api/leave/add', 
            { ...leave, employeeId: user.profileId }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
            if (res.data.success) {
                alert("Leave Applied!");
                navigate('/employee-dashboard/leave-history');
            }
        } catch (err) {
            alert("Error applying leave");
            console.error(err);
        }
    };

    return (
        <div>
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
            <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold">Leave Type</label>
                    <select name="leaveType" onChange={handleChange} className="w-full border p-2 rounded" required>
                        <option value="">Select Type</option>
                        <option value="Sick Leave">Sick Leave</option>
                        <option value="Casual Leave">Casual Leave</option>
                        <option value="Annual Leave">Annual Leave</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <label className="block text-sm font-bold">To</label>
                    <input type="date" name="startDate" onChange={handleChange} className="border p-2 w-full rounded" required />
                     <label className="block text-sm font-bold">From</label>
                    <input type="date" name="endDate" onChange={handleChange} className="border p-2 w-full rounded" required />
                </div>
                <textarea name="reason" placeholder="Reason" onChange={handleChange} className="w-full border p-2 rounded" rows="4" required></textarea>
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold">Submit Request</button>
            </form>
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

export default ApplyLeave;