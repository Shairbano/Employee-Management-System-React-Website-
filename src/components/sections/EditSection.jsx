import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditSection = () => {
    const [departments, setDepartments] = useState([]);
    const [employees, setEmployees] = useState([]); // State for employees
    const [section, setSection] = useState({
        section_name: '',
        description: '',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const { id } = useParams(); 
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { "Authorization": `Bearer ${token}` } };

                // 1. Fetch Departments, Section Details, and Section Employees in parallel
                const [depRes, secRes, empRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/department', config),
                    axios.get(`http://localhost:3000/api/section/${id}`, config),
                    axios.get(`http://localhost:3000/api/employee/section/${id}`, config)
                ]);

                if (depRes.data.success) setDepartments(depRes.data.departments);
                
                if (secRes.data.success) {
                    const sec = secRes.data.section;
                    setSection({
                        section_name: sec.section_name,
                        description: sec.description,
                        department: sec.department._id 
                    });
                }

                if (empRes.data.success) setEmployees(empRes.data.employees);

            } catch (error) {
                console.error(error);
                alert("Error fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSection({ ...section, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`http://localhost:3000/api/section/${id}`, section, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.data.success) {
                alert("Section Updated Successfully");
                navigate('/admin-dashboard/sections');
            }
        } catch (error) {
            alert(error.response?.data?.error || "Update failed");
        }
    };

    if (loading) return <div className="text-center mt-10">Loading Section Data...</div>;

    return (
        <div className="max-w-5xl mx-auto mt-10 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT SIDE: EDIT FORM */}
                <div className="lg:col-span-1 bg-white p-8 rounded-md shadow-md h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-teal-700">Edit Section</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Section Name</label>
                            <input 
                                type="text" 
                                name="section_name" 
                                value={section.section_name} 
                                onChange={handleChange} 
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                                required 
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Department</label>
                            <select 
                                name="department" 
                                value={section.department} 
                                onChange={handleChange} 
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                                required
                            >
                                <option value="">Select Department</option>
                                {departments.map(dep => (
                                    <option key={dep._id} value={dep._id}>{dep.dep_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea 
                                name="description" 
                                value={section.description} 
                                onChange={handleChange} 
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md" 
                                rows="3"
                            ></textarea>
                        </div>
                        <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded">
                            Update Section
                        </button>
                    </form>
                </div>

                {/* RIGHT SIDE: EMPLOYEES LIST */}
                <div className="lg:col-span-2 bg-white p-6 rounded-md shadow-md">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Employees in {section.section_name} </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="p-3">Employee Name</th>
                                    <th className="p-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length > 0 ? employees.map(emp => (
                                    <tr key={emp._id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium">{emp.userId?.name}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => navigate(`/admin-dashboard/employees/edit/${emp._id}`)}
                                                className="text-blue-600 hover:underline font-semibold"
                                            >
                                                Edit Profile
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="2" className="text-center p-10 text-gray-400">
                                            No employees assigned to this section.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <button 
                onClick={() => navigate('/admin-dashboard/sections')}
                className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2"
            >
                ← Back to Sections
            </button>
        </div>
    );
};

export default EditSection;