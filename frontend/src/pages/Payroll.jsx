import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { canManage } from '../utils/permissions';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();

const emptyForm = {
  employee: '',
  month: now.getMonth() + 1,
  year: now.getFullYear(),
  allowances: 0,
  bonus: 0,
  deductions: 0,
  absentDays: 0,
  remarks: '',
};

const Payroll = () => {
  const { user } = useAuth();
  const canEdit = canManage(user);

  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [downloadingId, setDownloadingId] = useState(null);
  const [emailingId, setEmailingId] = useState(null);
  const [emailStatus, setEmailStatus] = useState({ id: null, message: '' });
  const [attendanceHint, setAttendanceHint] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        api.get('/payroll', { params: filter }),
        api.get('/employees', { params: { status: 'Active' } }),
      ]);
      setPayrolls(payRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openAdd = () => {
    setForm({ ...emptyForm, month: filter.month, year: filter.year });
    setError('');
    setAttendanceHint(null);
    setShowForm(true);
  };

  // Pulls the attendance summary for the selected employee/month/year and
  // fills the Absent Days field with the effective absent count.
  const autoFillFromAttendance = async () => {
    if (!form.employee) {
      setError('Select an employee first');
      return;
    }
    setCheckingAttendance(true);
    setError('');
    try {
      const { data } = await api.get('/attendance/summary', {
        params: { employee: form.employee, month: form.month, year: form.year },
      });
      setAttendanceHint(data);
      setForm((prev) => ({ ...prev, absentDays: data.effectiveAbsentDays }));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch attendance summary');
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/payroll', {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        allowances: Number(form.allowances),
        bonus: Number(form.bonus),
        deductions: Number(form.deductions),
        absentDays: Number(form.absentDays),
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try {
      await api.delete(`/payroll/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDownload = async (id, employeeId) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`/payroll/${id}/payslip`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${employeeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download payslip');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleEmail = async (id) => {
    setEmailingId(id);
    setEmailStatus({ id: null, message: '' });
    try {
      const { data } = await api.post(`/payroll/${id}/send-email`);
      setEmailStatus({ id, message: data.message });
    } catch (err) {
      setEmailStatus({ id, message: err.response?.data?.message || 'Failed to send email' });
    } finally {
      setEmailingId(null);
    }
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
          <p className="text-gray-500 text-sm">Process salaries and generate or email payslips</p>
        </div>
        {canEdit && <button onClick={openAdd} className="btn-primary">+ Run Payroll</button>}
      </div>

      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="label-field">Month</label>
          <select
            className="input-field"
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: Number(e.target.value) })}
          >
            {monthNames.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Year</label>
          <select
            className="input-field"
            value={filter.year}
            onChange={(e) => setFilter({ ...filter, year: Number(e.target.value) })}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading payroll...</div>
        ) : (
          <table className="w-full ems-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Base</th>
                <th>Allowances</th>
                <th>Bonus</th>
                <th>Deductions</th>
                <th>Absent Days</th>
                <th>Net Pay</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="font-medium">{p.employee?.firstName} {p.employee?.lastName}</div>
                    <div className="text-xs text-gray-400">{p.employee?.employeeId}</div>
                  </td>
                  <td>Rs. {p.baseSalary.toLocaleString('en-IN')}</td>
                  <td>Rs. {p.allowances.toLocaleString('en-IN')}</td>
                  <td>Rs. {p.bonus.toLocaleString('en-IN')}</td>
                  <td>Rs. {p.deductions.toLocaleString('en-IN')}</td>
                  <td>{p.absentDays}</td>
                  <td className="font-semibold text-brand-700">Rs. {p.netPay.toLocaleString('en-IN')}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleDownload(p._id, p.employee?.employeeId)}
                      disabled={downloadingId === p._id}
                      className="text-brand-700 hover:underline text-sm"
                    >
                      {downloadingId === p._id ? 'Preparing...' : 'Payslip'}
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleEmail(p._id)}
                        disabled={emailingId === p._id}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {emailingId === p._id ? 'Sending...' : 'Email'}
                      </button>
                    )}
                    {canEdit && (
                      <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    )}
                    {emailStatus.id === p._id && (
                      <div className="text-xs text-gray-500 mt-1">{emailStatus.message}</div>
                    )}
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-6">No payroll records for this period.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Run Payroll</h2>
            {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label-field">Employee</label>
                <select
                  required
                  className="input-field"
                  value={form.employee}
                  onChange={(e) => { setForm({ ...form, employee: e.target.value }); setAttendanceHint(null); }}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.employeeId} — {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Month</label>
                <select className="input-field" value={form.month} onChange={(e) => { setForm({ ...form, month: e.target.value }); setAttendanceHint(null); }}>
                  {monthNames.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Year</label>
                <select className="input-field" value={form.year} onChange={(e) => { setForm({ ...form, year: e.target.value }); setAttendanceHint(null); }}>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Allowances</label>
                <input type="number" min="0" className="input-field" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Bonus</label>
                <input type="number" min="0" className="input-field" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Other Deductions</label>
                <input type="number" min="0" className="input-field" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
              </div>
              <div>
                <label className="label-field flex items-center justify-between">
                  <span>Absent Days</span>
                  <button
                    type="button"
                    onClick={autoFillFromAttendance}
                    disabled={checkingAttendance}
                    className="text-xs text-brand-700 hover:underline font-normal normal-case"
                  >
                    {checkingAttendance ? 'Checking...' : 'Auto-fill from attendance'}
                  </button>
                </label>
                <input type="number" min="0" step="0.5" className="input-field" value={form.absentDays} onChange={(e) => setForm({ ...form, absentDays: e.target.value })} />
                {attendanceHint && (
                  <p className="text-xs text-gray-400 mt-1">
                    Attendance: {attendanceHint.present} present, {attendanceHint.absent} absent, {attendanceHint.leave} leave, {attendanceHint.halfDay} half-day ({attendanceHint.totalMarked} day(s) marked)
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label-field">Remarks</label>
                <textarea className="input-field" rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
              </div>
              <p className="sm:col-span-2 text-xs text-gray-400">
                Net pay = Base Salary + Allowances + Bonus − Deductions − (Absent Days × Per-Day Salary). Calculated automatically on save.
              </p>
              <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Process Payroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Payroll;
