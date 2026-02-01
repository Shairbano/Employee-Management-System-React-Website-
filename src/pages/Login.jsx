import React from "react";    //import library for react 
import axios from "axios";  //import library for axios to make http requests
import { useAuth } from "../context/authContext"; //import useAuth from authContext to manage authentication state
import { useNavigate } from "react-router-dom"; //import useNavigate to programmatically navigate between routes
import {useState} from "react"; //import useState to manage component state
import {Link} from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false); 
  const navigate = useNavigate();
  const { login } = useAuth();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:3000/api/auth/login", { email, password });
      
      if (response.data.success) 
        {
       login(response.data.user);           
       localStorage.setItem("token", response.data.token); // store token
        if(response.data.user.role === "admin")
          {
              navigate('/admin-dashboard');
          }    
          else
          {
              navigate('/employee-dashboard');
          }

      } 
      else
         {
        setMessage(response.data.message);
        setIsSuccess(false);               // red
      }

    } 
    catch (err) {
      // Network or server error
      setMessage(err.response?.data?.message || "Server error");
      setIsSuccess(false);                 
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* TOP COLOR SECTION */}
      <div className="h-72 flex items-center justify-center bg-teal-600">
        <h2 className="font-dancing text-4xl text-white">
          Employee Management System
        </h2>
      </div>

      {/* LOGIN FORM (OVERLAPPING) */}
      <div className="flex justify-center -mt-24">
        <div className="w-80 bg-white border shadow-xl rounded p-6 z-20">
          <h2 className="text-2xl font-Monospace font-bold mb-4 text-center">
            Login
          </h2>

          {/* Show message */}
          {message && (
            <p className={`text-sm mb-4 ${isSuccess ? "text-green-500" : "text-red-500"}`}>
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label>Email</label>
              <input
                type="email"
                className="w-full border px-3 py-2"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label>Password</label>
              <input
                type="password"
                className="w-full border px-3 py-2"
                placeholder="****"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="mb-4 flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-teal-600 hover:underline">
    Forgot Password?
    </Link>
            </div>

           <button className="
  w-full 
  bg-teal-600 
  text-white 
  py-2 
  rounded 
  cursor-pointer
  transition-all 
  duration-200 
  hover:scale-105
">
  Login
</button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
