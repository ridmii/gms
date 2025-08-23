import express from 'express';
const router = express.Router();
import Employee from '../models/Employee.js';

// Get all employees
router.get('/employees', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Add or update employee
router.post('/employees', async (req, res) => {
  const { name, contact, role, department, baseSalary } = req.body;
  try {
    if (!name || !contact || !baseSalary) {
      return res.status(400).json({ message: 'Name, contact, and base salary are required' });
    }
    const employeeData = { 
      name, 
      contact, 
      role, 
      department, 
      baseSalary,
      attendance: { date: new Date(), inTime: '', outTime: '', hoursWorked: 0 }
    };
    const employee = await Employee.findOneAndUpdate(
      { name },
      employeeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/updating employee' });
  }
});

// Update employee attendance
router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact, role, department, baseSalary, attendance } = req.body;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updatedAttendance = {
      ...employee.attendance,
      ...(attendance || {}),
      date: attendance?.date || employee.attendance.date || new Date(),
      inTime: attendance?.inTime || employee.attendance.inTime || '',
      outTime: attendance?.outTime || employee.attendance.outTime || '',
      hoursWorked: calculateHoursWorked(
        attendance?.inTime || employee.attendance.inTime,
        attendance?.outTime || employee.attendance.outTime
      )
    };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { name, contact, role, department, baseSalary, attendance: updatedAttendance },
      { new: true, runValidators: true }
    );
    res.json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee', error });
  }
});

// Delete employee
router.delete('/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findByIdAndDelete(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ message: 'Employee deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

// Search employees
router.get('/employees/search', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query is required' });
    const employees = await Employee.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { role: { $regex: query, $options: 'i' } },
      ],
    });
    res.json(employees);
  } catch (err) {
    console.error('Error searching employees:', err);
    res.status(500).json({ message: 'Error searching employees', error: err.message });
  }
});

// Generate payslip
router.get('/employees/:id/payslip', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const hourlyRate = employee.baseSalary / 160; // Assuming 160 hours/month
    const totalEarned = (employee.attendance?.hoursWorked || 0) * hourlyRate;
    res.json({
      name: employee.name,
      total: `Rs. ${Math.round(totalEarned)}`,
      baseSalary: `Rs. ${employee.baseSalary}`,
      hoursWorked: `${employee.attendance?.hoursWorked || 0} hrs`,
      hourlyRate: `Rs. ${Math.round(hourlyRate)}/hr`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating payslip' });
  }
});

// Helper function to calculate hours worked
function calculateHoursWorked(inTime, outTime) {
  if (!inTime || !outTime) return 0;
  const inDate = new Date(`2000-01-01 ${inTime}`);
  const outDate = new Date(`2000-01-01 ${outTime}`);
  if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) return 0;
  const diffMs = outDate - inDate;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimals
}

export default router;