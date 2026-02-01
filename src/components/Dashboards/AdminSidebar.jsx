import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
// Added FaCalendarAlt to the imports
import { 
  FaBuilding, 
  FaCogs, 
  FaTachometerAlt, 
  FaUsers, 
  FaLayerGroup, 
  FaChevronDown, 
  FaChevronRight,
  FaCalendarAlt 
} from 'react-icons/fa';

const AdminSidebar = () => {
  const [isDeptOpen, setIsDeptOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-4 py-2.5 px-4 rounded transition-colors
     ${isActive ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`;

  const subLinkClass = ({ isActive }) =>
    `flex items-center space-x-4 py-2 px-4 rounded ml-6 transition-colors
     ${isActive ? 'text-teal-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-700 text-sm'}`;

  return (
    <div className="bg-gray-800 text-white h-screen fixed left-0 top-0 w-64 overflow-y-auto">
      
      <div className="bg-teal-600 h-12 flex items-center justify-center">
        <h3 className="text-2xl font-bold">EMS</h3>
      </div>

      <div className="px-4 space-y-1 mt-4">

        {/* Dashboard Link */}
        <NavLink to="/admin-dashboard" className={linkClass} end>
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>

        {/* Department Dropdown */}
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

        {/* Leave Section - Fixed typo: NavLink (capital L) and added icon */}
        <NavLink to="/admin-dashboard/leaves" className={linkClass}>
          <FaCalendarAlt />
          <span>Leaves</span>
        </NavLink>

        {/* Settings Link */}
        <NavLink to="/admin-dashboard/setting" className={linkClass}>
          <FaCogs />
          <span>Settings</span>
        </NavLink>

      </div>
    </div>
  );
};

export default AdminSidebar;