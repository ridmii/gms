import React, { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiX } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_BASE = 'http://localhost:5000';

const initialAttendance = () => ({
  date: new Date().toISOString().split('T')[0],
  inTime: '',
  outTime: '',
  hoursWorked: 0,
});

const initialForm = () => ({
  name: '',
  contact: '',
  role: '',
  department: '',
  baseSalary: '',
  attendance: initialAttendance(),
});

const formatCurrency = (n) => {
  const num = Number(n || 0);
  return `Rs. ${num.toLocaleString('en-LK')}`;
};

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialForm());
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // {_id, name}

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/employees`);
      setEmployees(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch employees. Check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((e) =>
      [e.name, e.contact, e.role, e.department]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [employees, searchTerm]);

  const openAddModal = () => {
    setForm(initialForm());
    setEditingId(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (emp) => {
    setForm({
      name: emp.name || '',
      contact: emp.contact || '',
      role: emp.role || '',
      department: emp.department || '',
      baseSalary: emp.baseSalary || '',
      attendance: emp.attendance || initialAttendance(),
    });
    setEditingId(emp._id);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => setIsFormModalOpen(false);

  const validateForm = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!String(form.contact).trim()) return 'Contact is required';
    if (!String(form.baseSalary).trim()) return 'Base salary is required';
    if (Number(form.baseSalary) < 0) return 'Base salary cannot be negative';
    return null;
  };

  const handleSubmit = async () => {
    const msg = validateForm();
    if (msg) {
      setError(msg);
      return;
    }

    const payload = {
      ...form,
      baseSalary: Number(form.baseSalary),
    };

    try {
      setLoading(true);
      if (editingId) {
        await axios.put(`${API_BASE}/api/employees/${editingId}`, payload);
        setNotice('Employee updated successfully.');
      } else {
        await axios.post(`${API_BASE}/api/employees`, payload);
        setNotice('Employee added successfully.');
      }
      await fetchEmployees();
      setForm(initialForm());
      setEditingId(null);
      setIsFormModalOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to save employee. Check server or input data.');
    } finally {
      setLoading(false);
      dismissNoticeSoon();
    }
  };

  const confirmDelete = (emp) => setDeleteTarget({ _id: emp._id, name: emp.name });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/employees/${deleteTarget._id}`);
      setDeleteTarget(null);
      setNotice('Employee deleted.');
      await fetchEmployees();
    } catch (err) {
      setError('Failed to delete employee.');
    } finally {
      setLoading(false);
      dismissNoticeSoon();
    }
  };

  const computeHours = (dateStr, inStr, outStr) => {
    if (!dateStr || !inStr || !outStr) return 0;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [ih, im, is] = inStr.split(':').map(Number);
    const [oh, om, os] = outStr.split(':').map(Number);
    const inDate = new Date(y, m - 1, d, ih, im, is || 0);
    const outDate = new Date(y, m - 1, d, oh, om, os || 0);
    const diffMs = Math.max(0, outDate - inDate);
    const hours = diffMs / (1000 * 60 * 60);
    return Math.round(hours * 100) / 100; // 2 decimals
  };

  const updateAttendance = async (id, action) => {
    const employee = employees.find((e) => e._id === id);
    if (!employee) return;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS
    const currentDate = now.toISOString().split('T')[0];

    // Always start a fresh day on clock-in
    let att = employee.attendance || initialAttendance();

    if (action === 'in') {
      // if already clocked-in and not clocked-out, do nothing to avoid overwriting
      if (att.inTime && !att.outTime) return;
      att = {
        date: currentDate,
        inTime: currentTime,
        outTime: '',
        hoursWorked: 0,
      };
    } else if (action === 'out') {
      // Cannot clock out without an in
      if (!att.inTime) return;

      // Use the original attendance date for accurate difference
      const dateForCalc = att.date || currentDate;
      const newOutTime = currentTime;
      const newHours = computeHours(dateForCalc, att.inTime, newOutTime);

      att = {
        ...att,
        outTime: newOutTime,
        hoursWorked: newHours,
      };
    }

    try {
      setLoading(true);
      const response = await axios.put(`${API_BASE}/api/employees/${id}`, { attendance: att });

      // Prefer server response if it returns the updated employee; otherwise update locally.
      const updatedFromServer = response && response.data && response.data._id;
      if (updatedFromServer) {
        setEmployees((prev) => prev.map((e) => (e._id === id ? response.data : e)));
      } else {
        setEmployees((prev) =>
          prev.map((e) => (e._id === id ? { ...e, attendance: att } : e))
        );
        // Optionally ensure sync with a fetch if your API doesn't return updated doc
        // await fetchEmployees();
      }

      setNotice(action === 'in' ? 'Clocked in.' : 'Clocked out.');
      setError(null);
    } catch (err) {
      setError('Failed to update attendance.');
    } finally {
      setLoading(false);
      dismissNoticeSoon();
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/employees`);
      const employeesData = Array.isArray(response.data) ? response.data : [];

      const reportData = employeesData.map((emp) => {
        const attendance = emp.attendance || { hoursWorked: 0, inTime: '', outTime: '' };
        const hourlyRate = Number(emp.baseSalary || 0) / 160; // 160 hours/month
        const totalEarned = (attendance.hoursWorked || 0) * hourlyRate;

        return {
          Name: emp.name,
          Contact: emp.contact || '',
          Role: emp.role || '',
          Department: emp.department || '',
          'Base Salary': formatCurrency(emp.baseSalary || 0),
          'In Time': attendance.inTime || 'Not Recorded',
          'Out Time': attendance.outTime || 'Not Recorded',
          'Hours Worked': attendance.hoursWorked || 0,
          'Hourly Rate': `${Math.round(hourlyRate)}/hr`,
          'Total Earned': Math.round(totalEarned),
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Employee Attendance Report');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `employee-attendance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      setNotice('Report generated.');
    } catch (err) {
      setError('Failed to generate report.');
    } finally {
      setLoading(false);
      dismissNoticeSoon();
    }
  };

  const dismissNoticeSoon = () => {
    setTimeout(() => setNotice(null), 2500);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-inter">
      <AdminSidebar activePage="employees" />

      <main className="ml-64 w-full p-8">
        {/* Top Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-sm text-gray-500">Manage people, attendance, and payroll insights</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={generateReport}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            >
              <FiDownload /> Export Report
            </button>
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              <FiPlus /> Add Employee
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, role, department, contact..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {notice && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {notice}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100/70 backdrop-blur">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Base Salary</th>
                <th className="px-4 py-3 font-semibold">Attendance</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">Loading...</td>
                </tr>
              )}
              {!loading && filteredEmployees.map((emp) => {
                const att = emp.attendance || {};
                const dateLabel = att.date ? new Date(att.date).toLocaleDateString() : '—';
                const canClockIn = !(att.inTime && !att.outTime);
                const canClockOut = !!att.inTime && !att.outTime;

                return (
                  <tr key={emp._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.contact || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.role || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{emp.department || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-indigo-600">{formatCurrency(emp.baseSalary || 0)}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        <p className="text-xs text-gray-500">{dateLabel}</p>
                        <p><span className="font-semibold">In:</span> {att.inTime || '—'}</p>
                        <p><span className="font-semibold">Out:</span> {att.outTime || '—'}</p>
                        <p><span className="font-semibold">Hours:</span> {Number(att.hoursWorked || 0).toFixed(2)} hrs</p>
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => updateAttendance(emp._id, 'in')}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canClockIn}
                          >
                            Clock In
                          </button>
                          <button
                            onClick={() => updateAttendance(emp._id, 'out')}
                            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!canClockOut}
                          >
                            Clock Out
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(emp)}
                          className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 hover:bg-red-100"
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add/Edit Modal */}
        {isFormModalOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">{editingId ? 'Edit Employee' : 'Add Employee'}</h2>
                <button onClick={closeFormModal} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"><FiX /></button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Full Name</label>
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nimal Perera"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Contact</label>
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="0771234567"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Role</label>
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Supervisor"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-gray-600">Department</label>
                  <input
                    className="rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    placeholder="Production"
                  />
                </div>
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-sm text-gray-600">Base Salary</label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={form.baseSalary}
                    onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
                    placeholder="50000"
                    min={0}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={closeFormModal}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingId ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Delete Employee</h2>
                <button onClick={() => setDeleteTarget(null)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"><FiX /></button>
              </div>
              <p className="text-sm text-gray-700">
                Are you sure you want to delete <span className="font-semibold">{deleteTarget.name}</span>? This action cannot be undone.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Employee;
