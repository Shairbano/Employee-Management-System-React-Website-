import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/authContext'; // 1. Import your Auth Context
import { 
    FaTachometerAlt, 
    FaCalendarAlt, 
    FaCogs, 
    FaChevronDown, 
    FaChevronUp, 
    FaClipboardList, 
    FaPlusCircle, 
    FaKey, 
    FaUserCircle 
} from 'react-icons/fa';

const EmployeeSidebar = () => {
    const { user } = useAuth(); // 2. Get the logged-in user object
    const [isLeaveOpen, setIsLeaveOpen] = useState(false);
    const [isSettingOpen, setIsSettingOpen] = useState(false);

    const linkClass = ({ isActive }) => {
        return `flex items-center space-x-4 py-2.5 px-4 rounded transition-colors ${
            isActive ? 'bg-teal-500 text-white' : 'text-gray-300 hover:bg-gray-700'
        }`;
    }

    const subLinkClass = ({ isActive }) => {
        return `flex items-center space-x-4 py-2 px-4 rounded ml-8 transition-colors ${
            isActive ? 'text-teal-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-700 text-sm'
        }`;
    }

    return (
        <div className="bg-gray-800 text-white h-screen fixed left-0 top-0 w-64 overflow-y-auto">
            <div className="bg-teal-600 h-12 flex items-center justify-center">
                <h3 className="text-2xl font-bold italic">EMS</h3>
            </div>

            <div className="px-4 space-y-1 mt-4">
                {/* 1. Dashboard */}
                <NavLink to="/employee-dashboard" className={linkClass} end>
                    <FaTachometerAlt />
                    <span>Dashboard</span>
                </NavLink>

                {/* 2. Leaves Section */}
                <div>
                    <button 
                        onClick={() => setIsLeaveOpen(!isLeaveOpen)}
                        className="w-full flex items-center justify-between py-2.5 px-4 text-gray-300 hover:bg-gray-700 rounded transition-colors focus:outline-none"
                    >
                        <div className="flex items-center space-x-4">
                            <FaCalendarAlt />
                            <span>Leaves</span>
                        </div>
                        {isLeaveOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                    </button>

                    {isLeaveOpen && (
                        <div className="mt-1 space-y-1 bg-gray-900/30 rounded-lg">
                            <NavLink to="/employee-dashboard/apply-leave" className={subLinkClass}>
                                <FaPlusCircle className="text-xs" />
                                <span>Apply Leave</span>
                            </NavLink>
                            <NavLink to="/employee-dashboard/leave-history" className={subLinkClass}>
                                <FaClipboardList className="text-xs" />
                                <span>Leave History</span>
                            </NavLink>
                        </div>
                    )}
                </div>

                {/* 3. Settings Section */}
                <div>
                    <button 
                        onClick={() => setIsSettingOpen(!isSettingOpen)}
                        className="w-full flex items-center justify-between py-2.5 px-4 text-gray-300 hover:bg-gray-700 rounded transition-colors focus:outline-none"
                    >
                        <div className="flex items-center space-x-4">
                            <FaCogs />
                            <span>Settings</span>
                        </div>
                        {isSettingOpen ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
                    </button>

                    {isSettingOpen && (
                        <div className="mt-1 space-y-1 bg-gray-900/30 rounded-lg">
                            {/* 3. Update the link to include user._id */}
                            <NavLink 
                                // Add a check to ensure user and id exist before rendering the link
                                  to={user ? `/employee-dashboard/change-profile/${user._id || user.id}` : "#"} 
                                      className={subLinkClass}
                                        >
                                     <FaUserCircle className="text-xs" />
                             <span>Change Profile</span>
                            </NavLink>

                            <NavLink to="/employee-dashboard/change-password" className={subLinkClass}>
                                <FaKey className="text-xs" />
                                <span>Change Password</span>
                            </NavLink>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default EmployeeSidebar;