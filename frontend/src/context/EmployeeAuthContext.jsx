import { createContext, useContext, useEffect, useState } from 'react';
import employeeApi from '../api/employeeAxios';

const EmployeeAuthContext = createContext(null);

export const EmployeeAuthProvider = ({ children }) => {
  const [employee, setEmployee] = useState(() => {
    const stored = localStorage.getItem('ems_employee_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      localStorage.setItem('ems_employee_user', JSON.stringify(employee));
    } else {
      localStorage.removeItem('ems_employee_user');
    }
  }, [employee]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await employeeApi.post('/employee-auth/login', { email, password });
      localStorage.setItem('ems_employee_token', data.token);
      setEmployee(data);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ems_employee_token');
    localStorage.removeItem('ems_employee_user');
    setEmployee(null);
  };

  return (
    <EmployeeAuthContext.Provider value={{ employee, loading, login, logout }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = () => useContext(EmployeeAuthContext);
