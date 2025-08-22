import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SalaryFinanceManagement = () => {
<<<<<<< HEAD
  const TOTAL_EMPLOYEES = 15;
  const [employees, setEmployees] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [totalSalaryExpense, setTotalSalaryExpense] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
=======
  const [salaries, setSalaries] = useState([]);
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
  const [search, setSearch] = useState('');
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      try {
<<<<<<< HEAD
        const [statsRes, employeesRes, salariesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/employees', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/salaries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setMonthlyIncome(statsRes.data.monthlyIncome);

        // Safeguard against empty or undefined employees data
        const validEmployees = Array.isArray(employeesRes.data) ? employeesRes.data.filter(emp => emp && typeof emp === 'object') : [];
        setEmployees(validEmployees);

        // Ensure all 15 employees are included, sorted by emp_id
        const allSalaries = [...(Array.isArray(salariesRes.data) ? salariesRes.data : [])];
        const employeeIds = validEmployees
          .sort((a, b) => {
            const aId = a.emp_id || a.id || '';
            const bId = b.emp_id || b.id || '';
            return aId.localeCompare(bId);
          })
          .map(emp => emp._id || emp.id || `emp_${String(validEmployees.indexOf(emp) + 1).padStart(2, '0')}`);
        for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
          if (employeeIds[i]) {
            const existingSalary = allSalaries.find(sal => sal.id === employeeIds[i] && 
              (selectedMonth ? new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth : true));
            if (!existingSalary) {
              const emp = validEmployees.find(emp => emp._id === employeeIds[i] || emp.id === employeeIds[i]);
              allSalaries.push({
                id: employeeIds[i],
                emp_id: emp?.emp_id || `emp_${String(i + 1).padStart(2, '0')}`,
                name: emp?.name || `Employee ${i + 1}`,
                role: emp?.role || 'N/A',
                amount: emp?.baseSalary || 0,
                paymentDate: selectedMonth ? new Date(selectedMonth + '-30').toISOString() : new Date().toISOString(),
                paid: false,
              });
            }
          }
        }
        setSalaries(allSalaries);

        // Generate months from July 2025 to December 2026
        const months = [];
        const startDate = new Date('2025-07-01');
        const endDate = new Date('2026-12-01');
        while (startDate <= endDate) {
          months.push(startDate.toISOString().slice(0, 7));
          startDate.setMonth(startDate.getMonth() + 1);
        }
        setAvailableMonths(months);

        // Calculate for the selected month (default current month)
        const filteredSalaries = allSalaries.filter(sal => 
          new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth
        );
        const expense = filteredSalaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0);
        setTotalSalaryExpense(expense);
        setRemainingAmount(statsRes.data.monthlyIncome - expense);
      } catch (err) {
        console.error('Error fetching data:', err);
=======
        const res = await axios.get('http://localhost:5000/api/salaries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched salaries:', res.data); // Debug fetch
        setSalaries(res.data);
      } catch (err) {
        console.error('Error fetching salaries:', err.response?.data || err.message); // Log error details
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec
      }
    };
    fetchData();
  }, [token, selectedMonth]);

  const handleMonthChange = (e) => {
    const month = e.target.value;
    setSelectedMonth(month);
    const filteredSalaries = month ? salaries.filter(sal => 
      new Date(sal.paymentDate).toISOString().slice(0, 7) === month
    ) : salaries;
    // Ensure all 15 employees are included for the month
    const employeeIds = employees
      .sort((a, b) => {
        const aId = a.emp_id || a.id || '';
        const bId = b.emp_id || b.id || '';
        return aId.localeCompare(bId);
      })
      .map(emp => emp._id || emp.id || `emp_${String(employees.indexOf(emp) + 1).padStart(2, '0')}`);
    const monthSalaries = [...filteredSalaries];
    for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
      if (employeeIds[i]) {
        const existingSalary = monthSalaries.find(sal => sal.id === employeeIds[i]);
        if (!existingSalary) {
          const emp = employees.find(emp => emp._id === employeeIds[i] || emp.id === employeeIds[i]);
          monthSalaries.push({
            id: employeeIds[i],
            emp_id: emp?.emp_id || `emp_${String(i + 1).padStart(2, '0')}`,
            name: emp?.name || `Employee ${i + 1}`,
            role: emp?.role || 'N/A',
            amount: emp?.baseSalary || 0,
            paymentDate: month ? new Date(month + '-30').toISOString() : new Date().toISOString(),
            paid: false,
          });
        }
      }
    }
    const expense = monthSalaries.reduce((sum, sal) => sum + Number(sal.amount || 0), 0);
    setTotalSalaryExpense(expense);
    setRemainingAmount(monthlyIncome - expense);
  };

  const handleMarkPaid = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/salaries/${id}/mark-paid`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries((prev) => prev.map((sal) => sal.id === id ? res.data : sal));
    } catch (err) {
      console.error('Error marking as paid:', err.response?.data || err.message);
    }
  };

  const handleEdit = (sal) => {
    setForm(sal);
    setEditing(sal.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/salaries/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries((prev) => prev.filter((sal) => sal.id !== id));
    } catch (err) {
      console.error('Error deleting salary:', err.response?.data || err.message);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...form,
<<<<<<< HEAD
        amount: form.amount.replace('LKR ', ''),
        paymentDate: new Date(selectedMonth + '-30').toISOString(), // Fixed to 30th
        paid: form.paid,
=======
        amount: form.amount.replace('LKR ', ''), // Clean amount
        paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
        paid: form.paid || false,
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec
      };
      if (!payload.id) {
        payload.id = `SAL_${Date.now()}`; // Generate unique ID if not provided
      }
      if (editing) {
        const res = await axios.put(`http://localhost:5000/api/salaries/${form.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalaries((prev) => prev.map((sal) => sal.id === editing ? res.data : sal));
      } else {
        const res = await axios.post('http://localhost:5000/api/salaries', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalaries((prev) => [...prev, res.data]);
      }
      setForm({ id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
      setEditing(null);
    } catch (err) {
      console.error('Error saving salary:', err.response?.data || err.message);
    }
  };

<<<<<<< HEAD
  const generateReport = () => {
    const filteredSalaries = selectedMonth ? salaries.filter(sal => 
      new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth
    ) : salaries;
    const paidEmployees = filteredSalaries.filter(sal => sal.paid).map(sal => ({
      ID: sal.emp_id || sal.id,
      Name: sal.name,
      Role: sal.role,
      Amount: `LKR ${sal.amount}`,
      PaymentDate: new Date(sal.paymentDate).toLocaleDateString(),
    }));
    const report = [
      ...paidEmployees,
      { ID: 'Total Salary Expense', Name: '', Role: '', Amount: `LKR ${totalSalaryExpense}`, PaymentDate: '' },
      { ID: 'Monthly Income', Name: '', Role: '', Amount: `LKR ${monthlyIncome}`, PaymentDate: '' },
      { ID: 'Remaining Amount', Name: '', Role: '', Amount: `LKR ${remainingAmount}`, PaymentDate: '' },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(report);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Report');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `monthly-salary-report-${selectedMonth || 'all'}.xlsx`);
  };

  const filtered = salaries.filter((e) =>
    (e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedMonth || new Date(e.paymentDate).toISOString().slice(0, 7) === selectedMonth)
  ).sort((a, b) => {
    const aId = a.emp_id || a.id || '';
    const bId = b.emp_id || b.id || '';
    return aId.localeCompare(bId);
  });
=======
  const filtered = salaries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase())
  );
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar activePage="salary" />
      <main className="ml-64 p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Salary Management</h1>
            <p className="text-sm text-gray-500">Manage salaries for 15 employees</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-500">admin@dimalsha.com</p>
            </div>
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              AU
            </div>
            <FiLogOut className="text-gray-500 hover:text-red-500 cursor-pointer" size={18} />
          </div>
        </div>
        <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <select
            className="w-full md:w-1/3 border rounded px-4 py-2"
            value={selectedMonth}
            onChange={handleMonthChange}
          >
            <option value="">All Months</option>
            {availableMonths.map(month => (
              <option key={month} value={month}>{new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>
          <input
            type="text"
            className="w-full md:w-1/3 border rounded px-4 py-2"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full">
            <input className="border px-2 py-1 rounded" placeholder="ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition">{editing ? 'Update' : 'Add'}</button>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg overflow-x-auto mb-6">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">EMPLOYEE ID</th>
                <th className="px-4 py-3 text-left">NAME</th>
                <th className="px-4 py-3 text-left">ROLE</th>
                <th className="px-4 py-3 text-left">AMOUNT</th>
                <th className="px-4 py-3 text-left">PAYMENT DATE</th>
                <th className="px-4 py-3 text-left">STATUS</th>
                <th className="px-4 py-3 text-left">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
<<<<<<< HEAD
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{emp.emp_id || emp.id}</td>
                  <td className="px-4 py-2">{emp.name}</td>
                  <td className="px-4 py-2">{emp.role}</td>
                  <td className="px-4 py-2">{emp.amount}</td>
                  <td className="px-4 py-2">{new Date(emp.paymentDate).toLocaleDateString()}</td>
=======
              {filtered.map((sal) => (
                <tr key={sal.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{sal.id}</td>
                  <td className="px-4 py-2">{sal.name}</td>
                  <td className="px-4 py-2">{sal.role}</td>
                  <td className="px-4 py-2">{`LKR ${sal.amount}`}</td>
                  <td className="px-4 py-2">{new Date(sal.paymentDate).toLocaleDateString()}</td>
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${sal.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {sal.paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-4 py-2 flex gap-2 items-center">
                    {!sal.paid && (
                      <button onClick={() => handleMarkPaid(sal.id)} className="text-green-600 hover:text-green-800 text-sm">
                        <FiCheckCircle className="inline" /> Mark as Paid
                      </button>
                    )}
                    <button onClick={() => handleEdit(sal)} className="text-blue-600 hover:text-blue-800">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(sal.id)} className="text-red-600 hover:text-red-800">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
<<<<<<< HEAD
                  <td className="px-4 py-4 text-center text-gray-400" colSpan="7">No payments found for {selectedMonth ? new Date(selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' }) : 'all months'}.</td>
=======
                  <td className="px-4 py-4 text-center text-gray-400" colSpan="7">No payments found.</td>
>>>>>>> 7b641f12f7776b0c9f08aa709049cf1d2f20b1ec
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Summary</h2>
          <p>Total Salary Expense: LKR {totalSalaryExpense.toLocaleString()}</p>
          <p>Monthly Income: LKR {monthlyIncome.toLocaleString()}</p>
          <p>Remaining Amount: LKR {remainingAmount.toLocaleString()}</p>
          <button
            onClick={generateReport}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-4 hover:bg-blue-700 transition"
          >
            Generate Monthly Report
          </button>
        </div>
      </main>
    </div>
  );
};

export default SalaryFinanceManagement;