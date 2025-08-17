import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  role: { type: String, default: 'Staff' },
  department: { type: String, default: 'General' },
  baseSalary: { type: Number, required: true },
  attendance: {
    date: { type: Date, default: Date.now },
    inTime: { type: String }, // e.g., "09:00"
    outTime: { type: String }, // e.g., "17:00"
    hoursWorked: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now },
});

const Employee = mongoose.model('Employee', employeeSchema);
export default Employee;