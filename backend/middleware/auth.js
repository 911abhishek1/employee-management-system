const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

// Admin / HR / Manager auth (staff who manage the system)
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

// Restricts a route to specific roles, e.g. authorize('admin', 'hr')
// Must be used AFTER `protect` so req.user is populated.
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}`,
    });
  }
  next();
};

// Employee self-service portal auth — completely separate from the staff
// login above. Tokens are tagged { type: 'employee' } so a staff token can
// never be replayed here, and vice versa.
const protectEmployee = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'employee') {
      return res.status(401).json({ message: 'Invalid token type for this portal' });
    }
    const employee = await Employee.findById(decoded.id).select('-password').populate('department', 'name code');
    if (!employee) {
      return res.status(401).json({ message: 'Employee account no longer exists' });
    }
    req.employee = employee;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, invalid or expired token' });
  }
};

module.exports = { protect, authorize, protectEmployee };
