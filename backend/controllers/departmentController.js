const Department = require('../models/Department');
const Employee = require('../models/Employee');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const withCounts = await Promise.all(
      departments.map(async (d) => {
        const count = await Employee.countDocuments({ department: d._id });
        return { ...d.toObject(), employeeCount: count };
      })
    );
    res.json(withCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;
    if (!name || !code) return res.status(400).json({ message: 'Name and code are required' });
    const exists = await Department.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (exists) return res.status(400).json({ message: 'Department name or code already exists' });
    const dept = await Department.create({ name, code, description, manager });
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const inUse = await Employee.countDocuments({ department: req.params.id });
    if (inUse > 0) {
      return res.status(400).json({ message: 'Cannot delete: employees are assigned to this department' });
    }
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    res.json({ message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
