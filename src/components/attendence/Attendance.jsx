import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaCheckCircle, FaCalendarDay, FaLock } from 'react-icons/fa';

const Attendance = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [isAlreadySaved, setIsAlreadySaved] = useState(false); // NEW: Lock State
    const [today] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };

                const [empRes, leaveRes, attendRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/employee', { headers }),
                    axios.get('http://localhost:3000/api/leave', { headers }),
                    axios.get(`http://localhost:3000/api/attendance/fetch?date=${today}`, { headers })
                ]);

                if (empRes.data.success) {
                    const existingAttendance = attendRes.data.records || [];
                    
                    // If records exist for today, lock the UI
                    if (existingAttendance.length > 0) {
                        setIsAlreadySaved(true);
                    }

                    const processedEmployees = empRes.data.employees.map(emp => {
                        const activeLeave = leaveRes.data.leaves.find(l => 
                            l.employeeId?._id === emp._id && 
                            l.status === 'Approved' &&
                            today >= l.startDate.split('T')[0] && 
                            today <= l.endDate.split('T')[0]
                        );

                        const pastRecord = existingAttendance.find(r => r.employeeId?._id === emp._id);

                        return {
                            ...emp,
                            leaveStatus: activeLeave ? 'On Leave' : null,
                            savedStatus: pastRecord ? pastRecord.status : null
                        };
                    });

                    setEmployees(processedEmployees);

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
        if (isAlreadySaved) return; // Prevent change if locked
        setAttendanceData(prev => ({ ...prev, [empId]: status }));
    };

    const saveAttendance = async () => {
        if (isAlreadySaved) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/attendance/update', 
                { attendanceData, date: today }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                alert("Attendance saved and locked successfully!");
                setIsAlreadySaved(true);
                window.location.reload();
            }
        } catch (err) {
            alert("Error updating attendance.");
            console.error(err);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.dep_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center text-teal-600 font-bold">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-teal-100">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                            <FaCalendarDay className="text-teal-600" />
                            Daily Attendance
                        </h2>
                        <p className="text-gray-500 mt-1 font-medium">Date: {new Date().toDateString()}</p>
                        {isAlreadySaved && (
                            <span className="text-red-500 text-xs font-bold flex items-center gap-1 mt-1 uppercase">
                                <FaLock /> Record Locked (No changes allowed)
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="Search Name or Dept..." 
                            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-64"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button 
                            onClick={saveAttendance}
                            disabled={isAlreadySaved}
                            className={`${isAlreadySaved ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 shadow-lg'} text-white px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 `}
                        >
                            <FaCheckCircle /> {isAlreadySaved ? "Attendance Saved" : "Save Attendance"}
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-white uppercase text-xs tracking-wider">
                            <tr>
                                <th className="p-5">Employee</th>
                                <th className="p-5">Department</th>
                                <th className="p-5">Attendance Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp._id} className="hover:bg-teal-50/30">
                                    <td className="p-5">
                                        <div className="font-bold text-gray-800">{emp.userId.name}</div>
                                        <div className="text-xs text-gray-400">ID: {emp.employeeId}</div>
                                    </td>
                                    <td className="p-5 text-gray-600 font-medium">{emp.department?.dep_name}</td>
                                    <td className="p-5">
                                        {emp.leaveStatus ? (
                                            <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">On Leave</span>
                                        ) : (
                                            <select 
                                                disabled={isAlreadySaved}
                                                value={attendanceData[emp._id] || ""}
                                                onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                                                className={`p-2 border rounded-md text-sm font-semibold outline-none w-48 ${isAlreadySaved ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}
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
                </div>
            </div>
        </div>
    );
};

export default Attendance;