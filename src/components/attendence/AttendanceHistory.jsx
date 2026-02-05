import React, { useState } from 'react';
import axios from 'axios';
import { FaHistory, FaSearch, FaCalendarDay, FaCalendarCheck, FaBuilding } from 'react-icons/fa';

const AttendanceHistory = () => {
    const [viewType, setViewType] = useState('month');
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: new Date().getFullYear().toString()
    });

    const [groupedRecords, setGroupedRecords] = useState({});
    const [daysInMonth, setDaysInMonth] = useState([]);
    const [loading, setLoading] = useState(false);

    const generateDays = (month, year) => {
        const totalDays = new Date(year, month, 0).getDate();
        return Array.from({ length: totalDays }, (_, i) => (i + 1).toString().padStart(2, '0'));
    };

    const handleFetch = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = viewType === 'date' 
                ? `date=${filters.date}` 
                : `month=${filters.month}&year=${filters.year}`;

            const [empRes, attRes] = await Promise.all([
                axios.get('http://localhost:3000/api/employee', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/attendance/history?${query}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (empRes.data.success && attRes.data.success) {
                const allEmployees = empRes.data.employees;
                const attendanceData = attRes.data.records;
                const groups = {};

                allEmployees.forEach(emp => {
                    const deptName = emp.department?.dep_name || "Unassigned";
                    const empAttendance = {};
                    let totalP = 0;

                    attendanceData.filter(r => r.employeeId._id === emp._id).forEach(record => {
                        // Extract just the day part (DD) from "YYYY-MM-DD"
                        const datePart = record.date.split('T')[0]; // Handle ISO strings
                        const day = datePart.split('-')[2]; 
                        
                        empAttendance[day] = record.status;
                        if (record.status === 'Present') totalP++;
                    });

                    const empData = {
                        empCustomId: emp.employeeId,
                        name: emp.userId.name,
                        attendance: empAttendance,
                        totalPresent: totalP
                    };

                    if (!groups[deptName]) groups[deptName] = [];
                    groups[deptName].push(empData);
                });

                setGroupedRecords(groups);
                // Important: Ensure we use the correct day key for the date view
                setDaysInMonth(viewType === 'date' ? [filters.date.split('-')[2]] : generateDays(filters.month, filters.year));
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        if (!status) return 'bg-gray-100 text-gray-400';
        const s = status.toLowerCase();
        if (s.includes('present')) return 'bg-blue-600 text-white';
        if (s.includes('absent')) return 'bg-red-600 text-white';
        if (s.includes('leave')) return 'bg-orange-500 text-white';
        if (s.includes('half')) return 'bg-yellow-500 text-white';
        if (s.includes('late')) return 'bg-purple-600 text-white';
        return 'bg-gray-200 text-gray-600';
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            <div className="max-w-full mx-auto bg-white rounded-lg shadow-sm border p-6">
                
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <FaHistory className="text-teal-600" /> Attendance Management
                </h2>

                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit border border-gray-200">
                    <button 
                        onClick={() => { setViewType('date'); setGroupedRecords({}); }} 
                        className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'date' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaCalendarDay className="inline mr-2"/> Search by Date
                    </button>
                    <button 
                        onClick={() => { setViewType('month'); setGroupedRecords({}); }} 
                        className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'month' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <FaCalendarCheck className="inline mr-2"/> Search by Month
                    </button>
                </div>

                <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50/80 p-5 rounded-xl border border-gray-200">
                    {viewType === 'date' ? (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Select Date</label>
                            <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})}/>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Year</label>
                                <input type="number" className="border border-gray-300 rounded-lg px-3 py-2 w-28 text-sm outline-none focus:ring-2 focus:ring-teal-500" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Month</label>
                                <select className="border border-gray-300 rounded-lg px-3 py-2 w-44 text-sm outline-none focus:ring-2 focus:ring-teal-500" value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})}>
                                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                                        <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <button onClick={handleFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95">
                        <FaSearch /> Fetch Records
                    </button>
                </div>

                {loading ? (
                    <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Generating Department Grids...</div>
                ) : Object.keys(groupedRecords).length > 0 ? (
                    Object.entries(groupedRecords).map(([deptName, emps]) => (
                        <div key={deptName} className="mb-12">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-teal-700 mb-3 bg-teal-50 p-2 px-4 rounded-lg border-l-4 border-teal-600">
                                <FaBuilding className="text-sm" /> {deptName} 
                                <span className="ml-auto text-[10px] font-medium bg-white px-2 py-1 rounded border border-teal-200 text-teal-600 uppercase tracking-tighter">
                                    {emps.length} Employees
                                </span>
                            </h3>
                            
                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                                <table className="w-full text-[11px] border-collapse bg-white">
                                    <thead>
                                        <tr className="bg-slate-800 text-white uppercase tracking-tighter">
                                            <th className="p-3 border border-slate-700 sticky left-0 bg-slate-800 z-20 w-20">Emp ID</th>
                                            <th className="p-3 border border-slate-700 sticky left-20 bg-slate-800 z-20 min-w-37.5 text-left">Name</th>
                                            {daysInMonth.map(day => (
                                                <th key={day} className={`p-3 border border-slate-700 ${viewType === 'date' ? 'min-w-30 bg-slate-700' : 'w-8'}`}>
                                                    {viewType === 'date' ? new Date(filters.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : parseInt(day)}
                                                </th>
                                            ))}
                                            {viewType === 'month' && <th className="p-3 border border-slate-700 bg-blue-700 w-16 text-center">Total P</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emps.map((emp, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                                                <td className="p-2.5 border border-gray-200 text-center sticky left-0 bg-white font-medium z-10">{emp.empCustomId}</td>
                                                <td className="p-2.5 border border-gray-200 font-bold sticky left-20 bg-white z-10">{emp.name}</td>
                                                {daysInMonth.map(day => {
                                                    const status = emp.attendance[day];
                                                    return (
                                                        <td key={day} className={`p-2.5 border border-gray-200 text-center font-bold ${getStatusStyle(status)}`}>
                                                            {status || 'NF'}
                                                        </td>
                                                    );
                                                })}
                                                {viewType === 'month' && (
                                                    <td className="p-2.5 border border-gray-200 text-center font-black bg-blue-50 text-blue-900">
                                                        {emp.totalPresent}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-16 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                        <div className="text-gray-300 text-5xl mb-4 flex justify-center"><FaHistory /></div>
                        <p className="text-gray-400 font-medium">No records for this selection.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistory;