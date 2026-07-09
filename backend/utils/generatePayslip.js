const PDFDocument = require('pdfkit');

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const formatCurrency = (num) =>
  `Rs. ${Number(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Draws the payslip content onto an already-created PDFDocument instance.
// Shared by both the HTTP-streaming path and the buffer/email path so the
// layout only lives in one place.
const drawPayslip = (doc, payroll) => {
  const emp = payroll.employee;

  doc.rect(0, 0, doc.page.width, 90).fill('#00693E');
  doc.fillColor('#FFFFFF').fontSize(22).font('Helvetica-Bold').text('CORPORATE GROUP', 50, 28);
  doc.fontSize(11).font('Helvetica').text('Employee Management System — Payslip', 50, 56);

  doc.fillColor('#000000');
  doc.moveDown(4);

  doc.fontSize(14).font('Helvetica-Bold').text(
    `Payslip for ${monthNames[payroll.month - 1]} ${payroll.year}`,
    50,
    110
  );
  doc.moveTo(50, 132).lineTo(545, 132).strokeColor('#00693E').lineWidth(1.5).stroke();

  let y = 145;
  const rowGap = 20;
  const details = [
    ['Employee ID', emp.employeeId],
    ['Name', `${emp.firstName} ${emp.lastName}`],
    ['Designation', emp.designation],
    ['Department', emp.department?.name || '-'],
    ['Date of Joining', new Date(emp.dateOfJoining).toLocaleDateString('en-IN')],
    ['Email', emp.email],
  ];
  details.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(10).text(`${label}:`, 50, y, { width: 150 });
    doc.font('Helvetica').fontSize(10).text(String(value), 200, y, { width: 300 });
    y += rowGap;
  });

  y += 15;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#00693E').text('Earnings & Deductions', 50, y);
  y += 20;
  doc.fillColor('#000000');

  doc.rect(50, y, 495, 22).fill('#EAF4EE');
  doc.fillColor('#00693E').font('Helvetica-Bold').fontSize(10);
  doc.text('Component', 60, y + 6);
  doc.text('Amount', 420, y + 6);
  doc.fillColor('#000000');
  y += 26;

  const rows = [
    ['Base Salary', payroll.baseSalary],
    ['Allowances', payroll.allowances],
    ['Bonus', payroll.bonus],
    [`Absent Days Deduction (${payroll.absentDays} day(s))`, payroll.absentDays * payroll.perDayDeduction],
    ['Other Deductions', payroll.deductions],
  ];

  doc.font('Helvetica').fontSize(10);
  rows.forEach(([label, value], i) => {
    if (i % 2 === 0) doc.rect(50, y - 4, 495, 20).fill('#F7FAF8');
    doc.fillColor('#000000').text(label, 60, y);
    doc.text(formatCurrency(value), 420, y);
    y += 20;
  });

  y += 10;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#00693E').lineWidth(1).stroke();
  y += 15;

  doc.rect(50, y, 495, 32).fill('#00693E');
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(13);
  doc.text('NET PAY', 60, y + 9);
  doc.text(formatCurrency(payroll.netPay), 420, y + 9);

  doc.fillColor('#000000');
  y += 60;
  doc.font('Helvetica-Oblique').fontSize(9).fillColor('#666666').text(
    'This is a system-generated payslip and does not require a signature.',
    50,
    y
  );
};

// Streams a payslip PDF directly to an HTTP response (used by the download endpoint)
const generatePayslipPDF = (payroll, res) => {
  const emp = payroll.employee;
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Payslip_${emp.employeeId}_${monthNames[payroll.month - 1]}_${payroll.year}.pdf`
  );
  doc.pipe(res);
  drawPayslip(doc, payroll);
  doc.end();
};

// Builds the same payslip as an in-memory Buffer (used for emailing as an attachment)
const generatePayslipBuffer = (payroll) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      drawPayslip(doc, payroll);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });

module.exports = { generatePayslipPDF, generatePayslipBuffer, monthNames };
