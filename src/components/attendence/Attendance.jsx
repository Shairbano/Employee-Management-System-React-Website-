import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaCheckCircle, FaCalendarDay } from 'react-icons/fa';

const Attendance = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [today] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                // 1. Fetch Employees, Leaves, and Existing Attendance for today
                const [empRes, leaveRes, attendRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/employee', { headers }),
                    axios.get('http://localhost:3000/api/leave', { headers }),
                    axios.get(`http://localhost:3000/api/attendance/fetch?date=${today}`, { headers })
                ]);

                if (empRes.data.success) {
                    const existingAttendance = attendRes.data.records || [];
                    
                    const processedEmployees = empRes.data.employees.map(emp => {
                        // Check if employee has an approved leave for today
                        const activeLeave = leaveRes.data.leaves.find(l => 
                            l.employeeId?._id === emp._id && 
                            l.status === 'Approved' &&
                            today >= l.startDate.split('T')[0] && 
                            today <= l.endDate.split('T')[0]
                        );

                        // Check if attendance was already marked today
                        const pastRecord = existingAttendance.find(r => r.employeeId?._id === emp._id);

                        return {
                            ...emp,
                            leaveStatus: activeLeave ? 'On Leave' : null,
                            savedStatus: pastRecord ? pastRecord.status : null
                        };
                    });

                    setEmployees(processedEmployees);

                    // Pre-fill attendanceData state with existing records
                    const initialData = {};
                    processedEmployees.forEach(emp => {
                        if (emp.leaveStatus) initialData[emp._id] = 'On Leave';
                        else if (emp.savedStatus) initialData[emp._id] = emp.savedStatus;
                    });
                    setAttendanceData(initialData);
                }
            } catch (err) {
                console.error("Error fetching attendance data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [today]);

    const handleStatusChange = (empId, status) => {
        setAttendanceData(prev => ({ ...prev, [empId]: status }));
    };

    const saveAttendance = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/attendance/update', 
                { attendanceData }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                alert("Attendance saved successfully!");
                window.location.reload(); // Refresh to lock in the new "savedStatus"
            }
        } catch (err) {
            alert("Error updating attendance. Check console.");
            console.error(err);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.userId.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-screen text-teal-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <span className="ml-4 text-xl font-semibold">Syncing Records...</span>
        </div>
    );

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                            <FaCalendarDay className="text-teal-600" />
                            Daily Attendance
                        </h2>
                        <p className="text-gray-500 mt-1 font-medium">Date: {new Date().toDateString()}</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative grow">
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search employee..." 
                                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-teal-500 outline-none"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={saveAttendance}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <FaCheckCircle /> Save Attendance
                        </button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-white uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-5">Employee Name</th>
                                <th className="p-5">Department</th>
                                <th className="p-5">Section</th>
                                <th className="p-5">Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp._id} className="hover:bg-teal-50/30 transition-colors">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-800">{emp.userId.name}</div>
                                        <div className="text-xs text-gray-400">ID: {emp.employeeId || 'N/A'}</div>
                                    </td>
                                    <td className="p-5 text-gray-600 font-medium">
                                        {emp.department?.dep_name || "Unassigned"}
                                    </td>
                                    <td className="p-5 text-gray-600">
                                        {emp.section?.section_name || "N/A"}
                                    </td>
                                    <td className="p-5">
                                        {emp.leaveStatus ? (
                                            <div className="flex items-center gap-2">
                                                <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold border border-blue-200">
                                                    On Leave (Approved)
                                                </span>
                                            </div>
                                        ) : (
                                            <select 
                                                value={attendanceData[emp._id] || ""}
                                                onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                                                className={`p-2 border rounded-md text-sm font-semibold outline-none transition-all ${
                                                    attendanceData[emp._id] === 'Present' ? 'border-green-500 text-green-700' : 
                                                    attendanceData[emp._id] === 'Absent' ? 'border-red-500 text-red-700' : 'bg-white'
                                                }`}
                                            >
                                                <option value="">-- Mark Status --</option>
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Half Day">Half Day</option>
                                                <option value="Late">Late Comer</option>
                                            </select>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredEmployees.length === 0 && (
                        <div className="p-10 text-center text-gray-400 italic">
                            No employees found matching your search.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Attendance;