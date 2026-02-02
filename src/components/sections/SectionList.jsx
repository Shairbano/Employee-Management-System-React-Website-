import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SectionList = () => {
    const [sections, setSections] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const navigate = useNavigate();

    // Use useCallback to memoize the function and prevent unnecessary re-renders
    const fetchSections = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:3000/api/section', {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.data.success) {
                setSections(response.data.sections);
            }
        } catch (error) { 
            console.error("Fetch Error:", error); 
        }
    }, []);

    // Fixed the useEffect to call the function safely
    useEffect(() => {
        const fetchData = async () => {
            await fetchSections();
        };
        fetchData();
    }, [fetchSections]);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this section?")) {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.delete(`http://localhost:3000/api/section/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.data.success) {
                    fetchSections(); 
                }
            } catch (error) {
                alert(error.response?.data?.error || "Error deleting section");
            }
        }
    };

    const filteredSections = sections.filter(sec => 
        sec.section_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedSections = filteredSections.reduce((acc, sec) => {
        const deptName = sec.department?.dep_name || "Unassigned";
        if (!acc[deptName]) acc[deptName] = [];
        acc[deptName].push(sec);
        return acc;
    }, {});

    return (
        <div className="p-6">
            <h3 className="text-3xl font-bold text-center mb-6">Manage Sections</h3>
            
            <div className="flex justify-between items-center mb-6">
                <input 
                    type="text" 
                    placeholder="Search Section..." 
                    className="px-4 py-2 border rounded outline-teal-500 w-64 shadow-sm"
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Link to="/admin-dashboard/add-section" className="px-5 py-2 bg-teal-600 text-white rounded-md font-semibold hover:bg-teal-700 transition-all">
                    Add New Section
                </Link>
            </div>

            {Object.keys(groupedSections).length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400">
                    No sections found matching your search.
                </div>
            ) : (
                Object.keys(groupedSections).map((dept) => (
                    <div key={dept} className="mb-10 shadow-sm border rounded-lg overflow-hidden">
                        <div className="bg-teal-700 text-white px-6 py-3 font-bold text-lg flex justify-between items-center">
                            <span>{dept}</span>
                            <span className="text-xs bg-white text-teal-800 px-3 py-1 rounded-full uppercase tracking-wider">
                                {groupedSections[dept].length} Total
                            </span>
                        </div>

                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-gray-700 uppercase text-xs border-b">
                                <tr>
                                    <th className="px-6 py-3">No</th>
                                    <th className="px-6 py-3 w-1/3">Section Name</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedSections[dept].map((sec, index) => (
                                    <tr key={sec._id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">{sec.section_name}</td>
                                        <td className="px-6 py-4 text-gray-600 italic">{sec.description || "—"}</td>
                                        <td className="px-6 py-4 flex justify-center gap-6">
                                            <button 
                                                onClick={() => navigate(`/admin-dashboard/sections/edit/${sec._id}`)} 
                                                className="bg-blue-500 text-white px-3 py-1 rounded-md cursor-pointer hover:bg-blue-600 "
                                            >
                                                EDIT
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(sec._id)} 
                                                className="bg-red-500 text-white px-3 py-1 rounded-md cursor-pointer hover:bg-red-600"
                                            >
                                                DELETE
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))
            )}
            <button 
                onClick={() => navigate('/admin-dashboard')}
                className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default SectionList;