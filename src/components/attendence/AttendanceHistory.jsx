import React, { useState } from 'react';
import axios from 'axios';
import { FaHistory, FaSearch, FaCalendarDay, FaCalendarCheck } from 'react-icons/fa';

const AttendanceHistory = () => {
    // Options: 'date' or 'month'
    const [viewType, setViewType] = useState('month'); 
    const [filters, setFilters] = useState({ 
        date: new Date().toISOString().split('T')[0],
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'), 
        year: new Date().getFullYear().toString() 
    });
    const [records, setRecords] = useState([]);
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
            const empRes = await axios.get('http://localhost:3000/api/employee', {
                headers: { Authorization: `Bearer ${token}` }
            });

            let url = `http://localhost:3000/api/attendance/history?`;
            if (viewType === 'date') {
                url += `date=${filters.date}`;
                setDaysInMonth([filters.date.split('-')[2]]); 
            } else {
                url += `month=${filters.month}&year=${filters.year}`;
                setDaysInMonth(generateDays(filters.month, filters.year));
            }

            const attRes = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (empRes.data.success && attRes.data.success) {
                const allEmployees = empRes.data.employees;
                const attendanceData = attRes.data.records;

                const report = allEmployees.map(emp => {
                    const empAttendance = {};
                    let totalP = 0;

                    attendanceData.filter(r => r.employeeId._id === emp._id).forEach(record => {
                        const day = record.date.split('-')[2];
                        empAttendance[day] = record.status;
                        if (record.status === 'Present') totalP++;
                    });

                    return {
                        empCustomId: emp.employeeId,
                        name: emp.userId.name,
                        attendance: empAttendance,
                        totalPresent: totalP
                    };
                });
                setRecords(report);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Fix: Using .includes() to catch "On Leave", "Leave", "Sick Leave" etc.
    const getStatusStyle = (status) => {
        if (!status) return 'bg-gray-100 text-gray-400';
        
        const s = status.toLowerCase();

        if (s.includes('present')) return 'bg-blue-600 text-white';
        if (s.includes('absent'))  return 'bg-red-600 text-white';
        if (s.includes('leave'))   return 'bg-orange-500 text-white'; 
        if (s.includes('half'))    return 'bg-yellow-500 text-white';
        if (s.includes('late'))    return 'bg-purple-600 text-white';
        if (s.includes('off'))     return 'bg-green-600 text-white';
        
        return 'bg-gray-200 text-gray-600';
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="max-w-full mx-auto bg-white rounded-lg shadow-sm border p-6">
                
                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <FaHistory className="text-teal-600" /> Attendance Management
                </h2>

                {/* Navigation Options */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
                    <button onClick={() => setViewType('date')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'date' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>
                        <FaCalendarDay className="inline mr-2"/> Search by Date
                    </button>
                    <button onClick={() => setViewType('month')} className={`px-5 py-2 rounded-md text-sm font-bold transition-all ${viewType === 'month' ? 'bg-white shadow text-teal-600' : 'text-gray-500'}`}>
                        <FaCalendarCheck className="inline mr-2"/> Search by Month
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                    {viewType === 'date' ? (
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Select Date</label>
                            <input type="date" className="border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all bg-white" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})}/>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Year</label>
                                <input type="number" className="border border-gray-300 rounded px-3 py-2 w-28 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">Month</label>
                                <select className="border border-gray-300 rounded px-3 py-2 w-44 text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={filters.month} onChange={(e) => setFilters({...filters, month: e.target.value})}>
                                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                                        <option key={m} value={m}>{new Date(2000, m-1).toLocaleString('default', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                    <button onClick={handleFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"><FaSearch /> Fetch Records</button>
                </div>

                {/* Data Grid */}
                <div className="overflow-x-auto border border-gray-200 rounded shadow-sm">
                    <table className="w-full text-[11px] border-collapse bg-white">
                        <thead>
                            <tr className="bg-slate-800 text-white">
                                <th className="p-2 border border-slate-700 sticky left-0 bg-slate-800 z-20 w-15">ID</th>
                                <th className="p-2 border border-slate-700 sticky left-15 bg-slate-800 z-20 min-w-37.5 text-left">Employee Name</th>
                                {daysInMonth.map(day => (
                                    <th key={day} className={`p-1 border border-slate-700 ${viewType === 'date' ? 'min-w-30' : 'min-w-8'}`}>
                                        {viewType === 'date' ? filters.date : parseInt(day)}
                                    </th>
                                ))}
                                {viewType === 'month' && <th className="p-2 border border-slate-700 bg-blue-700">Total P</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={50} className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Generating Grid...</td></tr>
                            ) : records.length > 0 ? (
                                records.map((emp, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-2 border border-gray-200 text-center sticky left-0 bg-white font-medium shadow-[1px_0_0_#eee]">{emp.empCustomId}</td>
                                        <td className="p-2 border border-gray-200 font-bold sticky left-15 bg-white shadow-[1px_0_0_#eee]">{emp.name}</td>
                                        {daysInMonth.map(day => {
                                            const status = emp.attendance[day];
                                            return (
                                                <td key={day} className={`p-1 border border-gray-200 text-center font-bold transition-all ${getStatusStyle(status)}`}>
                                                    {status ? (viewType === 'date' ? status : (status.includes('Half') ? 'HD' : status.charAt(0))) : 'NF'}
                                                </td>
                                            );
                                        })}
                                        {viewType === 'month' && <td className="p-2 border border-gray-200 text-center font-black bg-blue-50 text-blue-900">{emp.totalPresent}</td>}
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={50} className="p-12 text-center text-gray-400 italic">No records to display.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Legend Section */}
                <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-bold border-t pt-6 text-gray-600">
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-blue-600"></span> PRESENT (P)</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-600"></span> ABSENT (A)</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-orange-500"></span> ON LEAVE (L)</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-yellow-500"></span> HALF DAY (HD)</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-purple-600"></span> LATE (L)</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-100 border"></span> NOT FOUND (NF)</div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceHistory;