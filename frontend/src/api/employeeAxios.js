import axios from 'axios';

// Separate Axios instance from the admin/HR side (api/axios.js).
// Uses its own token key so an employee session and a staff session
// can coexist without clobbering each other in localStorage.
const employeeApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

employeeApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('ems_employee_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

employeeApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('ems_employee_token');
      localStorage.removeItem('ems_employee_user');
      if (window.location.pathname !== '/employee-login') {
        window.location.href = '/employee-login';
      }
    }
    return Promise.reject(err);
  }
);

export default employeeApi;
