import { Navigate } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';

const EmployeeProtectedRoute = ({ children }) => {
  const { employee } = useEmployeeAuth();
  if (!employee) return <Navigate to="/employee-login" replace />;
  return children;
};

export default EmployeeProtectedRoute;
