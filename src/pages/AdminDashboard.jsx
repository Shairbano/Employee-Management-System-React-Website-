import React from 'react'
import AdminSidebar from '../components/Dashboards/AdminSidebar'
import Navbar from '../components/Dashboards/Navbar'
import { Outlet } from 'react-router-dom'

const AdminDashboard = () => {
  return (
    <div className="flex">
      <AdminSidebar />
      {/* Ensure ml-64 matches your Sidebar width so content isn't hidden */}
      <div className="flex-1 ml-64 bg-gray-100 min-h-screen">
        <Navbar />
        <Outlet /> {/* This renders AdminSummary (the index route) */}
      </div>
    </div>
  )
}

export default AdminDashboard