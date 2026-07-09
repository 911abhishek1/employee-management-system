const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null; // email not configured — caller should handle gracefully
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

// Sends a payslip PDF (as a Buffer) as an email attachment.
const sendPayslipEmail = async ({ to, subject, text, filename, pdfBuffer }) => {
  const t = getTransporter();
  if (!t) {
    const err = new Error(
      'Email is not configured on the server. Set SMTP_HOST, SMTP_USER and SMTP_PASS in the backend .env file.'
    );
    err.code = 'EMAIL_NOT_CONFIGURED';
    throw err;
  }

  await t.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
};

module.exports = { sendPayslipEmail };
