import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiLogOut, FiClock } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ 
    name: '', 
    contact: '', 
    role: '', 
    department: '', 
    baseSalary: '', 
    attendance: { date: new Date().toISOString().split('T')[0], inTime: '', outTime: '', hoursWorked: 0 }
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees');
      console.log('Fetched employees:', response.data); // Debug initial fetch
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Check server connection.');
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.contact || !form.baseSalary) return;
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/employees/${editingId}`, form);
      } else {
        await axios.post('http://localhost:5000/api/employees', form);
      }
      fetchEmployees();
      setForm({ 
        name: '', 
        contact: '', 
        role: '', 
        department: '', 
        baseSalary: '', 
        attendance: { date: new Date().toISOString().split('T')[0], inTime: '', outTime: '', hoursWorked: 0 }
      });
      setEditingId(null);
      setError(null);
    } catch (err) {
      setError('Failed to save employee. Check server or input data.');
      console.error('Error saving employee:', err);
    }
  };

  const handleEdit = (emp) => {
    setForm({ 
      name: emp.name, 
      contact: emp.contact, 
      role: emp.role, 
      department: emp.department, 
      baseSalary: emp.baseSalary,
      attendance: emp.attendance || { date: new Date().toISOString().split('T')[0], inTime: '', outTime: '', hoursWorked: 0 }
    });
    setEditingId(emp._id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/employees/${id}`);
      fetchEmployees();
      setError(null);
    } catch (err) {
      setError('Failed to delete employee.');
      console.error('Error deleting employee:', err);
    }
  };

  const updateAttendance = async (id, action) => {
    console.log('Updating attendance for ID:', id, 'Action:', action);
    const employee = employees.find(e => e._id === id);
    if (!employee) {
      console.error('Employee not found:', id);
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
    const currentDate = now.toISOString().split('T')[0];

    let newAttendance = { ...employee.attendance || { date: currentDate, inTime: '', outTime: '', hoursWorked: 0 } };
    if (action === 'in') {
      newAttendance.inTime = currentTime;
    } else if (action === 'out') {
      newAttendance.outTime = currentTime;
    }

    if (newAttendance.inTime && newAttendance.outTime) {
      const inTime = new Date(`2000-01-01 ${newAttendance.inTime}`);
      const outTime = new Date(`2000-01-01 ${newAttendance.outTime}`);
      if (!isNaN(inTime) && !isNaN(outTime) && outTime > inTime) {
        const diffMs = outTime - inTime;
        newAttendance.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    try {
      console.log('Sending update with payload:', { attendance: newAttendance });
      const response = await axios.put(`http://localhost:5000/api/employees/${id}`, {
        attendance: newAttendance,
      });
      console.log('Update response:', response.data); // Log full response
      // Update state with the full updated employee
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp._id === id ? response.data : emp
        )
      );
      setError(null);
    } catch (err) {
      setError('Failed to update attendance.');
      console.error('Error updating attendance:', err.response?.data || err.message);
    }
  };

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-gray-100 font-inter">
      <AdminSidebar activePage="employees" />

      <main className="ml-64 w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Employee Management</h1>
            <p className="text-sm text-gray-500">Manage employee details</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">admin@dimalsha.com</p>
            </div>
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              AU
            </div>
            <FiLogOut className="text-gray-500 hover:text-red-500 cursor-pointer" size={18} />
          </div>
        </div>

        {/* Search + Add */}
        <div className="mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <input
            type="text"
            placeholder="Search employee..."
            className="border px-4 py-2 rounded-md w-full md:w-1/2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Name (e.g., Nimal Perera)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder="Contact (e.g., 0771234567)"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <input
              type="text"
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <input
              type="number"
              placeholder="Base Salary (e.g., Rs. 50000)"
              value={form.baseSalary}
              onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
              className="px-2 py-1 border rounded"
            />
            <button
              onClick={handleSubmit}
              className="bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-indigo-700 transition"
            >
              <FiPlus />
              {editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Dept.</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp._id}>
                  <td className="px-4 py-2 font-medium">{emp.name}</td>
                  <td className="px-4 py-2">{emp.contact}</td>
                  <td className="px-4 py-2">{emp.role}</td>
                  <td className="px-4 py-2">{emp.department}</td>
                  <td className="px-4 py-2">Rs. {emp.baseSalary || 0}</td>
                  <td className="px-4 py-2">
                    <div>
                      <p>Date: {new Date(emp.attendance?.date || new Date().toISOString().split('T')[0]).toLocaleDateString()}</p>
                      <p>In: {emp.attendance?.inTime || 'Not Recorded'}</p>
                      <p>Out: {emp.attendance?.outTime || 'Not Recorded'}</p>
                      <p>Hours: {emp.attendance?.hoursWorked || 0} hrs</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateAttendance(emp._id, 'in')}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                          disabled={emp.attendance?.inTime && !emp.attendance?.outTime}
                        >
                          In
                        </button>
                        <button
                          onClick={() => updateAttendance(emp._id, 'out')}
                          className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
                          disabled={!emp.attendance?.inTime || emp.attendance?.outTime}
                        >
                          Out
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-gray-400" colSpan="7">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Employee;