const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    baseSalary: { type: Number, required: true, default: 0 },
    allowances: { type: Number, required: true, default: 0 },
    bonus: { type: Number, required: true, default: 0 },
    deductions: { type: Number, required: true, default: 0 },
    absentDays: { type: Number, required: true, default: 0 },
    perDayDeduction: { type: Number, required: true, default: 0 },
    netPay: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Draft', 'Processed', 'Paid'], default: 'Processed' },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
