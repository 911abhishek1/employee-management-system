import { useState } from 'react';
import api from '../api/axios';

const buildInitialForm = (employee) => ({
  firstName: employee?.firstName || '',
  lastName: employee?.lastName || '',
  email: employee?.email || '',
  phone: employee?.phone || '',
  designation: employee?.designation || '',
  department: employee?.department?._id || employee?.department || '',
  dateOfJoining: employee?.dateOfJoining ? employee.dateOfJoining.substring(0, 10) : '',
  gender: employee?.gender || 'Other',
  address: employee?.address || '',
  baseSalary: employee?.baseSalary || '',
  status: employee?.status || 'Active',
});

const EmployeeForm = ({ departments, employee, onClose, onSaved }) => {
  const [form, setForm] = useState(buildInitialForm(employee));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, baseSalary: Number(form.baseSalary) };
      if (employee) {
        await api.put(`/employees/${employee._id}`, payload);
      } else {
        await api.post('/employees', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {employee ? 'Edit Employee' : 'Add Employee'}
        </h2>
        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-field">First Name</label>
            <input required className="input-field" value={form.firstName} onChange={handleChange('firstName')} />
          </div>
          <div>
            <label className="label-field">Last Name</label>
            <input required className="input-field" value={form.lastName} onChange={handleChange('lastName')} />
          </div>
          <div>
            <label className="label-field">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={handleChange('email')} />
          </div>
          <div>
            <label className="label-field">Phone</label>
            <input className="input-field" value={form.phone} onChange={handleChange('phone')} />
          </div>
          <div>
            <label className="label-field">Designation</label>
            <input required className="input-field" value={form.designation} onChange={handleChange('designation')} />
          </div>
          <div>
            <label className="label-field">Department</label>
            <select required className="input-field" value={form.department} onChange={handleChange('department')}>
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Date of Joining</label>
            <input type="date" required className="input-field" value={form.dateOfJoining} onChange={handleChange('dateOfJoining')} />
          </div>
          <div>
            <label className="label-field">Gender</label>
            <select className="input-field" value={form.gender} onChange={handleChange('gender')}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label-field">Base Salary (monthly)</label>
            <input type="number" min="0" required className="input-field" value={form.baseSalary} onChange={handleChange('baseSalary')} />
          </div>
          <div>
            <label className="label-field">Status</label>
            <select className="input-field" value={form.status} onChange={handleChange('status')}>
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label-field">Address</label>
            <textarea className="input-field" rows={2} value={form.address} onChange={handleChange('address')} />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : employee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
