import React, { useEffect, useState } from 'react';
import SummaryCards from './SummaryCards'; 
import { FaUser, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import axios from 'axios';

const EmployeeSummary = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
    });

    useEffect(() => {
const fetchStats = async () => {
    try {
        const token = localStorage.getItem('token');
        // CHANGE: Use user.profileId instead of user._id
        const res = await axios.get(`http://localhost:3000/api/leave/stats/${user.profileId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
            setStats(res.data.stats);
        }
    } catch (err) {
        console.error("Error fetching employee stats", err);
    }
};

// CHANGE: Trigger only if profileId exists
if (user?.profileId) {
    fetchStats();
}
        
    }, [user]);

    return (
        <div className="p-6">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Welcome Back, {user?.name}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Personal Welcome / Profile Card */}
                <SummaryCards 
                    icon={<FaUser />} 
                    text={"Profile Status"} 
                    number={"Active"} 
                    color="bg-teal-600" 
                />

                {/* Applied Leaves */}
                <SummaryCards 
                    icon={<FaHourglassHalf />} 
                    text={"Leaves Pending"} 
                    number={stats.pending} 
                    color="bg-yellow-500" 
                />

                {/* Approved Leaves */}
                <SummaryCards 
                    icon={<FaCheckCircle />} 
                    text={"Leaves Approved"} 
                    number={stats.approved} 
                    color="bg-green-600" 
                />

                {/* Rejected Leaves */}
                <SummaryCards 
                    icon={<FaTimesCircle />} 
                    text={"Leaves Rejected"} 
                    number={stats.rejected} 
                    color="bg-red-600" 
                />
            </div>

             
        </div>
    );
};

export default EmployeeSummary;