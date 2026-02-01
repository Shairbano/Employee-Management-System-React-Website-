import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AddSection = () => {
    const [departments, setDepartments] = useState([]);
    const [allSections, setAllSections] = useState([]); 
    const [section, setSection] = useState({ section_name: '', description: '', department: '' });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = { headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` } };
                const depRes = await axios.get('http://localhost:3000/api/department', config);
                const secRes = await axios.get('http://localhost:3000/api/section', config);
                
                if (depRes.data.success) setDepartments(depRes.data.departments);
                if (secRes.data.success) setAllSections(secRes.data.sections);
            } catch (err) {
                console.error("Error fetching data", err);
            }
        };
        fetchData();
    }, []);

    // Handling input changes resolves the 'setSection' unused error
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSection({ ...section, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); 

        if (!section.section_name.trim()) return setError("Section Name is required!");
        if (!section.department) return setError("Please select a department!");
        if (!section.description.trim()) return setError("Please provide a description!");

        const isDuplicate = allSections.some(
            sec => sec.section_name.toLowerCase() === section.section_name.toLowerCase() &&
            sec.department._id === section.department
        );

        if (isDuplicate) {
            return setError("This section already exists in the selected department!");
        }

        try {
            const response = await axios.post('http://localhost:3000/api/section/add', section, {
                headers: { "Authorization": `Bearer ${localStorage.getItem('token')}` }
            });
            if (response.data.success) navigate('/admin-dashboard/sections');
        } catch (error) {
            setError(error.response?.data?.error || "Server Error");
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-md shadow-md w-96">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Add New Section</h2>
            
            {error && <div className="bg-red-500 text-white text-sm p-2 rounded mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit}>
                {/* Section Name Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Section Name</label>
                    <input 
                        type="text" 
                        name="section_name" 
                        value={section.section_name}
                        onChange={handleChange} 
                        placeholder="e.g. Frontend Development" 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 outline-none" 
                    />
                </div>

                {/* Department Dropdown - Resolves 'departments' unused error */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select 
                        name="department" 
                        value={section.department}
                        onChange={handleChange} 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 outline-none"
                    >
                        <option value="">Select Department</option>
                        {departments.map(dep => (
                            <option key={dep._id} value={dep._id}>{dep.dep_name}</option>
                        ))}
                    </select>
                </div>

                {/* Description Textarea */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea 
                        name="description" 
                        value={section.description}
                        onChange={handleChange} 
                        placeholder="Section Description" 
                        className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-teal-500 outline-none" 
                        rows="3"
                    ></textarea>
                </div>

                <button 
                    type="submit" 
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    Add Section
                </button>
            </form>
        </div>
    );
};

export default AddSection;