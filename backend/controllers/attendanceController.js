const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const startOfDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// GET /api/attendance?date=YYYY-MM-DD
// Returns attendance for the given day, plus the full active employee roster,
// so the frontend can render a grid (marked employees + unmarked ones).
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'A date query parameter is required' });
    const day = startOfDay(date);

    const [records, employees] = await Promise.all([
      Attendance.find({ date: day }).populate('employee', 'firstName lastName employeeId'),
      Employee.find({ status: 'Active' }).select('firstName lastName employeeId').sort({ firstName: 1 }),
    ]);

    const recordMap = {};
    records.forEach((r) => {
      recordMap[r.employee._id.toString()] = r;
    });

    const roster = employees.map((emp) => ({
      employee: emp,
      attendance: recordMap[emp._id.toString()] || null,
    }));

    res.json({ date: day, roster });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/attendance/mark
// body: { date: 'YYYY-MM-DD', records: [{ employee, status, remarks }] }
// Upserts one attendance row per employee for that date.
const markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Date and a non-empty records array are required' });
    }
    const day = startOfDay(date);

    const ops = records.map((r) => ({
      updateOne: {
        filter: { employee: r.employee, date: day },
        update: {
          $set: {
            status: r.status,
            remarks: r.remarks || '',
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(ops);
    res.json({ message: `Attendance saved for ${records.length} employee(s)` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/attendance/summary?employee=<id>&month=&year=
// Returns counts used to prefill payroll absent days.
const getAttendanceSummary = async (req, res) => {
  try {
    const { employee, month, year } = req.query;
    if (!employee || !month || !year) {
      return res.status(400).json({ message: 'employee, month and year are required' });
    }
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1));
    const end = new Date(Date.UTC(Number(year), Number(month), 1));

    const records = await Attendance.find({
      employee,
      date: { $gte: start, $lt: end },
    });

    const summary = { present: 0, absent: 0, leave: 0, halfDay: 0, totalMarked: records.length };
    records.forEach((r) => {
      if (r.status === 'Present') summary.present += 1;
      else if (r.status === 'Absent') summary.absent += 1;
      else if (r.status === 'Leave') summary.leave += 1;
      else if (r.status === 'Half-Day') summary.halfDay += 1;
    });
    // Half-days count as 0.5 absent-equivalent for payroll deduction purposes
    summary.effectiveAbsentDays = summary.absent + summary.leave + summary.halfDay * 0.5;

    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAttendanceByDate, markAttendance, getAttendanceSummary };
