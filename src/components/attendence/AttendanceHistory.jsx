import React, { useState } from 'react';
import axios from 'axios';
import { FaHistory, FaSearch, FaBuilding, FaTimes, FaFilter, FaPrint, FaChartLine } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AttendanceHistory = () => {
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
    });
    const [groupedRecords, setGroupedRecords] = useState({});
    const [showAdvancedReport, setShowAdvancedReport] = useState(false);
    const [advFilter, setAdvFilter] = useState({
        type: 'all', 
        value: '',
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);

    const chartOptions = {
        maintainAspectRatio: false,
        animation: { duration: 0 },
        responsive: true,
        plugins: {
            legend: { position: 'bottom' }
        }
    };

    const handleFetch = async () => {
        try {
            const token = localStorage.getItem('token');
            const [empRes, attRes] = await Promise.all([
                axios.get('http://localhost:3000/api/employee', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`http://localhost:3000/api/attendance/history?date=${filters.date}`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            if (empRes.data.success && attRes.data.success) {
                processRecords(empRes.data.employees, attRes.data.records);
            }
        } catch (err) { console.error(err); }
    };

    const processRecords = (employees, records) => {
        const groups = {};
        employees.forEach(emp => {
            const deptName = emp.department?.dep_name || "Unassigned";
            const record = records.find(r => r.employeeId._id === emp._id);
            const empData = {
                empCustomId: emp.employeeId,
                name: emp.userId.name,
                dept: deptName,
                checkIn: record?.checkIn || '--:-- --',
                checkOut: record?.checkOut || '--:-- --',
                status: record?.status || 'Absent'
            };
            if (!groups[deptName]) groups[deptName] = [];
            groups[deptName].push(empData);
        });
        setGroupedRecords(groups);
    };

    // Corrected to include Stats in PDF
    const generateDashboardPDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Calculate Totals for the PDF
        let total = 0, p = 0, a = 0, l = 0;
        Object.values(groupedRecords).flat().forEach(e => {
            total++;
            if(e.status === 'Present') p++;
            else if(e.status === 'On Leave') l++;
            else a++;
        });

        doc.setFontSize(18);
        doc.setTextColor(40);
        doc.text("Official Attendance Report", 14, 15);
        doc.setFontSize(10);
        doc.text(`Date: ${filters.date} | Total: ${total} | Present: ${p} | Absent: ${a} | Leave: ${l}`, 14, 22);

        const tableRows = [];
        Object.entries(groupedRecords).forEach(([dept, emps]) => {
            tableRows.push([{ content: dept, colSpan: 6, styles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' } }]);
            emps.forEach(emp => {
                tableRows.push([emp.empCustomId, emp.name, emp.dept, emp.checkIn, emp.checkOut, emp.status]);
            });
        });

        autoTable(doc, {
            head: [['ID', 'Name', 'Department', 'In', 'Out', 'Status']],
            body: tableRows,
            startY: 30,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59] }
        });
        doc.save(`Attendance_Report_${filters.date}.pdf`);
    };

    const handleAdvancedAnalysis = () => {
        const stats = {
            total: 0, present: 0, absent: 0, leave: 0, halfDay: 0, late: 0,
            deptData: {},
            filteredGroups: {} 
        };
        let found = false;
        Object.entries(groupedRecords).forEach(([dept, emps]) => {
            if (advFilter.type === 'department' && !dept.toLowerCase().includes(advFilter.value.toLowerCase())) return;
            const filteredEmps = emps.filter(emp => {
                if (advFilter.type === 'employee') {
                    return emp.name.toLowerCase().includes(advFilter.value.toLowerCase()) || 
                           emp.empCustomId.toLowerCase().includes(advFilter.value.toLowerCase());
                }
                return true;
            });
            if (filteredEmps.length > 0) {
                found = true;
                stats.deptData[dept] = { p: 0, a: 0, l: 0, h: 0, lc: 0, total: 0 };
                stats.filteredGroups[dept] = filteredEmps;
                filteredEmps.forEach(emp => {
                    stats.total++;
                    stats.deptData[dept].total++;
                    if (emp.status === 'Present') { stats.present++; stats.deptData[dept].p++; }
                    else if (emp.status === 'On Leave') { stats.leave++; stats.deptData[dept].l++; }
                    else if (emp.status === 'Half Day') { stats.halfDay++; stats.deptData[dept].h++; }
                    else if (emp.status === 'Late') { stats.late++; stats.deptData[dept].lc++; }
                    else { stats.absent++; stats.deptData[dept].a++; }
                });
            }
        });
        setReportData(found ? stats : "NOT_FOUND");
    };

    const pieData = (reportData && reportData !== "NOT_FOUND") ? {
        labels: ['Present', 'Absent', 'Leave', 'Half Day', 'Late'],
        datasets: [{
            data: [reportData.present, reportData.absent, reportData.leave, reportData.halfDay, reportData.late],
            backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#f97316'],
        }]
    } : null;

    const barData = (reportData && reportData !== "NOT_FOUND") ? {
        labels: Object.keys(reportData.deptData),
        datasets: [
            { label: 'Present', data: Object.values(reportData.deptData).map(d => d.p), backgroundColor: '#10b981' },
            { label: 'Absent', data: Object.values(reportData.deptData).map(d => d.a), backgroundColor: '#ef4444' }
        ]
    } : null;

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            <style>
                {`
                @media print {
                    /* Hide everything except the report */
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    
                    /* Reset positioning to prevent gaps at top */
                    .print-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                        display: block !important;
                        background: white !important;
                    }

                    /* Fix the scrolling modal issue */
                    .fixed { position: static !important; overflow: visible !important; display: block !important; }
                    .overflow-y-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
                    
                    .no-print { display: none !important; }
                    
                    /* Table and Chart Spacing */
                    .print-area .h-64 { height: 300px !important; margin-bottom: 20px; }
                    table { page-break-inside: auto; border-collapse: collapse; width: 100% !important; }
                    tr { page-break-inside: avoid; page-break-after: auto; }
                    
                    /* Ensure headers appear on every page */
                    thead { display: table-header-group; }
                }
                `}
            </style>

            <div className="max-w-full mx-auto bg-white rounded-lg shadow-sm border p-6 relative cursor-pointer">
                <button onClick={() => setShowAdvancedReport(true)} className="absolute top-6 right-6 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 no-print cursor-pointer">
                    <FaChartLine /> Advanced Insights
                </button>

                <h2 className="text-xl font-bold text-gray-700 mb-6 flex items-center gap-2">
                    <FaHistory className="text-teal-600" /> Daily Attendance Record
                </h2>

                <div className="flex flex-wrap items-end gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-200 no-print">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">Select Date</label>
                        <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" value={filters.date} onChange={(e) => setFilters({date: e.target.value})}/>
                    </div>
                    <button onClick={handleFetch} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"><FaSearch /> Fetch Records</button>
                    {Object.keys(groupedRecords).length > 0 && (
                        <button onClick={generateDashboardPDF} className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"><FaPrint /> Download PDF Report</button>
                    )}
                </div>

                <div id="report-content">
                    {Object.entries(groupedRecords).map(([deptName, emps]) => (
                        <div key={deptName} className="mb-8">
                            <h3 className="flex items-center gap-2 text-md font-bold text-teal-700 mb-3 bg-teal-50/50 p-2 px-4 rounded-lg border-l-4 border-teal-500">
                                <FaBuilding className="text-xs" /> {deptName}
                            </h3>
                            <div className="overflow-x-auto border border-gray-100 rounded-lg">
                                <table className="w-full text-[12px] bg-white">
                                    <thead>
                                        <tr className="bg-slate-800 text-white uppercase">
                                            <th className="p-3 text-left">Emp ID</th>
                                            <th className="p-3 text-left">Name</th>
                                            <th className="p-3 text-center">In</th>
                                            <th className="p-3 text-center">Out</th>
                                            <th className="p-3 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emps.map((emp, idx) => (
                                            <tr key={idx} className="border-b hover:bg-gray-50">
                                                <td className="p-3 font-medium">{emp.empCustomId}</td>
                                                <td className="p-3 font-bold">{emp.name}</td>
                                                <td className="p-3 text-center text-gray-500">{emp.checkIn}</td>
                                                <td className="p-3 text-center text-gray-500">{emp.checkOut}</td>
                                                <td className="p-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${emp.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{emp.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showAdvancedReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50 sticky top-0 z-10 no-print">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FaFilter className="text-teal-600" /> Analytical Insights
                            </h3>
                            <button onClick={() => setShowAdvancedReport(false)} className="text-slate-400 hover:text-rose-500 cursor-pointer transition-colors">
                                <FaTimes size={24} />
                            </button>
                        </div>

                        <div className="p-8">
                            <div className="no-print bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Filter By</label>
                                        <select 
                                            className="w-full border border-teal-500 rounded-lg p-2 text-sm outline-none bg-white"
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
                                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">Search {advFilter.type}</label>
                                            <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder={`Enter ${advFilter.type}...`} value={advFilter.value} onChange={(e) => setAdvFilter({...advFilter, value: e.target.value})}/>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">From Date</label>
                                        <input type="date" className="w-full border rounded-lg p-2 text-sm" value={advFilter.fromDate} onChange={(e) => setAdvFilter({...advFilter, fromDate: e.target.value})}/>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">To Date</label>
                                        <input type="date" className="w-full border rounded-lg p-2 text-sm" value={advFilter.toDate} onChange={(e) => setAdvFilter({...advFilter, toDate: e.target.value})}/>
                                    </div>
                                </div>
                                <button onClick={handleAdvancedAnalysis} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg flex justify-center items-center gap-2 cursor-pointer ">
                                    <FaSearch /> Process Analysis
                                </button>
                            </div>

                            {reportData && reportData !== "NOT_FOUND" && (
                                <div className="print-area space-y-10">
                                    <div className="hidden print:block mb-6 border-b-4 border-slate-800 pb-4">
                                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">ATTENDANCE ANALYTICAL REPORT</h1>
                                        <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Period: {advFilter.fromDate} — {advFilter.toDate}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 print:flex print:flex-wrap">
                                        <div className="bg-gray-50 p-4 rounded-xl border flex flex-col items-center print:w-[48%] print:bg-white">
                                            <h5 className="text-xs font-bold mb-4 uppercase text-gray-400">Status Distribution</h5>
                                            <div className="w-full h-64"><Pie data={pieData} options={chartOptions} /></div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border flex flex-col items-center print:w-[48%] print:bg-white">
                                            <h5 className="text-xs font-bold mb-4 uppercase text-gray-400">Department Performance</h5>
                                            <div className="w-full h-64"><Bar data={barData} options={chartOptions} /></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 print:grid-cols-3">
                                        {[
                                            { label: 'Total staff', val: reportData.total, border: 'border-slate-500' },
                                            { label: 'Present', val: reportData.present, border: 'border-green-500' },
                                            { label: 'Absent', val: reportData.absent, border: 'border-red-500' },
                                            { label: 'Leaves', val: reportData.leave, border: 'border-amber-500' },
                                            { label: 'Half Day', val: reportData.halfDay, border: 'border-purple-500' },
                                            { label: 'Late', val: reportData.late, border: 'border-orange-500' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`bg-white p-4 rounded-xl text-center border-b-4 ${stat.border} shadow-sm print:border-2 print:m-1`}>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{stat.label}</p>
                                                <p className="text-xl font-black">{stat.val}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border print:border-none print:p-0">
                                        <h4 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest border-b pb-2">Detailed Breakdown</h4>
                                        {Object.entries(reportData.filteredGroups).map(([dept, emps]) => (
                                            <div key={dept} className="mb-8 print:avoid-break">
                                                <p className="text-sm font-bold text-teal-600 mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-teal-500 rounded-full"></span> {dept}
                                                </p>
                                                <table className="w-full text-xs border border-gray-100">
                                                    <thead className="bg-slate-50">
                                                        <tr>
                                                            <th className="p-3 border text-left text-gray-500 uppercase">ID</th>
                                                            <th className="p-3 border text-left text-gray-500 uppercase">Full Name</th>
                                                            <th className="p-3 border text-center text-gray-500 uppercase">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {emps.map((e, idx) => (
                                                            <tr key={idx} className="border-b border-gray-50">
                                                                <td className="p-3 border-x">{e.empCustomId}</td>
                                                                <td className="p-3 border-x font-bold">{e.name}</td>
                                                                <td className="p-3 border-x text-center font-medium">{e.status}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={() => window.print()} className="w-full border-2 border-teal-600 text-teal-600 py-3 rounded-xl font-bold hover:bg-teal-50 flex justify-center items-center gap-2 no-print transition-all cursor-pointer">
                                        <FaPrint /> Print Report
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceHistory;