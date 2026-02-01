import React from 'react'
import { useAuth } from '../../context/authContext'
import { useNavigate } from 'react-router-dom' // Import useNavigate

const Navbar = () => {
  const { user, logout } = useAuth() // Extract logout from your context
  const navigate = useNavigate()

  const handleLogout = () => {
    logout() // This clears the user state and localStorage
    navigate('/login') // This redirects the user
  }

  return (
    <div className="h-12 flex justify-between items-center bg-teal-600 text-white px-6">
      <p className="font-medium">Welcome {user?.name}</p>

      <div className="flex gap-2">
        <button 
          onClick={handleLogout} // Attach the logic here
          className="px-4 py-2 bg-teal-500 rounded cursor-pointer hover:bg-teal-700 transition-colors"
        >
          Log out
        </button>
      </div>
    </div>
  )
}

export default Navbar