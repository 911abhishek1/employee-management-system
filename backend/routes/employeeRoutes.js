const express = require('express');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeePassword,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.post('/', authorize('admin', 'hr'), createEmployee);
router.put('/:id', authorize('admin', 'hr'), updateEmployee);
router.put('/:id/set-password', authorize('admin', 'hr'), setEmployeePassword);
router.delete('/:id', authorize('admin', 'hr'), deleteEmployee);

module.exports = router;
