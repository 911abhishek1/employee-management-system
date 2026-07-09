import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SummaryCard from '../components/SummaryCard';
import api from '../api/axios';

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const { data } = await api.get('/payroll/summary/dashboard');
        setSummary(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm">Overview of your organization at a glance</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-500">Loading summary...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <SummaryCard title="Total Employees" value={summary.totalEmployees} icon="👥" accent="brand" />
            <SummaryCard title="Departments" value={summary.totalDepartments} icon="🏢" accent="blue" />
            <SummaryCard title="Payroll Runs" value={summary.totalPayrollRuns} icon="🧾" accent="amber" />
            <SummaryCard
              title={`Payout — ${monthNames[summary.currentMonth - 1]} ${summary.currentYear}`}
              value={`Rs. ${summary.monthlyPayout.toLocaleString('en-IN')}`}
              icon="💰"
              accent="rose"
            />
          </div>

          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-4">
              Recent Payroll Entries — {monthNames[summary.currentMonth - 1]} {summary.currentYear}
            </h2>
            {summary.recentPayrolls.length === 0 ? (
              <p className="text-sm text-gray-500">No payroll entries processed yet this month.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full ems-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Net Pay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentPayrolls.map((p) => (
                      <tr key={p._id}>
                        <td>{p.employee?.employeeId}</td>
                        <td>{p.employee?.firstName} {p.employee?.lastName}</td>
                        <td>Rs. {p.netPay.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default Dashboard;
