import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const { signup, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'admin' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    const res = await signup(form.name, form.email, form.password, form.role);
    if (res.success) navigate('/dashboard');
    else setError(res.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-800 to-brand-600 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-3xl font-extrabold text-white tracking-wide">CORPORATE</div>
          <div className="text-brand-100 text-sm uppercase tracking-widest">Employee Management System</div>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Create an account</h2>
          <p className="text-sm text-gray-500 mb-6">Set up your admin/HR access</p>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-field">Full Name</label>
              <input
                required
                className="input-field"
                placeholder="Jane Doe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                required
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Confirm Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            <div>
              <label className="label-field">Role</label>
              <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Administrator — full access</option>
                <option value="hr">HR — manage employees, payroll, attendance</option>
                <option value="manager">Manager — view-only + mark attendance</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                In production, restrict role selection to an existing admin inviting new users.
              </p>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-gray-500 text-center mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
