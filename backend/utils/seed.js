// Optional helper: run with `npm run seed` after setting MONGO_URI in .env
// Creates a default admin user and a couple of departments to get started quickly.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Department = require('../models/Department');

const run = async () => {
  await connectDB();

  const adminEmail = 'admin@corporate.com';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: 'Admin@123',
      role: 'admin',
    });
    console.log(`Created default admin user -> ${adminEmail} / Admin@123`);
  } else {
    console.log('Admin user already exists, skipping.');
  }

  const departments = [
    { name: 'Human Resources', code: 'HR', description: 'People operations and hiring' },
    { name: 'Finance', code: 'FIN', description: 'Accounts and payroll' },
    { name: 'Information Technology', code: 'IT', description: 'Software and infrastructure' },
    { name: 'Operations', code: 'OPS', description: 'Day to day plant/site operations' },
  ];
  for (const d of departments) {
    const exists = await Department.findOne({ code: d.code });
    if (!exists) {
      await Department.create(d);
      console.log(`Created department: ${d.name}`);
    }
  }

  console.log('Seeding complete.');
  mongoose.connection.close();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
