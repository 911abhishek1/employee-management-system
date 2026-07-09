const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { generatePayslipPDF, generatePayslipBuffer, monthNames } = require('../utils/generatePayslip');
const { sendPayslipEmail } = require('../utils/sendEmail');

const computeNetPay = ({ baseSalary, allowances, bonus, deductions, absentDays, perDayDeduction }) => {
  const absentDeduction = absentDays * perDayDeduction;
  const netPay = baseSalary + allowances + bonus - deductions - absentDeduction;
  return Math.max(0, Math.round(netPay * 100) / 100);
};

const getPayrolls = async (req, res) => {
  try {
    const { month, year, employee } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);
    if (employee) filter.employee = employee;

    const payrolls = await Payroll.find(filter)
      .populate({
        path: 'employee',
        select: 'firstName lastName employeeId designation department',
        populate: { path: 'department', select: 'name code' },
      })
      .sort({ year: -1, month: -1, createdAt: -1 });
    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createPayroll = async (req, res) => {
  try {
    const { employee, month, year, allowances = 0, bonus = 0, deductions = 0, absentDays = 0, remarks } = req.body;
    if (!employee || !month || !year) {
      return res.status(400).json({ message: 'Employee, month and year are required' });
    }
    const emp = await Employee.findById(employee);
    if (!emp) return res.status(404).json({ message: 'Employee not found' });

    const baseSalary = emp.baseSalary;
    const perDayDeduction = Math.round((baseSalary / 30) * 100) / 100;
    const netPay = computeNetPay({ baseSalary, allowances, bonus, deductions, absentDays, perDayDeduction });

    const payroll = await Payroll.create({
      employee,
      month,
      year,
      baseSalary,
      allowances,
      bonus,
      deductions,
      absentDays,
      perDayDeduction,
      netPay,
      remarks,
    });
    const populated = await payroll.populate({
      path: 'employee',
      select: 'firstName lastName employeeId designation department',
      populate: { path: 'department', select: 'name code' },
    });
    res.status(201).json(populated);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Payroll already exists for this employee in the selected month/year' });
    }
    res.status(500).json({ message: err.message });
  }
};

const updatePayroll = async (req, res) => {
  try {
    const existing = await Payroll.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Payroll record not found' });

    const merged = { ...existing.toObject(), ...req.body };
    merged.netPay = computeNetPay(merged);

    const payroll = await Payroll.findByIdAndUpdate(req.params.id, merged, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'employee',
      select: 'firstName lastName employeeId designation department',
      populate: { path: 'department', select: 'name code' },
    });
    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deletePayroll = async (req, res) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    res.json({ message: 'Payroll record deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({
      path: 'employee',
      populate: { path: 'department', select: 'name code' },
    });
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });
    generatePayslipPDF(payroll, res);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const emailPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate({
      path: 'employee',
      populate: { path: 'department', select: 'name code' },
    });
    if (!payroll) return res.status(404).json({ message: 'Payroll record not found' });

    const emp = payroll.employee;
    const pdfBuffer = await generatePayslipBuffer(payroll);
    const monthLabel = `${monthNames[payroll.month - 1]} ${payroll.year}`;

    await sendPayslipEmail({
      to: emp.email,
      subject: `Your Payslip for ${monthLabel}`,
      text: `Hi ${emp.firstName},\n\nPlease find attached your payslip for ${monthLabel}.\nNet Pay: Rs. ${payroll.netPay.toLocaleString('en-IN')}\n\nRegards,\nHR Team`,
      filename: `Payslip_${emp.employeeId}_${monthLabel.replace(' ', '_')}.pdf`,
      pdfBuffer,
    });

    res.json({ message: `Payslip emailed to ${emp.email}` });
  } catch (err) {
    if (err.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// Dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const totalDepartments = await require('../models/Department').countDocuments();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthlyPayrolls = await Payroll.find({ month: currentMonth, year: currentYear });
    const monthlyPayout = monthlyPayrolls.reduce((sum, p) => sum + p.netPay, 0);

    const totalPayrollRuns = await Payroll.countDocuments();

    const recentPayrolls = await Payroll.find({ month: currentMonth, year: currentYear })
      .populate('employee', 'firstName lastName employeeId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalEmployees,
      totalDepartments,
      totalPayrollRuns,
      monthlyPayout,
      currentMonth,
      currentYear,
      recentPayrolls,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getPayrolls,
  createPayroll,
  updatePayroll,
  deletePayroll,
  downloadPayslip,
  emailPayslip,
  getDashboardSummary,
};
