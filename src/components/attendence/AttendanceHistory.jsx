import React, { useState } from 'react';
import axios from 'axios';
import { FaHistory, FaSearch, FaCalendarDay, FaCalendarCheck, FaBuilding, FaFilePdf, FaChartLine, FaTimes, FaFilter } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AttendanceHistory = () => {
    // --- ORIGINAL STATE ---
    const [viewType, setViewType] = useState('month');
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        year: new Date().getFullYear().toString()
    });
    const [groupedRecords, setGroupedRecords] = useState({});
    const [daysInMonth, setDaysInMonth] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- NEW MODULE STATE ---
    const [showAdvancedReport, setShowAdvancedReport] = useState(false);
    const [advFilter, setAdvFilter] = useState({
        type: 'all', // all, department, employee
        value: '',
        fromDate: '',
        toDate: ''
    });
    const [reportData, setReportData] = useState(null);

    // --- ORIGINAL FUNCTIONS ---
    const generateDays = (month, year) => {
        const totalDays = new Date(year, month, 0).getDate();
        return Array.from({ length: totalDays }, (_, i) => (i + 1).toString().padStart(2, '0'));
    };

    const handleFetch = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const query = viewType === 'date' ? `date=${filters.date}` : `month=${filters.month}&year=${filters.year}`;
            const [empRes, attRes] = await Promise.all([
                axios.get('http://localhost:3000/api/employee', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/attendance/history?${query}`, { headers: { Authorization: `Bearer ${token}` } })
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
                        const day = record.date.split('T')[0].split('-')[2];
                        empAttendance[day] = record.status;
                        if (record.status === 'Present') totalP++;
                    });
                    const empData = { 
                        empCustomId: emp.employeeId, 
                        name: emp.userId.name, 
                        attendance: empAttendance, 
                        totalPresent: totalP,
                        dept: deptName // stored for filtering
                    };
                    if (!groups[deptName]) groups[deptName] = [];
                    groups[deptName].push(empData);
                });
                setGroupedRecords(groups);
                setDaysInMonth(viewType === 'date' ? [filters.date.split('-')[2]] : generateDays(filters.month, filters.year));
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const generateReport = () => {
        const doc = new jsPDF('landscape');
        autoTable(doc, { 
            head: [['Emp ID', 'Name', ...daysInMonth, 'Total']],
            body: Object.values(groupedRecords).flat().map(emp => [
                emp.empCustomId,
                emp.name,
                ...daysInMonth.map(d => emp.attendance[d] || '-'),
                emp.totalPresent
            ])
        });
        doc.save("Attendance_Report.pdf");
    };

    // --- DYNAMIC ADVANCED REPORT LOGIC ---
    const handleAdvancedFetch = () => {
        setLoading(true);
        
        let stats = { total: 0, present: 0, absent: 0, halfLeave: 0, fullLeave: 0 };
        const searchValue = advFilter.value.toLowerCase();

        Object.entries(groupedRecords).forEach(([deptName, emps]) => {
            // Filter by Department if selected
            if (advFilter.type === 'department' && !deptName.toLowerCase().includes(searchValue)) return;

            emps.forEach(emp => {
                // Filter by Employee Name/ID if selected
                if (advFilter.type === 'employee' && 
                    !emp.name.toLowerCase().includes(searchValue) && 
                    !emp.empCustomId.toLowerCase().includes(searchValue)) return;

                stats.total++;
                
                Object.values(emp.attendance).forEach(status => {
                    const s = status.toLowerCase();
                    if (s.includes('present')) stats.present++;
                    else if (s.includes('absent')) stats.absent++;
                    else if (s.includes('half')) stats.halfLeave++;
                    else if (s.includes('leave')) stats.fullLeave++;
                });
            });
        });

        setReportData(stats);
        setLoading(false);
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
            <div className="max-w-full mx-auto bg-white rounded-lg shadow-sm border p-6 relative">
                
                <button 
                    onClick={() => setShowAdvancedReport(true)}
                    className="cursor-pointer absolute top-6 right-6 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg z-10 transition-transform active:scale-95"
                >
                    <FaChartLine /> Advanced Insights
                </button>

                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <FaHistory className="text-teal-600" /> Attendance Management
                </h2>

                {/* FILTER UI */}
                <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg w-fit border border-gray-200">
                    <button onClick={() => { setViewType('date'); setGroupedRecords({}); }} className={`px-5 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${viewType === 'date' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>
                        <FaCalendarDay className="inline mr-2"/> Search by Date
                    </button>
                    <button onClick={() => { setViewType('month'); setGroupedRecords({}); }} className={`px-5 py-2 rounded-md text-sm font-bold transition-all cursor-pointer ${viewType === 'month' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}>
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
                            <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Year</label><input type="number" className="border border-gray-300 rounded-lg px-3 py-2 w-28 text-sm outline-none focus:ring-2 focus:ring-teal-500" value={filters.year} onChange={(e) => setFilters({...filters, year: e.target.value})}/></div>
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
                    <button onClick={handleFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"><FaSearch /> Fetch Records</button>
                    {Object.keys(groupedRecords).length > 0 && (
                        <button onClick={generateReport} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"><FaFilePdf /> Generate Report</button>
                    )}
                </div>

                {/* MAIN TABLE */}
                {loading && !showAdvancedReport ? (
                    <div className="p-20 text-center animate-pulse text-gray-400 font-bold uppercase tracking-widest">Generating Department Grids...</div>
                ) : Object.keys(groupedRecords).length > 0 ? (
                    Object.entries(groupedRecords).map(([deptName, emps]) => (
                        <div key={deptName} className="mb-12">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-teal-700 mb-3 bg-teal-50 p-2 px-4 rounded-lg border-l-4 border-teal-600">
                                <FaBuilding className="text-sm" /> {deptName}
                                <span className="ml-auto text-[10px] font-medium bg-white px-2 py-1 rounded border border-teal-200 text-teal-600 uppercase tracking-tighter">{emps.length} Employees</span>
                            </h3>
                            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                                <table className="w-full text-[11px] border-collapse bg-white">
                                    <thead>
                                        <tr className="bg-slate-800 text-white uppercase tracking-tighter">
                                            <th className="p-3 border border-slate-700 sticky left-0 bg-slate-800 z-20 w-20">Emp ID</th>
                                            <th className="p-3 border border-slate-700 sticky left-15 bg-slate-800 z-20 min-w-30.5 text-left">Name</th>
                                            {daysInMonth.map(day => (
                                                <th key={day} className="p-1 border border-slate-700 w-10">
                                                    <span className="text-[9px] text-teal-400 block">{parseInt(day)}</span>
                                                </th>
                                            ))}
                                            {viewType === 'month' && <th className="p-3 border border-slate-700 bg-blue-700 w-16 text-center">Total P</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emps.map((emp, index) => (
                                            <tr key={index} className="hover:bg-gray-50 border-b">
                                                <td className="p-2.5 border border-gray-200 text-center sticky left-0 bg-white font-medium z-10">{emp.empCustomId}</td>
                                                <td className="p-2.5 border border-gray-200 font-bold sticky left-10 bg-white z-8">{emp.name}</td>
                                                {daysInMonth.map(day => (
                                                    <td key={day} className={`p-2.5 border border-gray-200 text-center font-bold ${getStatusStyle(emp.attendance[day])}`}>
                                                        {emp.attendance[day] || 'NF'}
                                                    </td>
                                                ))}
                                                {viewType === 'month' && <td className="p-2.5 border border-gray-200 text-center font-black bg-blue-50 text-blue-900">{emp.totalPresent}</td>}
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

                {/* ADVANCED REPORT MODAL */}
                {showAdvancedReport && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <FaFilter className="text-teal-600" /> Advanced Attendance Report
                                    </h3>
                                    <p className="text-xs text-slate-500">Cross-sectional analysis based on loaded data</p>
                                </div>
                                <button onClick={() => setShowAdvancedReport(false)} className="cursor-pointertext-slate-400 hover:text-rose-500 transition-colors">
                                    <FaTimes size={24} />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Filter By</label>
                                        <select 
                                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                            value={advFilter.type}
                                            onChange={(e) => setAdvFilter({...advFilter, type: e.target.value, value: ''})}
                                        >
                                            <option value="all">All Employees</option>
                                            <option value="department">Department</option>
                                            <option value="employee">Specific Employee</option>
                                        </select>
                                    </div>
                                    {advFilter.type !== 'all' && (
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Enter Name/ID</label>
                                            <input 
                                                type="text" 
                                                className="w-full border rounded-lg p-2 text-sm" 
                                                placeholder={`Search ${advFilter.type}...`} 
                                                value={advFilter.value}
                                                onChange={(e) => setAdvFilter({...advFilter, value: e.target.value})}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">From Date</label>
                                        <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={(e) => setAdvFilter({...advFilter, fromDate: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">To Date</label>
                                        <input type="date" className="w-full border rounded-lg p-2 text-sm" onChange={(e) => setAdvFilter({...advFilter, toDate: e.target.value})} />
                                    </div>
                                </div>

                                <button onClick={handleAdvancedFetch} className=" cursor-pointer w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg flex justify-center items-center gap-2 mb-10">
                                    <FaSearch /> Generate Analysis
                                </button>

                                {reportData && (
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                            {[
                                                { label: 'Total Staff', val: reportData.total, color: 'text-slate-600', bg: 'bg-slate-50' },
                                                { label: 'Present', val: reportData.present, color: 'text-blue-600', bg: 'bg-blue-50' },
                                                { label: 'Absent', val: reportData.absent, color: 'text-red-600', bg: 'bg-red-50' },
                                                { label: 'Half Day', val: reportData.halfLeave, color: 'text-yellow-600', bg: 'bg-yellow-50' },
                                                { label: 'Leaves', val: reportData.fullLeave, color: 'text-orange-600', bg: 'bg-orange-50' },
                                            ].map((stat, i) => (
                                                <div key={i} className={`${stat.bg} p-4 rounded-2xl border border-white shadow-sm text-center`}>
                                                    <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{stat.label}</p>
                                                    <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Attendance Distribution</h4>
                                                <div className="h-64 flex justify-center">
                                                    <Pie data={{
                                                        labels: ['Present', 'Absent', 'Half Day', 'Leave'],
                                                        datasets: [{
                                                            data: [reportData.present, reportData.absent, reportData.halfLeave, reportData.fullLeave],
                                                            backgroundColor: ['#2563eb', '#dc2626', '#f59e0b', '#f97316'],
                                                        }]
                                                    }} options={{ maintainAspectRatio: false }} />
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Quick Summary</h4>
                                                <div className="space-y-4">
                                                    <p className="text-sm text-gray-600">Based on the records currently loaded in the main table, here is the performance breakdown.</p>
                                                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                                        <span className="text-xs font-bold text-teal-800 uppercase">Analysis Note:</span>
                                                        <p className="text-xs text-teal-700 mt-1">Total unique employees found: <strong>{reportData.total}</strong>. Total recorded attendances: <strong>{reportData.present + reportData.absent + reportData.halfLeave + reportData.fullLeave}</strong>.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button onClick={() => window.print()} className="w-full border-2 border-teal-600 text-teal-600 py-3 rounded-xl font-bold hover:bg-teal-50 transition-all flex justify-center items-center gap-2 cursor-pointer">
                                            <FaFilePdf /> Print Summary Analysis
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistory;