import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import employeeApi from '../api/employeeAxios';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const now = new Date();

const statusStyles = {
  Present: 'bg-green-100 text-green-700',
  Absent: 'bg-red-100 text-red-700',
  Leave: 'bg-amber-100 text-amber-700',
  'Half-Day': 'bg-blue-100 text-blue-700',
};

const EmployeePortal = () => {
  const { employee, logout } = useEmployeeAuth();
  const navigate = useNavigate();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, payRes] = await Promise.all([
        employeeApi.get('/employee-auth/attendance', { params: { month, year } }),
        employeeApi.get('/employee-auth/payroll'),
      ]);
      setAttendance(attRes.data);
      setPayrolls(payRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const handleLogout = () => {
    logout();
    navigate('/employee-login');
  };

  const handleDownload = async (id) => {
    setDownloadingId(id);
    try {
      const res = await employeeApi.get(`/employee-auth/payroll/${id}/payslip`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${employee?.employeeId}.pdf`);
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

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const leaveCount = attendance.filter((a) => a.status === 'Leave').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand-800 text-white">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold tracking-wide">CORPORATE</div>
            <div className="text-xs text-brand-100/80 uppercase tracking-widest">Employee Self-Service Portal</div>
          </div>
          <button onClick={handleLogout} className="text-sm font-medium bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        {/* Profile card */}
        <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-xl">
            {employee?.firstName?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">{employee?.firstName} {employee?.lastName}</div>
            <div className="text-sm text-gray-500">
              {employee?.designation} · {employee?.department?.name} · {employee?.employeeId}
            </div>
            <div className="text-sm text-gray-400">{employee?.email}</div>
          </div>
        </div>

        {/* Attendance section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
          <h2 className="font-semibold text-gray-800">My Attendance</h2>
          <div className="flex gap-2">
            <select className="input-field" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {monthNames.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select className="input-field" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-green-600">{presentCount}</div>
            <div className="text-xs text-gray-500">Present</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-red-600">{absentCount}</div>
            <div className="text-xs text-gray-500">Absent</div>
          </div>
          <div className="card text-center py-3">
            <div className="text-xl font-bold text-amber-600">{leaveCount}</div>
            <div className="text-xs text-gray-500">Leave</div>
          </div>
        </div>

        <div className="card overflow-x-auto mb-8">
          {loading ? (
            <div className="text-gray-500">Loading attendance...</div>
          ) : (
            <table className="w-full ems-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[a.status]}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.remarks || '-'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-6">No attendance marked for this month yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Payroll / payslips section */}
        <h2 className="font-semibold text-gray-800 mb-3">My Payslips</h2>
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="text-gray-500">Loading payroll history...</div>
          ) : (
            <table className="w-full ems-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net Pay</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p) => (
                  <tr key={p._id}>
                    <td>{monthNames[p.month - 1]} {p.year}</td>
                    <td className="font-semibold text-brand-700">Rs. {p.netPay.toLocaleString('en-IN')}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(p._id)}
                        disabled={downloadingId === p._id}
                        className="text-brand-700 hover:underline text-sm"
                      >
                        {downloadingId === p._id ? 'Preparing...' : 'Download Payslip'}
                      </button>
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-gray-400 py-6">No payroll records yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeePortal;
