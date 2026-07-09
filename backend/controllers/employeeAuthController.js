const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Payroll = require('../models/Payroll');
const { generatePayslipPDF } = require('../utils/generatePayslip');

const generateEmployeeToken = (id) =>
  jwt.sign({ id, type: 'employee' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/employee-auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const employee = await Employee.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('department', 'name code');

    if (!employee || !employee.hasPortalAccess) {
      return res.status(401).json({
        message: 'Invalid email/password, or portal access has not been enabled yet. Contact HR/Admin.',
      });
    }
    const match = await employee.comparePassword(password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: employee._id,
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      designation: employee.designation,
      department: employee.department,
      token: generateEmployeeToken(employee._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/employee-auth/me
const getMe = async (req, res) => {
  res.json(req.employee);
};

// GET /api/employee-auth/attendance?month=&year=
const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: 'month and year query parameters are required' });
    }
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const end = new Date(Date.UTC(Number(year), Number(month), 1));
    const records = await Attendance.find({
      employee: req.employee._id,
      date: { $gte: start, $lt: end },
    }).sort({ date: 1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/employee-auth/payroll
const getMyPayroll = async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employee: req.employee._id }).sort({ year: -1, month: -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/employee-auth/payroll/:id/payslip
// Guards against an employee guessing another employee's payroll _id.
const downloadMyPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({
      path: 'employee',
      populate: { path: 'department', select: 'name code' },
    });
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    if (payroll.employee._id.toString() !== req.employee._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to access this payslip' });
    }
    generatePayslipPDF(payroll, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { login, getMe, getMyAttendance, getMyPayroll, downloadMyPayslip };
