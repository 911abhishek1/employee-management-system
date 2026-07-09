import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { roleLabel } from '../utils/permissions';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
      <button className="md:hidden text-brand-700 text-2xl" onClick={onMenuClick} aria-label="Open menu">
        ☰
      </button>
      <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm">
        <span>Welcome back, <span className="font-semibold text-gray-800">{user?.name}</span></span>
        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
          {roleLabel(user?.role)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-semibold text-sm">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:text-red-700">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
