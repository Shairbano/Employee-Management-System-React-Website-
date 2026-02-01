import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Email Check, 2: New Password
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Handle Step 1: Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/api/auth/check-email", { email });
      if (res.data.success) {
        setStep(2);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Email not found");
    }
  };

  // Handle Step 2: Update Password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      const res = await axios.post("http://localhost:3000/api/auth/reset-password-direct", { 
        email, 
        password 
      });
      if (res.data.success) {
        alert("Password updated successfully!");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-96 bg-white p-8 rounded shadow-xl border-t-4 border-teal-600">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          {step === 1 ? "Verify Identity" : "Reset Password"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

        {step === 1 ? (
          <form onSubmit={handleVerifyEmail}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Registered Email</label>
              <input
                type="email"
                className="w-full border px-3 py-2 rounded focus:outline-teal-500"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition-colors">
              Verify Email
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdatePassword}>
            <p className="text-sm text-gray-500 mb-4 text-center">Resetting for: <b>{email}</b></p>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
              <input
                type="password"
                className="w-full border px-3 py-2 rounded focus:outline-teal-500"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">Confirm Password</label>
              <input
                type="password"
                className="w-full border px-3 py-2 rounded focus:outline-teal-500"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition-colors">
              Update Password
            </button>
          </form>
        )}
        
        <button 
          onClick={() => navigate('/login')}
          className="w-full mt-4 text-sm text-teal-600 hover:underline"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;