const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    designation: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    dateOfJoining: { type: Date, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Other' },
    address: { type: String, default: '' },
    baseSalary: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

    // Self-service employee portal login. `password` is unset until
    // an admin/HR user grants portal access via "Set Portal Password".
    // select: false keeps it out of normal queries (getEmployees, etc.)
    password: { type: String, select: false },
    hasPortalAccess: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.hasPortalAccess = true;
  next();
});

employeeSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Employee', employeeSchema);
