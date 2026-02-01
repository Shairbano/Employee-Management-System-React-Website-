import React, { useState } from 'react';
import axios from 'axios';

const Setting = () => {
    const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [msg, setMsg] = useState("");

    const handleChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });
const handleSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
        return alert("New passwords do not match");
    }

    try {
        const token = localStorage.getItem('token');
        const res = await axios.put('http://localhost:3000/api/settings/change-password', 
        {
            oldPassword: passwords.oldPassword,
            newPassword: passwords.newPassword
        }, 
        {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
            setMsg("Password changed successfully!");
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        }
    } catch (err) {
        // Safe way to access error messages
        const errorMessage = err.response?.data?.error || "Server is not responding. Check your backend terminal.";
        alert(errorMessage); 
    }
};
return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
        <h2 className="text-xl font-bold mb-4">Change Password</h2>
        {msg && <p className="text-green-500 mb-2">{msg}</p>}
        {/* FIX 1: Add onSubmit to the form */}
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* FIX 2: Add onChange to every input */}
            <input 
                type="password" 
                name="oldPassword" 
                placeholder="Old Password" 
                value={passwords.oldPassword} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded" 
            />
            <input 
                type="password" 
                name="newPassword" 
                placeholder="New Password" 
                value={passwords.newPassword} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded" 
            />
            <input 
                type="password" 
                name="confirmPassword" 
                placeholder="Confirm New Password" 
                value={passwords.confirmPassword} 
                onChange={handleChange} 
                required 
                className="w-full border p-2 rounded" 
            />
            <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded font-bold hover:bg-teal-700">
                Update Password
            </button>
        </form>
    </div>
);
};

export default Setting;