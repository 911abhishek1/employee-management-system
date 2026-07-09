import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import ProtectedRoute from './components/ProtectedRoute';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeePortal from './pages/EmployeePortal';
import EmployeeProtectedRoute from './components/EmployeeProtectedRoute';

function App() {
  return (
    <Routes>
      {/* Staff (admin / HR / manager) side */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <Employees />
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payroll"
        element={
          <ProtectedRoute>
            <Payroll />
          </ProtectedRoute>
        }
      />

      {/* Employee self-service portal — separate login & session */}
      <Route path="/employee-login" element={<EmployeeLogin />} />
      <Route
        path="/employee-portal"
        element={
          <EmployeeProtectedRoute>
            <EmployeePortal />
          </EmployeeProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
