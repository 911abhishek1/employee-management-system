const express = require('express');
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.get('/', getDepartments);
router.post('/', authorize('admin', 'hr'), createDepartment);
router.put('/:id', authorize('admin', 'hr'), updateDepartment);
router.delete('/:id', authorize('admin', 'hr'), deleteDepartment);

module.exports = router;
