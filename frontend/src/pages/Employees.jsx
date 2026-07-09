import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import EmployeeForm from './EmployeeForm';
import { useAuth } from '../context/AuthContext';
import { canManage } from '../utils/permissions';

const Employees = () => {
  const { user } = useAuth();
  const canEdit = canManage(user);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Portal-access ("set employee login password") modal state
  const [portalEmployee, setPortalEmployee] = useState(null);
  const [portalPassword, setPortalPassword] = useState('');
  const [portalError, setPortalError] = useState('');
  const [portalSaving, setPortalSaving] = useState(false);
  const [portalSuccess, setPortalSuccess] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        api.get('/employees', { params: search ? { search } : {} }),
        api.get('/departments'),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchData, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this employee? This cannot be undone.')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete employee');
    }
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setShowForm(true);
  };

  const openPortalModal = (emp) => {
    setPortalEmployee(emp);
    setPortalPassword('');
    setPortalError('');
    setPortalSuccess('');
  };

  const handleSetPortalPassword = async (e) => {
    e.preventDefault();
    setPortalError('');
    setPortalSaving(true);
    try {
      const { data } = await api.put(`/employees/${portalEmployee._id}/set-password`, {
        password: portalPassword,
      });
      setPortalSuccess(data.message);
      fetchData();
    } catch (err) {
      setPortalError(err.response?.data?.message || 'Failed to set portal password');
    } finally {
      setPortalSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
          <p className="text-gray-500 text-sm">Manage your workforce records</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary">+ Add Employee</button>}
      </div>

      <div className="card mb-4">
        <input
          className="input-field max-w-sm"
          placeholder="Search by name, email, or employee ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading employees...</div>
        ) : (
          <table className="w-full ems-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Department</th>
                <th>Status</th>
                <th>Portal</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td className="font-semibold text-brand-700">{emp.employeeId}</td>
                  <td>{emp.firstName} {emp.lastName}</td>
                  <td>{emp.designation}</td>
                  <td>{emp.department?.name || '-'}</td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      emp.hasPortalAccess ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {emp.hasPortalAccess ? 'Enabled' : 'Not set up'}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="space-x-2 whitespace-nowrap">
                      <button onClick={() => openEdit(emp)} className="text-brand-700 hover:underline text-sm">Edit</button>
                      <button onClick={() => openPortalModal(emp)} className="text-blue-600 hover:underline text-sm">Portal Access</button>
                      <button onClick={() => handleDelete(emp._id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={canEdit ? 7 : 6} className="text-center text-gray-400 py-6">No employees found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <EmployeeForm
          departments={departments}
          employee={editingEmployee}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            fetchData();
          }}
        />
      )}

      {portalEmployee && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">Employee Portal Access</h2>
            <p className="text-sm text-gray-500 mb-4">
              {portalEmployee.firstName} {portalEmployee.lastName} ({portalEmployee.employeeId}) will be able to log
              in at <span className="font-medium">/employee-login</span> using{' '}
              <span className="font-medium">{portalEmployee.email}</span> and the password you set below.
            </p>
            {portalError && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{portalError}</div>}
            {portalSuccess && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded-lg mb-3">{portalSuccess}</div>}
            <form onSubmit={handleSetPortalPassword} className="space-y-3">
              <div>
                <label className="label-field">Set Portal Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="e.g. Welcome@123"
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">Share this password with the employee securely. At least 6 characters.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setPortalEmployee(null)} className="btn-secondary">Close</button>
                <button type="submit" disabled={portalSaving} className="btn-primary">
                  {portalSaving ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Employees;
