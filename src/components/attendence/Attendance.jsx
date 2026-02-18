import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { FaSearch, FaCalendarDay, FaLock, FaSave } from 'react-icons/fa';

const Attendance = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState({});
    const [searchTerm, setSearchTerm] = useState("");
    const [today] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = useCallback(async () => {
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
                        dbRecord: pastRecord || null 
                    };
                });

                setEmployees(processedEmployees);

                const initialData = {};
                processedEmployees.forEach(emp => {
                    initialData[emp._id] = { 
                        status: emp.leaveStatus || emp.dbRecord?.status || '', 
                        checkIn: emp.dbRecord?.checkIn || '', 
                        checkOut: emp.dbRecord?.checkOut || '' 
                    };
                });
                setAttendanceData(initialData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [today]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusChange = (empId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [empId]: { ...prev[empId], status }
        }));
    };

    const handleTimeChange = (empId, field, value) => {
        setAttendanceData(prev => ({
            ...prev,
            [empId]: { ...prev[empId], [field]: value }
        }));
    };

    const saveIndividualAttendance = async (empId) => {
        const record = attendanceData[empId];
        if (!record.status) return alert("Please select a status.");

        if (record.checkIn && record.checkOut && record.checkOut <= record.checkIn) {
            return alert("Check-Out must be after Check-In.");
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/api/attendance/update', 
                { attendanceData: { [empId]: record }, date: today }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (res.data.success) {
                alert("Saved successfully!");
                fetchData(); 
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("Error saving.");
        }
    };

    // Updated Filter: Now searches by Name, ID, or Department
    const filteredEmployees = employees.filter(emp =>
        emp.userId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.dep_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 text-center text-teal-600 font-bold">Loading...</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border border-teal-100">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                            <FaCalendarDay className="text-teal-600" /> Daily Attendance
                        </h2>
                        <p className="text-gray-500 mt-1 font-medium">Date: {new Date().toDateString()}</p>
                    </div>
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search Name, ID, or Dept..." 
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none w-72 shadow-sm"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800 text-white text-xs uppercase">
                            <tr>
                                <th className="p-5">Employee</th>
                                <th className="p-5">Department</th> {/* New Column */}
                                <th className="p-5">Status</th>
                                <th className="p-5">Shift Hours</th>
                                <th className="p-5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => {
                                const db = emp.dbRecord;
                                const current = attendanceData[emp._id];
                                
                                const isStatusLocked = emp.leaveStatus || !!db?.status;
                                const isCheckInLocked = !!db?.checkIn;
                                const isCheckOutLocked = !!db?.checkOut;
                                
                                const isAbsent = ['Absent', 'On Leave'].includes(current?.status);
                                
                                const isFullySaved = isStatusLocked && 
                                                    (isAbsent || (isCheckInLocked && isCheckOutLocked));

                                return (
                                    <tr key={emp._id} className={`border-b ${isFullySaved ? 'bg-gray-50' : 'hover:bg-teal-50/30'}`}>
                                        <td className="p-5">
                                            <div className="font-bold text-gray-800">{emp.userId.name}</div>
                                            <div className="text-xs text-teal-600 font-bold">ID: {emp.employeeId}</div>
                                        </td>

                                        {/* Department Cell */}
                                        <td className="p-5">
                                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                {emp.department?.dep_name || "N/A"}
                                            </span>
                                        </td>

                                        <td className="p-5">
                                            <select 
                                                disabled={isStatusLocked}
                                                value={current?.status || ""}
                                                onChange={(e) => handleStatusChange(emp._id, e.target.value)}
                                                className="p-2 border rounded text-sm w-40 disabled:bg-transparent font-semibold"
                                            >
                                                <option value="">-- Select --</option>
                                                <option value="Present">Present</option>
                                                <option value="Absent">Absent</option>
                                                <option value="Half-Day">Half Day</option>
                                                <option value="Late">Late Comer</option>
                                                {emp.leaveStatus && <option value="On Leave">On Leave</option>}
                                            </select>
                                        </td>

                                        <td className="p-5">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="time"
                                                    value={current?.checkIn || ""}
                                                    disabled={isCheckInLocked || isAbsent || !current?.status}
                                                    onChange={(e) => handleTimeChange(emp._id, 'checkIn', e.target.value)}
                                                    className="p-1 border rounded text-sm disabled:opacity-50"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input 
                                                    type="time"
                                                    value={current?.checkOut || ""}
                                                    disabled={isCheckOutLocked || isAbsent || !current?.status}
                                                    onChange={(e) => handleTimeChange(emp._id, 'checkOut', e.target.value)}
                                                    className="p-1 border rounded text-sm disabled:opacity-50"
                                                />
                                            </div>
                                        </td>

                                        <td className="p-5 text-center">
                                            {isFullySaved ? (
                                                <span className="text-teal-600 font-bold flex items-center justify-center gap-1">
                                                    <FaLock size={12}/> Saved
                                                </span>
                                            ) : (
                                                <button 
                                                    onClick={() => saveIndividualAttendance(emp._id)}
                                                    className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded flex items-center gap-2 text-sm font-bold mx-auto transition-transform active:scale-95 shadow-md"
                                                >
                                                    <FaSave /> Save
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Attendance;