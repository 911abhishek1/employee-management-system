const Employee = require('../models/Employee');

const generateEmployeeId = async () => {
  const count = await Employee.countDocuments();
  return `EMP${String(count + 1).padStart(4, '0')}`;
};

const getEmployees = async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    const employees = await Employee.find(filter)
      .populate('department', 'name code')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('department', 'name code');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createEmployee = async (req, res) => {
  try {
    const employeeId = await generateEmployeeId();
    const employee = await Employee.create({ ...req.body, employeeId });
    const populated = await employee.populate('department', 'name code');
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An employee with this email already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('department', 'name code');
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin/HR sets (or resets) an employee's self-service portal password.
const setEmployeePassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    employee.password = password; // hashed automatically by the pre-save hook
    await employee.save();
    res.json({ message: `Portal access enabled for ${employee.firstName} ${employee.lastName}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeePassword,
};
