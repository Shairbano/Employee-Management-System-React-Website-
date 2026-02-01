import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditEmployee = () => {
    const [employee, setEmployee] = useState({
        name: '', 
        maritalStatus: '', 
        designation: '', 
        salary: '', 
        section:'',
        department: '',
        image: ''
    });
    const [newImage, setNewImage] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [sections, setSections] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch Departments
                const depRes = await axios.get('http://localhost:3000/api/department', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setDepartments(depRes.data.departments);

                // Fetch Employee Data
                const empRes = await axios.get(`http://localhost:3000/api/employee/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (empRes.data.success) {
                    const emp = empRes.data.employee;
                    setEmployee({
                        name: emp.userId.name,
                        maritalStatus: emp.maritalStatus,
                        designation: emp.designation,
                        salary: emp.salary,
                        department: emp.department._id,
                        section: emp.section?._id || '',
                        image: emp.image 
                    });
                }
            } catch (err) {
                console.log(err);
                alert("Error fetching employee data");
            }
        };
        fetchData();
    }, [id]);
    useEffect(() => {
        const fetchSections = async () => {
            if (employee.department) {
                try {
                    const token = localStorage.getItem('token');
                    const res = await axios.get(`http://localhost:3000/api/section/department/${employee.department}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setSections(res.data.sections);
                } catch { setSections([]); }
            }
        };
        fetchSections();
    }, [employee.department]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEmployee({ ...employee, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        data.append('name', employee.name);
        data.append('designation', employee.designation);
        data.append('maritalStatus', employee.maritalStatus);
        data.append('salary', employee.salary);
        data.append('department', employee.department);
        data.append('section', employee.section);
        
        if (newImage) data.append('image', newImage);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`http://localhost:3000/api/employee/${id}`, data, {
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "multipart/form-data" 
                }
            });
            if (res.data.success) {
                navigate('/admin-dashboard/employees');
            }
        } catch (err) {
            alert("Updated Successfully");
            console.log(err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow-md border rounded">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Employee</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input type="text" name="name" value={employee.name} onChange={handleChange} className="mt-1 w-full border p-2 rounded" required />
                </div>

                {/* Designation */}
                <div>
                    <label className="block text-sm font-medium">Designation</label>
                    <input type="text" name="designation" value={employee.designation} onChange={handleChange} className="mt-1 w-full border p-2 rounded" required />
                </div>

                {/* Marital Status */}
                <div>
                    <label className="block text-sm font-medium">Marital Status</label>
                    <select name="maritalStatus" value={employee.maritalStatus} onChange={handleChange} className="mt-1 w-full border p-2 rounded">
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                    </select>
                </div>

                {/* Department */}
                <div>
                    <label className="block text-sm font-medium">Department</label>
                    <select name="department" value={employee.department} onChange={handleChange} className="mt-1 w-full border p-2 rounded">
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.dep_name}</option>
                        ))}
                    </select>
                </div>
                {/* Section */}
                <div>
                    <label className="block text-sm font-medium">Section</label>
                    <select name="section" value={employee.section} onChange={handleChange} className="mt-1 w-full border p-2 rounded">
                        <option value="">Select Section</option>
                        {sections.map(sec => (
                            <option key={sec._id} value={sec._id}>{sec.section_name}</option>
                        ))}
                    </select>
                </div>
                

                {/* Salary */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Salary</label>
                    <input type="number" name="salary" value={employee.salary} onChange={handleChange} className="mt-1 w-full border p-2 rounded" required />
                </div>

                {/* Profile Image Preview & Upload */}
                <div className="md:col-span-2 flex items-center gap-4 border-t pt-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer hover:text-teal-600 transition-colors">Update Profile Photo</label>
                        <input type="file" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} className="mt-1 w-full border p-2 rounded cursor-pointer file:cursor-pointer file:border-0 file:bg-teal-50 file:text-teal-700 file:font-semibold" />
                    </div>
                    {(newImage || employee.image) && (
                        <img 
                            src={newImage ? URL.createObjectURL(newImage) : employee.image} 
                            alt="Preview" 
                            className="w-20 h-20 rounded-full object-cover border-2 border-teal-500" 
                        />
                    )}
                </div>

                <button type="submit" className="md:col-span-2 bg-teal-600 text-white py-2 font-bold rounded mt-4 hover:bg-teal-700 transition-colors">
                    Update Employee
                </button>
            </form>
        </div>
    );
};

export default EditEmployee;