import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ViewEmployee = () => {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:3000/api/employee/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) setEmployee(res.data.employee);
            } catch (err) { alert("Error fetching details");
                console.log(err);
             }
        };
        fetchEmployee();
    }, [id]);

    if (!employee) return <div className="p-6">Loading...</div>;

   return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-md border">
            <div className="flex flex-col items-center mb-8">
                {/* Image Display */}
                <img 
                    src={employee.image || "https://via.placeholder.com/150"} 
                    alt="Profile" 
                    className="w-40 h-40 rounded-full border-4 border-teal-500 object-cover shadow-lg mb-4"
                />
                <h2 className="text-3xl font-bold text-gray-800">{employee.userId.name}</h2>
                <p className="text-teal-600 font-medium">{employee.designation}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-8">
                <div><p className="text-gray-500 text-sm">Employee ID</p><p className="font-bold">{employee.employeeId}</p></div>
                <div><p className="text-gray-500 text-sm">Department</p><p className="font-bold">{employee.department.dep_name}</p></div>
                <div><p className="text-gray-500 text-sm">Section</p><p className="font-bold">{employee.section ? employee.section.section_name : "N/A"}</p></div>
                <div><p className="text-gray-500 text-sm">Salary</p><p className="font-bold">${employee.salary}</p></div>
                <div><p className="text-gray-500 text-sm">Marital Status</p><p className="font-bold capitalize">{employee.maritalStatus}</p></div>
            </div>
        </div>
    );
};

export default ViewEmployee;