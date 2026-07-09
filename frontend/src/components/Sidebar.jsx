import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/departments', label: 'Departments', icon: '🏢' },
  { to: '/attendance', label: 'Attendance', icon: '🗓️' },
  { to: '/payroll', label: 'Payroll', icon: '💰' },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-brand-800 text-white flex flex-col transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-brand-700/60">
          <div className="text-xl font-bold tracking-wide">CORPORATE</div>
          <div className="text-xs text-brand-100/80 uppercase tracking-widest">Employee Mgmt System</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-white text-brand-800' : 'text-brand-50 hover:bg-brand-700/70'
                }`
              }
            >
              <span>{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 text-xs text-brand-100/60 border-t border-brand-700/60">
          &copy; {new Date().getFullYear()} Corporate Group
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
