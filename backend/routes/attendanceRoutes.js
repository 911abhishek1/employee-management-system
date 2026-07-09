const express = require('express');
const {
  getAttendanceByDate,
  markAttendance,
  getAttendanceSummary,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getAttendanceByDate);
router.get('/summary', getAttendanceSummary);
router.post('/mark', authorize('admin', 'hr', 'manager'), markAttendance);

module.exports = router;
