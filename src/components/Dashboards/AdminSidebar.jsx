import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBuilding, 
  FaCogs, 
  FaTachometerAlt, 
  FaUsers, 
  FaLayerGroup, 
  FaChevronDown, 
  FaChevronRight, 
  FaCalendarAlt,
  FaClipboardCheck,
  FaHistory 
} from 'react-icons/fa';

const AdminSidebar = () => {
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [attendanceMissing, setAttendanceMissing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. Fetch Pending Leaves
        const leaveRes = await axios.get('http://localhost:3000/api/leave', { headers });
        if (leaveRes.data.success) {
          const count = leaveRes.data.leaves.filter(l => l.status === 'Pending').length;
          setPendingCount(count);
        }

        // 2. Logic to check if ALL employees are marked for today
        const today = new Date().toISOString().split('T')[0];
        const [empRes, attRes] = await Promise.all([
          axios.get('http://localhost:3000/api/employee', { headers }),
          axios.get(`http://localhost:3000/api/attendance/fetch?date=${today}`, { headers })
        ]);

        if (empRes.data.success && attRes.data.success) {
          const totalEmployees = empRes.data.employees.length;
          const markedAttendance = attRes.data.records ? attRes.data.records.length : 0;
          
          // Red dot stays true as long as records count is less than total employees
          setAttendanceMissing(markedAttendance < totalEmployees);
        }
      } catch (error) {
        console.error('Sidebar fetch error:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const linkClass = ({ isActive }) =>
    `flex items-center justify-between py-2.5 px-4 rounded transition-colors
     ${isActive ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`;

  const subLinkClass = ({ isActive }) =>
    `flex items-center space-x-4 py-2 px-4 rounded ml-6 transition-colors
     ${isActive ? 'text-teal-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-700 text-sm'}`;

  return (
    <div className="bg-gray-800 text-white h-screen fixed left-0 top-0 w-64 overflow-y-auto z-40">
      <div className="bg-teal-600 h-12 flex items-center justify-center">
        <h3 className="text-2xl font-bold">EMS</h3>
      </div>

      <div className="px-4 space-y-1 mt-4">
        {/* Dashboard */}
        <NavLink to="/admin-dashboard" className={linkClass} end>
          <div className="flex items-center space-x-4">
            <FaTachometerAlt />
            <span>Dashboard</span>
          </div>
        </NavLink>

        {/* Attendance Dropdown Section */}
        <div>
          <button
            onClick={() => setIsAttendanceOpen(!isAttendanceOpen)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4 relative">
              <FaClipboardCheck />
              <span>Attendance</span>
              {/* Main Notification Dot for Attendance */}
              {attendanceMissing && (
                <span className="absolute -top-1 -left-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </div>
            {isAttendanceOpen ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />}
          </button>

          {isAttendanceOpen && (
            <div className="mt-1 space-y-1 bg-gray-900/50 rounded-b-md">
              <NavLink to="/admin-dashboard/attendance" className={subLinkClass} end>
                <div className={`w-1.5 h-1.5 rounded-full ${attendanceMissing ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>Mark Attendance</span>
              </NavLink>

              <NavLink to="/admin-dashboard/attendance-history" className={subLinkClass}>
                <FaHistory className="text-xs" />
                <span>Attendance History</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Departments Dropdown Section */}
        <div>
          <button
            onClick={() => setIsDeptOpen(!isDeptOpen)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <FaBuilding />
              <span>Departments</span>
            </div>
            {isDeptOpen ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />}
          </button>
          {isDeptOpen && (
            <div className="mt-1 space-y-1 bg-gray-900/50 rounded-b-md">
              <NavLink to="/admin-dashboard/departments" className={subLinkClass} end>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500"></div>
                <span>All Departments</span>
              </NavLink>
              <NavLink to="/admin-dashboard/sections" className={subLinkClass}>
                <FaLayerGroup className="text-xs" />
                <span>Sections</span>
              </NavLink>
              <NavLink to="/admin-dashboard/employees" className={subLinkClass}>
                <FaUsers className="text-xs" />
                <span>Employees</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Leaves */}
        <NavLink to="/admin-dashboard/leaves" className={linkClass}>
          <div className="flex items-center space-x-4 relative">
            <FaCalendarAlt />
            <span>Leaves</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -left-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
            )}
          </div>
          {pendingCount > 0 && (
            <span className="bg-teal-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </NavLink>

        {/* Settings */}
        <NavLink to="/admin-dashboard/setting" className={linkClass}>
          <div className="flex items-center space-x-4">
            <FaCogs />
            <span>Settings</span>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

export default AdminSidebar;