// Central place for role-based UI rules. Mirrors the backend's authorize()
// checks so buttons are hidden for roles that would get a 403 anyway.
// 'manager' is treated as read-only across Employees/Departments/Payroll,
// but can still mark attendance.
export const canManage = (user) => user && (user.role === 'admin' || user.role === 'hr');

export const roleLabel = (role) => {
  const map = { admin: 'Administrator', hr: 'HR', manager: 'Manager' };
  return map[role] || role;
};
