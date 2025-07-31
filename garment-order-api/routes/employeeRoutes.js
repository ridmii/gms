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
    const employeeData = { name, contact, role, department, baseSalary };
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
  const { name, contact, role, department, baseSalary, present, bonuses, deductions } = req.body;
  try {
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, contact, role, department, baseSalary, present, bonuses, deductions },
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

// Generate payslip
router.get('/employees/:id/payslip', async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    const total = employee.baseSalary + (employee.bonuses || 0) - (employee.deductions || 0);
    res.json({
      name: employee.name,
      total: `Rs. ${total}`,
      baseSalary: `Rs. ${employee.baseSalary}`,
      bonuses: `Rs. ${employee.bonuses || 0}`,
      deductions: `Rs. ${employee.deductions || 0}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating payslip' });
  }
});

module.exports = router;