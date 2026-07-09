const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const employeeAuthRoutes = require('./routes/employeeAuthRoutes');

connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/employee-auth', employeeAuthRoutes);

// Serve frontend build in production (if placed alongside backend)
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    if (req.originalUrl.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.use(notFound);
}

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
