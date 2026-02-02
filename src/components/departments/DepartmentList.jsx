import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DepartmentList = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterDepartments, setFilterDepartments] = useState([]);
    const [error, setError] = useState(null); // UI Error State
    const navigate = useNavigate();

    const fetchDepartments = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/department', {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.data.success) {
                setDepartments(response.data.departments);
                setFilterDepartments(response.data.departments);
            }
        } catch (err) {
            setError("Failed to load departments. Please check your server connection.");
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDepartments(); }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.delete(`http://localhost:3000/api/department/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if(res.data.success) {
                    fetchDepartments();
                }
            } catch (err) { 
                setError("Delete failed. This department might have linked employees.");
                console.log(err)
            }
        }
    };

    

    return (
        <div className="p-6">
            <div className="text-center mb-6">
                <h3 className="text-3xl font-bold text-gray-800">Manage Departments</h3>
            </div>

            {/* UI ERROR MESSAGE */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-center">
                    {error}
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <input type="text" placeholder="Search..." 
                    onChange={(e) => setFilterDepartments(departments.filter(d => d.dep_name.toLowerCase().includes(e.target.value.toLowerCase())))}
                    className="px-4 py-2 border rounded-md focus:ring-2 focus:ring-teal-500 outline-none w-64" />
                <Link to="/admin-dashboard/add-department" className="px-5 py-2 bg-teal-600 text-white rounded-md font-semibold">Add New</Link>
            </div>

            <div className="overflow-x-auto shadow-lg rounded-lg border">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="text-xs text-white uppercase bg-teal-600">
    <tr>
        <th className="px-6 py-4">No</th>
        <th className="px-6 py-4">Dept Name</th>
        <th className="px-6 py-4 text-center">Sections</th> {/* NEW COLUMN */}
        <th className="px-6 py-4 text-center">Employees</th>
        <th className="px-6 py-4">Action</th>
    </tr>
</thead>
                    <tbody>
    {loading ? <tr><td colSpan="5" className="text-center py-10">Loading...</td></tr> :
    filterDepartments.map((dep, index) => (
        <tr key={dep._id} className="bg-white border-b hover:bg-gray-50">
            <td className="px-6 py-4">{index + 1}</td>
            <td className="px-6 py-4 font-semibold">{dep.dep_name}</td>
            
            {/* NEW: Section Count Cell */}
            <td className="px-6 py-4 text-center font-bold text-blue-600">
                {dep.sectionCount || 0}
            </td>

            <td className="px-6 py-4 text-center font-bold text-teal-700">
                {dep.employeeCount || 0}
            </td>
            <td className="px-6 py-4 flex gap-3">
                <button onClick={() => navigate(`/admin-dashboard/department/${dep._id}`)} 
                    className="bg-blue-500 text-white px-3 py-1 rounded-md cursor-pointer hover:bg-blue-600">Edit</button>
                <button onClick={() => handleDelete(dep._id)} 
                    className="bg-red-500 text-white px-3 py-1 rounded-md cursor-pointer hover:bg-red-600">Delete</button>
            </td>
        </tr>
    ))}
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
export default DepartmentList;