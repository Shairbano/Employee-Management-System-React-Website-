import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const ChangeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [newImage, setNewImage] = useState(null);
    const [employee, setEmployee] = useState({
        name: '', email: '', dob: '', gender: '', 
        maritalStatus: '', designation: '', department: '', 
        section: '', salary: '', image: ''
    });

   useEffect(() => {
    const fetchProfile = async () => {
        if (!id || id === "undefined") {
            setLoading(false); 
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`http://localhost:3000/api/employee/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                const emp = res.data.employee;
                // LOG THIS to see the exact structure in your console
                console.log("Fetched Employee Data:", emp);

                setEmployee({
                    // Use optional chaining (?.) to prevent crashes if data is missing
                    name: emp.userId?.name || '', 
                    email: emp.userId?.email || '',
                    dob: emp.dob ? emp.dob.split('T')[0] : '',
                    gender: emp.gender || '',
                    maritalStatus: emp.maritalStatus || 'Single',
                    designation: emp.designation || '',
                    // Check if department/section are objects or strings
                    department: emp.department?.dep_name || emp.department || '',
                    section: emp.section?.section_name || emp.section || '',
                    salary: emp.salary || '',
                    image: emp.image || ''
                });
            }
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
}, [id]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', employee.name);
        formData.append('dob', employee.dob);
        formData.append('gender', employee.gender);
        formData.append('maritalStatus', employee.maritalStatus);
        if (newImage) formData.append('image', newImage);

        try {
            const token = localStorage.getItem('token');
            // POINT TO THE CORRECT UPDATE-PROFILE ROUTE
            const res = await axios.put(`http://localhost:3000/api/employee/update-profile/${id}`, formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data" 
                }
            });
            if (res.data.success) {
                alert("Profile Updated Successfully!");
                navigate('/employee-dashboard');
            }
        } catch (err) {
            alert("Error updating profile");
            console.log(err)
        }
    };

    if (loading) return <div className="text-center mt-10 text-teal-600 font-bold">Loading Profile...</div>;

    return (
        <div>
        <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg border">
            <h2 className="text-2xl font-bold mb-6 text-teal-800 border-b pb-2">Edit My Profile</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700">Full Name</label>
                    <input type="text" value={employee.name} onChange={(e) => setEmployee({...employee, name: e.target.value})} className="w-full border p-2 rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400">Email </label>
                    <input type="text" value={employee.email} readOnly className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400">Department </label>
                    <input type="text" value={employee.department} readOnly className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400">Section </label>
                    <input type="text" value={employee.section} readOnly className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-400">Designation </label>
                    <input type="text" value={employee.designation} readOnly className="w-full border p-2 rounded bg-gray-50 cursor-not-allowed" />
                </div>
                <div>
                <label className="block text-sm font-bold text-gray-700">Gender</label>
                <select 
                  value={employee.gender} 
                     onChange={(e) => setEmployee({...employee, gender: e.target.value})} 
                    className="w-full border p-2 rounded"
                 >
                             <option value="">Select Gender</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                         <option value="Other">Other</option>
                             </select>
                    </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Date of Birth</label>
                    <input type="date" value={employee.dob} onChange={(e) => setEmployee({...employee, dob: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700">Marital Status</label>
                    <select value={employee.maritalStatus} onChange={(e) => setEmployee({...employee, maritalStatus: e.target.value})} className="w-full border p-2 rounded">
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                    </select>
                </div>
                
                <div className="md:col-span-2 flex items-center space-x-4 mt-4 border-t pt-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700">Update Photo</label>
                        <input type="file" onChange={(e) => setNewImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" />
                    </div>
                    {(newImage || employee.image) && (
                        <img src={newImage ? URL.createObjectURL(newImage) : employee.image} alt="Profile" className="w-24 h-24 rounded-full border-2 border-teal-500 object-cover" />
                    )}
                </div>

                <button type="submit" className="md:col-span-2 bg-teal-600 text-white py-2 rounded hover:bg-teal-700 font-bold uppercase transition-colors mt-4">
                    Save Changes
                </button>
            </form>
        </div>
        <button 
                onClick={() => navigate('/employee-dashboard')}
                className="mt-8 text-gray-500 hover:text-black font-semibold flex items-center gap-2"
            >
                ← Back to Dashboard
            </button>
        </div>
    );
};

export default ChangeProfile;