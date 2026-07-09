const express = require('express');
const {
  getPayrolls,
  createPayroll,
  updatePayroll,
  deletePayroll,
  downloadPayslip,
  emailPayslip,
  getDashboardSummary,
} = require('../controllers/payrollController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/summary/dashboard', getDashboardSummary);
router.get('/:id/payslip', downloadPayslip);
router.post('/:id/send-email', authorize('admin', 'hr'), emailPayslip);
router.get('/', getPayrolls);
router.post('/', authorize('admin', 'hr'), createPayroll);
router.put('/:id', authorize('admin', 'hr'), updatePayroll);
router.delete('/:id', authorize('admin', 'hr'), deletePayroll);

module.exports = router;
