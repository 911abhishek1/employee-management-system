import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { canManage } from '../utils/permissions';

const emptyForm = { name: '', code: '', description: '', manager: '' };

const Departments = () => {
  const { user } = useAuth();
  const canEdit = canManage(user);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept._id);
    setForm({ name: dept.name, code: dept.code, description: dept.description, manager: dept.manager });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department? This cannot be undone.')) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Departments</h1>
          <p className="text-gray-500 text-sm">Manage organizational departments</p>
        </div>
        {canEdit && <button onClick={openAddModal} className="btn-primary">+ Add Department</button>}
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <table className="w-full ems-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Manager</th>
                <th>Employees</th>
                {canEdit && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td className="font-semibold text-brand-700">{d.code}</td>
                  <td>{d.name}</td>
                  <td>{d.manager || '-'}</td>
                  <td>{d.employeeCount}</td>
                  {canEdit && (
                    <td className="space-x-2">
                      <button onClick={() => openEditModal(d)} className="text-brand-700 hover:underline text-sm">Edit</button>
                      <button onClick={() => handleDelete(d._id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </td>
                  )}
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan={canEdit ? 5 : 4} className="text-center text-gray-400 py-6">No departments yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? 'Edit Department' : 'Add Department'}
            </h2>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label-field">Department Name</label>
                <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Code</label>
                <input required className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className="label-field">Manager</label>
                <input className="input-field" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Description</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Departments;
