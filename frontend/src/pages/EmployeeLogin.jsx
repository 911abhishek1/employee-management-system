import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployeeAuth } from '../context/EmployeeAuthContext';

const EmployeeLogin = () => {
  const { login, loading } = useEmployeeAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) navigate('/employee-portal');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl font-extrabold text-white tracking-wide">CORPORATE</div>
          <div className="text-brand-100 text-sm uppercase tracking-widest">Employee Self-Service Portal</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Employee Login</h2>
          <p className="text-sm text-gray-500 mb-6">
            View your attendance and download your payslips
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Work Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@corporate.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Provided by HR"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Don't have portal access yet? Ask your HR/Admin to enable it from the Employees page.
          </p>
          <p className="text-sm text-gray-500 text-center mt-4 pt-4 border-t border-gray-100">
            HR / Admin / Manager?{' '}
            <Link to="/login" className="text-brand-700 font-semibold hover:underline">
              Staff login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
