const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

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
      { name }, // Consider using a unique field like email instead of name
      employeeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error creating/updating employee' });
  }
});

// Update employee
router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { name, contact, role, department, baseSalary, attendance } = req.body;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updatedAttendance = attendance
      ? {
          ...employee.attendance,
          ...attendance,
          date: attendance.date || employee.attendance.date,
          hoursWorked: attendance.inTime && attendance.outTime
            ? calculateHoursWorked(attendance.inTime, attendance.outTime)
            : employee.attendance.hoursWorked
        }
      : employee.attendance;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { name, contact, role, department, baseSalary, attendance: updatedAttendance },
      { new: true, runValidators: true }
    );
    console.log('Updated employee:', updatedEmployee); // Debug log
    res.json(updatedEmployee); // Return full updated employee
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

// Generate payslip (updated to include hours worked)
router.get('/employees/:id/payslip', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const hourlyRate = employee.baseSalary / 160; // Assuming 160 hours/month as standard
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
  const inDate = new Date(`2000-01-01 ${inTime}`);
  const outDate = new Date(`2000-01-01 ${outTime}`);
  if (isNaN(inDate) || isNaN(outDate) || outDate <= inDate) return 0;
  const diffMs = outDate - inDate;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Hours with 2 decimals
}

module.exports = router;