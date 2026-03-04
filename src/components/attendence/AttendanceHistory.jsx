import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { FaHistory, FaSearch, FaBuilding, FaArrowLeft, FaFilter, FaChartLine, FaFilePdf, FaCalendarAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AttendanceHistory = () => {
    // --- State Management ---
    const [view, setView] = useState('daily'); // 'daily' or 'advanced'
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
    });
    const [dateWiseRecords, setDateWiseRecords] = useState({});
    const [advFilter, setAdvFilter] = useState({
        type: 'all', 
        value: '',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);

    // --- Helper Functions ---
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const chartData = useMemo(() => {
        if (!reportData || reportData === "NOT_FOUND") return [];
        // CHANGE 2: Only include dates that have at least one marked attendance record
        // A "marked" date means at least one employee has a non-Absent status (i.e., attendance was actually submitted)
        return Object.keys(reportData.dateGroups)
            .filter(date => {
                const records = reportData.dateGroups[date];
                // Only show the date if at least one record has a status that was actively marked
                // (not just defaulted to Absent due to missing record)
                return records.some(r => r.wasMarked === true);
            })
            .sort()
            .map(date => {
                const records = reportData.dateGroups[date];
                return {
                    date: formatDate(date),
                    Present: records.filter(r => r.status === 'Present').length,
                    Absent: records.filter(r => r.status === 'Absent').length,
                    Others: records.filter(r => !['Present', 'Absent'].includes(r.status)).length,
                };
            });
    }, [reportData]);

    // --- Data Fetching: Daily Archive ---
    const handleFetch = async () => {
        try {
            const token = localStorage.getItem('token');
            const [empRes, attRes] = await Promise.all([
                axios.get('http://localhost:3000/api/employee', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/attendance/history?date=${filters.date}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (empRes.data.success && attRes.data.success) {
                const filteredRecords = attRes.data.records.filter(r => 
                    new Date(r.date).toISOString().split('T')[0] === filters.date
                );
                processDailyRecords(empRes.data.employees, filteredRecords);
            }
        } catch (err) { console.error(err); }
    };

    const processDailyRecords = (employees, records) => {
        const groups = {};
        const dateKey = filters.date;
        groups[dateKey] = {};

        employees.forEach(emp => {
            const deptName = emp.department?.dep_name || "Unassigned";
            const record = records.find(r => (r.employeeId?._id || r.employeeId) === emp._id);

            let finalStatus = record?.status;
            if (!finalStatus) {
                const hasLeave = emp.leaves?.some(l => 
                    l.status === 'Approved' && 
                    dateKey >= new Date(l.startDate).toISOString().split('T')[0] &&
                    dateKey <= new Date(l.endDate).toISOString().split('T')[0]
                );
                finalStatus = hasLeave ? 'On Leave' : 'Absent';
            }

            const empData = {
                empCustomId: emp.employeeId,
                name: emp.userId.name,
                dept: deptName,
                checkIn: record?.checkIn || '--:--',
                checkOut: record?.checkOut || '--:--',
                status: finalStatus
            };

            if (!groups[dateKey][deptName]) groups[dateKey][deptName] = [];
            groups[dateKey][deptName].push(empData);
        });
        setDateWiseRecords(groups);
    };

    // CHANGE 1: Generate PDF for a specific daily archive date
    const generateDailyPDF = (date, departments) => {
        const doc = new jsPDF('p', 'mm', 'a4');

        // Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("DAILY ATTENDANCE REPORT", 14, 20);
        doc.setFontSize(10);
        doc.text(`Date: ${formatDate(date)}`, 14, 30);

        // Flatten all employees across departments for stats
        const allEmps = Object.values(departments).flat();
        const present = allEmps.filter(e => e.status === 'Present').length;
        const absent = allEmps.filter(e => e.status === 'Absent').length;
        const onLeave = allEmps.filter(e => e.status === 'On Leave').length;
        const halfDay = allEmps.filter(e => e.status === 'Half Day').length;
        const late = allEmps.filter(e => e.status === 'Late').length;

        // Summary table
        autoTable(doc, {
            startY: 45,
            head: [['Total', 'Present', 'Absent', 'On Leave', 'Half Day', 'Late']],
            body: [[allEmps.length, present, absent, onLeave, halfDay, late]],
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] },
            styles: { fontStyle: 'bold', halign: 'center' }
        });

        let finalY = doc.lastAutoTable.finalY + 10;

        // Per-department tables
        Object.entries(departments).forEach(([dept, emps]) => {
            // Department heading
            doc.setTextColor(13, 148, 136);
            doc.setFontSize(11);
            doc.text(`Department: ${dept}`, 14, finalY);

            autoTable(doc, {
                startY: finalY + 3,
                head: [['Emp ID', 'Employee Name', 'Check In', 'Check Out', 'Status']],
                body: emps.map(e => [e.empCustomId, e.name, e.checkIn, e.checkOut, e.status]),
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] }
            });

            finalY = doc.lastAutoTable.finalY + 10;
        });

        doc.save(`Attendance_${date}.pdf`);
    };

    // --- Data Fetching: Advanced Analysis ---
    const handleAdvancedAnalysis = async () => {
        try {
            const token = localStorage.getItem('token');
            const [empRes, attRes] = await Promise.all([
                axios.get('http://localhost:3000/api/employee', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/attendance/history`, { 
                    params: { fromDate: advFilter.fromDate, toDate: advFilter.toDate },
                    headers: { Authorization: `Bearer ${token}` } 
                })
            ]);

            if (empRes.data.success && attRes.data.success) {
                const employees = empRes.data.employees;
                const records = attRes.data.records;

                const stats = { total: 0, present: 0, absent: 0, leave: 0, halfDay: 0, late: 0, dateGroups: {} };
                let found = false;

                let curr = new Date(advFilter.fromDate);
                const end = new Date(advFilter.toDate);

                while (curr <= end) {
                    const dStr = curr.toISOString().split('T')[0];
                    
                    employees.forEach(emp => {
                        const deptName = emp.department?.dep_name || "Unassigned";
                        
                        if (advFilter.type === 'department' && !deptName.toLowerCase().includes(advFilter.value.toLowerCase())) return;
                        if (advFilter.type === 'employee' && !emp.userId.name.toLowerCase().includes(advFilter.value.toLowerCase()) && !emp.employeeId.toLowerCase().includes(advFilter.value.toLowerCase())) return;

                        const record = records.find(r => 
                            (r.employeeId?._id || r.employeeId) === emp._id && 
                            new Date(r.date).toISOString().split('T')[0] === dStr
                        );

                        // CHANGE 2: Track whether this record was actively marked
                        const wasMarked = !!record;

                        let status = record?.status;
                        if (!status) {
                            const hasLeave = emp.leaves?.some(l => 
                                l.status === 'Approved' && dStr >= new Date(l.startDate).toISOString().split('T')[0] && dStr <= new Date(l.endDate).toISOString().split('T')[0]
                            );
                            status = hasLeave ? 'On Leave' : 'Absent';
                        }

                        found = true;
                        stats.total++;
                        if (status === 'Present') stats.present++;
                        else if (status === 'On Leave') stats.leave++;
                        else if (status === 'Half Day') stats.halfDay++;
                        else if (status === 'Late') stats.late++;
                        else stats.absent++;

                        if (!stats.dateGroups[dStr]) stats.dateGroups[dStr] = [];
                        stats.dateGroups[dStr].push({
                            empCustomId: emp.employeeId,
                            name: emp.userId.name,
                            status: status,
                            dept: deptName,
                            wasMarked: wasMarked // CHANGE 2: store the flag per record
                        });
                    });
                    curr.setDate(curr.getDate() + 1);
                }
                setReportData(found ? stats : "NOT_FOUND");
            }
        } catch (err) {
            setReportData("NOT_FOUND");
            console.error(err);
        }
    };

    // CHANGE 2: Helper — returns only dates where at least one record was actually marked
    const getMarkedDates = (dateGroups) => {
        return Object.entries(dateGroups)
            .filter(([, emps]) => emps.some(e => e.wasMarked === true))
            .sort(([a], [b]) => b.localeCompare(a)); // sorted descending
    };

    const generateAdvancedPDF = () => {
        if (!reportData || reportData === "NOT_FOUND") return;
        const doc = new jsPDF('p', 'mm', 'a4');
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.text("ATTENDANCE REPORT", 14, 20);
        doc.setFontSize(10);
        doc.text(`Period: ${formatDate(advFilter.fromDate)} - ${formatDate(advFilter.toDate)}`, 14, 30);

        autoTable(doc, {
            startY: 45,
            head: [['Total Logs', 'Present', 'Absent', 'On Leave', 'Half Day', 'Late']],
            body: [[reportData.total, reportData.present, reportData.absent, reportData.leave, reportData.halfDay, reportData.late]],
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] }
        });

        let finalY = doc.lastAutoTable.finalY + 10;
        // CHANGE 2: Only export marked dates in PDF as well
        getMarkedDates(reportData.dateGroups).forEach(([date, emps]) => {
            doc.setTextColor(13, 148, 136);
            doc.text(`Date: ${formatDate(date)}`, 14, finalY);
            autoTable(doc, {
                startY: finalY + 2,
                head: [['ID', 'Employee Name', 'Department', 'Status']],
                body: emps.map(e => [e.empCustomId, e.name, e.dept, e.status]),
                theme: 'striped',
                headStyles: { fillColor: [51, 65, 85] }
            });
            finalY = doc.lastAutoTable.finalY + 10;
        });
        doc.save(`Attendance_Report_${advFilter.fromDate}.pdf`);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans text-gray-800">
            <div className="max-w-6xl mx-auto">
                
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            {view === 'daily' ? (
                                <><FaHistory className="text-teal-600" /> Attendance Archive</>
                            ) : (
                                <><FaChartLine className="text-teal-600" /> Range Analysis</>
                            )}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            {view === 'daily' ? 'View and manage daily attendance logs' : 'Analyze patterns across specific dates'}
                        </p>
                    </div>
                    
                    {view === 'daily' ? (
                        <button 
                            onClick={() => setView('advanced')} 
                            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
                        >
                            <FaChartLine className="text-teal-400" /> Advanced Analysis
                        </button>
                    ) : (
                        <button 
                            onClick={() => setView('daily')} 
                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                        >
                            <FaArrowLeft className="text-teal-600" /> Back to Archive
                        </button>
                    )}
                </div>

                {/* --- VIEW 1: DAILY ARCHIVE --- */}
                {view === 'daily' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-end gap-4 mb-10">
                            <div className="flex-1">
                                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-[0.2em]">Filter By Day</label>
                                <div className="relative">
                                    <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input type="date" className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 ring-teal-500/20 outline-none transition-all" value={filters.date} onChange={(e) => setFilters({date: e.target.value})}/>
                                </div>
                            </div>
                            <button onClick={handleFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-teal-600/20">
                                <FaSearch /> Search
                            </button>
                        </div>

                        <div className="space-y-8">
                            {Object.entries(dateWiseRecords).length === 0 ? (
                                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                                    <p className="text-slate-400 font-medium">No records fetched yet. Select a date above.</p>
                                </div>
                            ) : (
                                Object.entries(dateWiseRecords).map(([date, departments]) => {
                                    // CHANGE 1: Compute quick stats for the summary bar
                                    const allEmps = Object.values(departments).flat();
                                    const present = allEmps.filter(e => e.status === 'Present').length;
                                    const absent = allEmps.filter(e => e.status === 'Absent').length;
                                    const onLeave = allEmps.filter(e => e.status === 'On Leave').length;
                                    const halfDay = allEmps.filter(e => e.status === 'Half Day').length;

                                    return (
                                        <div key={date}>
                                            {/* Date header row with PDF button */}
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="bg-teal-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md">
                                                    {formatDate(date)}
                                                </div>
                                                <div className="h-px flex-1 bg-slate-200"></div>
                                                {/* CHANGE 1: PDF download button for daily archive */}
                                                <button
                                                    onClick={() => generateDailyPDF(date, departments)}
                                                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                                                >
                                                    <FaFilePdf /> Download PDF
                                                </button>
                                            </div>

                                            {/* CHANGE 1: Summary stats strip */}
                                            <div className="grid grid-cols-4 gap-3 mb-4">
                                                {[
                                                    { label: 'Present', val: present, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                                                    { label: 'Absent', val: absent, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
                                                    { label: 'On Leave', val: onLeave, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                                                    { label: 'Half Day', val: halfDay, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                                                ].map((s, i) => (
                                                    <div key={i} className={`${s.bg} border rounded-2xl p-4 text-center`}>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{s.label}</p>
                                                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {Object.entries(departments).map(([dept, emps]) => (
                                                <div key={dept} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-4">
                                                    <div className="bg-slate-50 px-6 py-3 border-b flex justify-between items-center">
                                                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                                            <FaBuilding className="text-teal-500" /> {dept}
                                                        </h3>
                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-bold">{emps.length} Employees</span>
                                                    </div>
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-slate-400 text-[11px] uppercase text-left">
                                                                <th className="px-6 py-3 font-bold">Emp ID</th>
                                                                <th className="px-6 py-3 font-bold">Employee Name</th>
                                                                <th className="px-6 py-3 text-center font-bold">Check In</th>
                                                                <th className="px-6 py-3 text-center font-bold">Check Out</th>
                                                                <th className="px-6 py-3 text-right font-bold">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {emps.map((emp, idx) => (
                                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                                    <td className="px-6 py-4 font-medium text-slate-500">{emp.empCustomId}</td>
                                                                    <td className="px-6 py-4 font-bold text-slate-800">{emp.name}</td>
                                                                    <td className="px-6 py-4 text-center text-slate-500">{emp.checkIn}</td>
                                                                    <td className="px-6 py-4 text-center text-slate-500">{emp.checkOut}</td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                                            emp.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 
                                                                            emp.status === 'Absent' ? 'bg-rose-100 text-rose-700' : 
                                                                            emp.status === 'On Leave' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                                        }`}>
                                                                            {emp.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* --- VIEW 2: ADVANCED ANALYSIS --- */}
                {view === 'advanced' && (
                    <div className="animate-in slide-in-from-right-8 duration-500">
                        <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Analysis Type</label>
                                <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm outline-none" value={advFilter.type} onChange={(e) => setAdvFilter({...advFilter, type: e.target.value, value: ''})}>
                                    <option value="all">All Employees</option>
                                    <option value="department">By Department</option>
                                    <option value="employee">Specific Person</option>
                                </select>
                            </div>
                            {advFilter.type !== 'all' && (
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Search Keywords</label>
                                    <input type="text" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" placeholder="Enter name or ID..." value={advFilter.value} onChange={(e) => setAdvFilter({...advFilter, value: e.target.value})}/>
                                </div>
                            )}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">From</label>
                                <input type="date" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" value={advFilter.fromDate} onChange={(e) => setAdvFilter({...advFilter, fromDate: e.target.value})}/>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">To</label>
                                <input type="date" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm" value={advFilter.toDate} onChange={(e) => setAdvFilter({...advFilter, toDate: e.target.value})}/>
                            </div>
                            <button onClick={handleAdvancedAnalysis} className="md:col-span-4 bg-teal-600 text-white py-4 rounded-2xl font-black hover:bg-teal-700 shadow-xl shadow-teal-600/30 transition-all active:scale-95">
                                RUN ANALYTICAL REPORT
                            </button>
                        </div>

                        {reportData && reportData !== "NOT_FOUND" ? (
                            <div className="space-y-8 pb-10">
                                {/* Chart */}
                                <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
                                    <h4 className="text-xs font-black text-slate-400 uppercase mb-6 tracking-widest">Attendance Trend</h4>
                                    {chartData.length === 0 ? (
                                        <p className="text-slate-400 text-sm text-center py-10">No marked attendance dates found in this range.</p>
                                    ) : (
                                        <div className="h-80 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                                    <Legend iconType="circle" />
                                                    <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                                    <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                                                    <Bar dataKey="Others" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    {[
                                        { label: 'Logs', val: reportData.total, color: 'text-slate-600', bg: 'bg-slate-100' },
                                        { label: 'Present', val: reportData.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                        { label: 'Absent', val: reportData.absent, color: 'text-rose-600', bg: 'bg-rose-50' },
                                        { label: 'Leaves', val: reportData.leave, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        { label: 'Half Day', val: reportData.halfDay, color: 'text-purple-600', bg: 'bg-purple-50' },
                                        { label: 'Late', val: reportData.late, color: 'text-orange-600', bg: 'bg-orange-50' },
                                    ].map((s, i) => (
                                        <div key={i} className={`${s.bg} p-6 rounded-3xl text-center border border-transparent`}>
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{s.label}</p>
                                            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* CHANGE 2: Results Tables — only marked dates */}
                                {getMarkedDates(reportData.dateGroups).length === 0 ? (
                                    <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-300">
                                        <p className="text-slate-400 font-medium">No attendance was marked for any date in this range.</p>
                                    </div>
                                ) : (
                                    getMarkedDates(reportData.dateGroups).map(([date, emps]) => (
                                        <div key={date} className="border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white">
                                            <div className="bg-slate-800 px-6 py-3 flex justify-between items-center">
                                                <span className="text-white font-bold text-sm">{formatDate(date)}</span>
                                                <span className="text-slate-400 text-xs">{emps.length} records</span>
                                            </div>
                                            <div className="p-2">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-slate-400 text-[10px] uppercase text-left">
                                                            <th className="p-3">ID</th>
                                                            <th className="p-3">Name</th>
                                                            <th className="p-3">Dept</th>
                                                            <th className="p-3 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {emps.map((e, idx) => (
                                                            <tr key={idx} className="border-b border-slate-50 last:border-0">
                                                                <td className="p-3 text-slate-500">{e.empCustomId}</td>
                                                                <td className="p-3 font-bold text-slate-700">{e.name}</td>
                                                                <td className="p-3 text-slate-400">{e.dept}</td>
                                                                <td className={`p-3 text-right font-black ${e.status === 'Present' ? 'text-emerald-500' : e.status === 'On Leave' ? 'text-blue-500' : 'text-rose-500'}`}>{e.status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))
                                )}

                                <button onClick={generateAdvancedPDF} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black hover:bg-rose-600 shadow-lg flex justify-center items-center gap-2 transition-transform active:scale-[0.98]">
                                    <FaFilePdf /> DOWNLOAD FULL PDF REPORT
                                </button>
                            </div>
                        ) : reportData === "NOT_FOUND" && (
                            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                                <p className="text-slate-400 font-medium">No results found for the selected range/filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceHistory;