import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'

import PrivateRoutes from './utils/PrivateRoutes'
import RoleBasedRoutes from './utils/roleBasedRoutes'
import AdminSummary from './components/Dashboards/AdminSummary'
import EmployeeSummary from './components/Dashboards/EmployeeSummary'
import DepartmentList from './components/departments/DepartmentList'
import AddDepartment from './components/departments/AddDepartment'
import EditDepartment from './components/departments/EditDepartment'
import EmployeeList from './components/employee/EmployeeList'
import AddEmployee from './components/employee/AddEmployee'
import EditEmployee from './components/employee/EditEmployee'
import ViewEmployee from './components/employee/ViewEmployee'

import SectionList from './components/sections/SectionList'
import AddSection from './components/sections/AddSection'
import EditSection from './components/sections/EditSection'
import LeavesApproval from './components/leaves/LeavesApproval'
import Setting from './components/setting/Settings' 
import ForgotPassword from './components/ForgotPassword'

import EmployeeDashboard from './pages/EmployeeDashboard'
import ApplyLeave from './components/leaves/ApplyLeave'
import LeaveHistory from './components/leaves/LeaveHistory'
import ChangeProfile from './components/setting/ChangeProfile'
import EmployeeSetting from './components/setting/EmployeeSetting'

// ATTENDANCE IMPORTS
import Attendance from './components/attendence/Attendance'
import AttendanceHistory from './components/attendence/AttendanceHistory' 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Admin Dashboard Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <PrivateRoutes>
              <RoleBasedRoutes requiredRole={['admin']}>
                <AdminDashboard />
              </RoleBasedRoutes>
            </PrivateRoutes>
          }
        >
          <Route index element={<AdminSummary />} />
          
          {/* Attendance Routes */}
          <Route path="attendance" element={<Attendance />} />
          <Route path="attendance-history" element={<AttendanceHistory />} />
          
          {/* Departments */}
          <Route path="departments" element={<DepartmentList />} />
          <Route path="add-department" element={<AddDepartment />} />
          <Route path="department/:id" element={<EditDepartment />} />

          {/* Sections */}
          <Route path="sections" element={<SectionList />} />
          <Route path="add-section" element={<AddSection />} />
          <Route path="sections/edit/:id" element={<EditSection />} />
          <Route path="departments/:depId/sections" element={<SectionList />} />

          {/* Employees */}
          <Route path="employees" element={<EmployeeList />} />
          <Route path="add-employee" element={<AddEmployee />} />
          <Route path="employees/edit/:id" element={<EditEmployee />} />
          <Route path="employees/:id" element={<ViewEmployee />} />
          
          {/* Leaves */}
          <Route path="leaves" element={<LeavesApproval />} />
          
          {/* Settings */}
          <Route path="setting" element={<Setting />} />
        </Route>

        {/* Employee Dashboard Routes */}
        <Route
          path="/employee-dashboard"
          element={
            <PrivateRoutes>
              <RoleBasedRoutes requiredRole={['employee']}>
                <EmployeeDashboard />
              </RoleBasedRoutes>
            </PrivateRoutes>
          }
        >
          <Route index element={<EmployeeSummary />} />
          <Route path='apply-leave' element={<ApplyLeave />} />
          <Route path='leave-history' element={<LeaveHistory />} />
          <Route path='change-profile/:id' element={<ChangeProfile />} />
          <Route path='change-password' element={<EmployeeSetting />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;