import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { 
  FaBuilding, FaCogs, FaTachometerAlt, FaUsers, 
  FaLayerGroup, FaChevronDown, FaChevronRight, FaCalendarAlt 
} from 'react-icons/fa';

const AdminSidebar = () => {
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending leaves to trigger the white dot
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/leave', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.data.success) {
          const count = res.data.leaves.filter(l => l.status === 'Pending').length;
          setPendingCount(count);
        }
      } catch (err) {
        console.error("Sidebar fetch error", err);
      }
    };
    fetchPending();
    // Refresh every 30 seconds to catch new requests
    const interval = setInterval(fetchPending, 30000);
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
        <NavLink to="/admin-dashboard" className={linkClass} end>
          <div className="flex items-center space-x-4">
            <FaTachometerAlt />
            <span>Dashboard</span>
          </div>
        </NavLink>

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

        <NavLink to="/admin-dashboard/leaves" className={linkClass}>
          <div className="flex items-center space-x-4">
            <FaCalendarAlt />
            <span>Leaves</span>
          </div>
          {/* THE WHITE NOTIFICATION DOT */}
          {pendingCount > 0 && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
        </NavLink>

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