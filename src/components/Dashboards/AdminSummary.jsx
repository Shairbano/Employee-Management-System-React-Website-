import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SummaryCards from './SummaryCards';
import { FaBuilding, FaLayerGroup, FaUser, FaCalendarAlt, FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';

const AdminSummary = () => {
    const navigate = useNavigate();
    // Initialize with default values so it never reads "undefined"
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:3000/api/dashboard/summary', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (res.data.success) {
                    setStats(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // If data is still fetching, show a loading message instead of crashing
    if (loading) {
        return <div className="p-6 text-xl">Loading Dashboard...</div>;
    }

    // If backend failed and stats is null, show an error message
    if (!stats) {
        return <div className="p-6 text-red-500">Error: Could not load data. Check backend console.</div>;
    }

    return (
        <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 ml-4">Dashboard Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ">
                <div
                className="cursor-pointer transition-transform duration-200 hover:scale-105"
                 onClick={
                    () =>navigate('/admin-dashboard/departments')
                }>
                <SummaryCards icon={<FaBuilding />} text={"Total Departments"} number={stats.stats?.totalDepartments || 0} color="bg-green-600" />
                </div>
                <div 
                className="cursor-pointer transition-transform duration-200 hover:scale-105" 
                onClick={
                    () =>navigate('/admin-dashboard/sections')
                }>
                <SummaryCards icon={<FaLayerGroup />} text={"Total Sections"} number={stats.stats?.totalSections || 0} color="bg-purple-600" />
                </div>
                <div 
                className="cursor-pointer transition-transform duration-200 hover:scale-105
                " 
                onClick={
                    () =>navigate('/admin-dashboard/employees')
                }>
                       <SummaryCards icon={<FaUser />} text={"Total Employees"} number={stats.stats?.totalEmployees || 0} color="bg-blue-600" />
                </div>
             
                
                
            </div>

            <h3 className="text-xl font-semibold mb-4 ml-4">Leaves Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
            ">
                <div className="cursor-pointer transition-transform duration-200 hover:scale-105"
                 onClick={
                    () =>navigate('/admin-dashboard/leaves')
                }>
                    <SummaryCards icon={<FaCalendarAlt />} text={"Leave Applied"} number={stats.leaveStats?.totalLeaves || 0} color="bg-teal-600" />
                </div>
                <div className="cursor-pointer transition-transform duration-200 hover:scale-105"
                 onClick={
                    () =>navigate('/admin-dashboard/leaves')
                }>
                    <SummaryCards icon={<FaCheckCircle />} text={"Leave Approved"} number={stats.leaveStats?.approvedLeaves || 0} color="bg-green-700" />
                </div>

                <div className="cursor-pointer transition-transform duration-200 hover:scale-105"
                 onClick={
                    () =>navigate('/admin-dashboard/leaves')
                }>
                <SummaryCards icon={<FaHourglassHalf />} text={"Leave Pending"} number={stats.leaveStats?.pendingLeaves || 0} color="bg-yellow-600" />
                </div>

                <div className="cursor-pointer transition-transform duration-200 hover:scale-105"
                 onClick={
                    () =>navigate('/admin-dashboard/leaves')
                }>
                     <SummaryCards icon={<FaTimesCircle />} text={"Leave Rejected"} number={stats.leaveStats?.rejectedLeaves || 0} color="bg-red-600" />
                </div>
               
            </div>
        </div>
    );
};

export default AdminSummary;