import mongoose from 'mongoose';

const salarySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String },
  amount: { type: String, required: true }, // Store as string with 'LKR ' or parse to number if needed
  paymentDate: { type: Date, required: true },
  paid: { type: Boolean, default: false },
});

const Salary = mongoose.model('Salary', salarySchema, 'salaries'); // Explicitly set collection name
export default Salary;