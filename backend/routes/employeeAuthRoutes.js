const express = require('express');
const {
  login,
  getMe,
  getMyAttendance,
  getMyPayroll,
  downloadMyPayslip,
} = require('../controllers/employeeAuthController');
const { protectEmployee } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', protectEmployee, getMe);
router.get('/attendance', protectEmployee, getMyAttendance);
router.get('/payroll', protectEmployee, getMyPayroll);
router.get('/payroll/:id/payslip', protectEmployee, downloadMyPayslip);

module.exports = router;
