import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const todayStr = () => new Date().toISOString().substring(0, 10);

const statusStyles = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Leave: 'bg-amber-100 text-amber-700',
  'Half-Day': 'bg-blue-100 text-blue-700',
};

const Attendance = () => {
  const [date, setDate] = useState(todayStr());
  const [roster, setRoster] = useState([]);
  const [draft, setDraft] = useState({}); // employeeId -> { status, remarks }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRoster = async () => {
    setLoading(true);
    setMessage('');
    try {
      const { data } = await api.get('/attendance', { params: { date } });
      setRoster(data.roster);
      const initialDraft = {};
      data.roster.forEach((row) => {
        initialDraft[row.employee._id] = {
          status: row.attendance?.status || 'Present',
          remarks: row.attendance?.remarks || '',
        };
      });
      setDraft(initialDraft);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const updateDraft = (employeeId, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [employeeId]: { ...prev[employeeId], [field]: value },
    }));
  };

  const markAllPresent = () => {
    const next = {};
    roster.forEach((row) => {
      next[row.employee._id] = { ...draft[row.employee._id], status: 'Present' };
    });
    setDraft(next);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const records = roster.map((row) => ({
        employee: row.employee._id,
        status: draft[row.employee._id]?.status || 'Present',
        remarks: draft[row.employee._id]?.remarks || '',
      }));
      const { data } = await api.post('/attendance/mark', { date, records });
      setMessage(data.message);
      fetchRoster();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance</h1>
          <p className="text-gray-500 text-sm">Mark daily attendance — feeds directly into payroll absent-day calculations</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input-field"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
          />
          <button onClick={markAllPresent} className="btn-secondary whitespace-nowrap">Mark all Present</button>
        </div>
      </div>

      {message && (
        <div className="bg-brand-50 text-brand-700 px-4 py-3 rounded-lg mb-4 text-sm">{message}</div>
      )}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-gray-500">Loading roster...</div>
        ) : (
          <>
            <table className="w-full ems-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((row) => {
                  const emp = row.employee;
                  const d = draft[emp._id] || { status: 'Present', remarks: '' };
                  return (
                    <tr key={emp._id}>
                      <td className="font-semibold text-brand-700">{emp.employeeId}</td>
                      <td>{emp.firstName} {emp.lastName}</td>
                      <td>
                        <select
                          className={`text-xs font-medium rounded-full px-2 py-1.5 border-0 focus:outline-none focus:ring-2 focus:ring-brand-500 ${statusStyles[d.status]}`}
                          value={d.status}
                          onChange={(e) => updateDraft(emp._id, 'status', e.target.value)}
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Leave">Leave</option>
                          <option value="Half-Day">Half-Day</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="input-field text-xs py-1"
                          placeholder="Optional note"
                          value={d.remarks}
                          onChange={(e) => updateDraft(emp._id, 'remarks', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
                {roster.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">No active employees found.</td></tr>
                )}
              </tbody>
            </table>
            {roster.length > 0 && (
              <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : `Save Attendance for ${date}`}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Attendance;
