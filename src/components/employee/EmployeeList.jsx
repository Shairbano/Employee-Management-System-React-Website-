import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // State for search
    const navigate = useNavigate();

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/employee', {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.data.success) {
                setEmployees(response.data.employees);
            }
        } catch (error) {
            alert("Failed to load employees.");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure? This will also remove their login account.")) {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.delete(`http://localhost:3000/api/employee/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.data.success) fetchEmployees();
            } catch (err) {
                alert(err.response?.data?.error || "Delete failed");
            }
        }
    };

    // Filter employees based on search term (Name or Employee ID)
    const filteredEmployees = employees.filter(emp => 
        emp.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) 
        
    );

    return (
        <div className="p-6">
            <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800">Manage Employees</h3>
            </div>
            <div className="flex justify-between items-center mb-6">
                <input 
                    type="text" 
                    placeholder="Search by Name" 
                    className="px-4 py-2 border rounded-md outline-none w-64 focus:ring-2 focus:ring-teal-500"
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <Link to="/admin-dashboard/add-employee" className="px-5 py-2 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700 transition-colors">
                    Add New Employee
                </Link>
            </div>

            <div className="overflow-x-auto shadow-lg rounded-lg border">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-white uppercase bg-teal-600">
                        <tr>
                            <th className="px-6 py-4">S.No</th>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4">Section</th> {/* NEW COLUMN */}
                            <th className="px-6 py-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-10">Loading...</td></tr>
                        ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp, index) => (
                                <tr key={emp._id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Small circular profile preview */}
                                            <img src={emp.image} alt="" className="w-8 h-8 rounded-full object-cover border" />
                                            <span className="font-semibold text-gray-900">{emp.userId?.name || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">
                                        {emp.department ? emp.department.dep_name : "N/A"}
                                    </td>
                                    {/* SEPARATE SECTION COLUMN */}
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                                            {emp.section ? emp.section.section_name : "No Section"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button onClick={() => navigate(`/admin-dashboard/employees/${emp._id}`)} className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">View</button>
                                        <button onClick={() => navigate(`/admin-dashboard/employees/edit/${emp._id}`)} className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600">Edit</button>
                                        <button onClick={() => handleDelete(emp._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center py-10 text-gray-400">No employees found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <button 
                onClick={() => navigate('/admin-dashboard')}
                className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default EmployeeList;