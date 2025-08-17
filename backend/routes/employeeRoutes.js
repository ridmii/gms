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
  const { name, contact, role, department, baseSalary, attendance } = req.body;
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
      attendance: attendance || { date: new Date(), inTime: '', outTime: '', hoursWorked: 0 }
    };
    const employee = await Employee.findOneAndUpdate(
      { name }, // Assuming name is unique for simplicity
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
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, contact, role, department, baseSalary, attendance },
      { new: true }
    );
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee' });
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
    const totalEarned = employee.attendance.hoursWorked * hourlyRate;
    res.json({
      name: employee.name,
      total: `Rs. ${Math.round(totalEarned)}`,
      baseSalary: `Rs. ${employee.baseSalary}`,
      hoursWorked: `${employee.attendance.hoursWorked || 0} hrs`,
      hourlyRate: `Rs. ${Math.round(hourlyRate)}/hr`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating payslip' });
  }
});

module.exports = router;