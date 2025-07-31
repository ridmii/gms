import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  role: { type: String, default: 'Staff' },
  department: { type: String, default: 'General' },
  baseSalary: { type: Number, required: true },
  present: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;