import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiLogOut, FiCheckCircle, FiDownload } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SalaryFinanceManagement = () => {
  const [salaries, setSalaries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month (2025-08)
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salariesRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/salaries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/dashboard/stats?month=${selectedMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log('Fetched salaries:', salariesRes.data);
        setSalaries(salariesRes.data);
        // Set monthlyIncome based on current month
        const isCurrentMonth = selectedMonth === new Date().toISOString().slice(0, 7); // 2025-08
        setMonthlyIncome(isCurrentMonth ? statsRes.data.monthlyIncome || 0 : 0);
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
      }
    };
    if (token) fetchData();
  }, [token, selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value); // Update selected month
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
        amount: form.amount.replace('LKR ', ''),
        paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
        paid: form.paid || false,
      };
      if (!payload.id) {
        // Ensure new IDs match the format '01' to '10' if adding more
        const existingIds = new Set(salaries.map(sal => sal.id));
        let newId = '11';
        while (existingIds.has(newId)) {
          newId = String(Number(newId) + 1).padStart(2, '0');
        }
        payload.id = newId;
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

  const generateReport = () => {
    const currentMonth = selectedMonth;
    const existingSalaries = salaries.filter(sal => 
      new Date(sal.paymentDate).toISOString().slice(0, 7) === currentMonth
    );

    // Use the 10 employees from fetched data, carry forward with latest details
    const employeeIds = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0')); // '01' to '10'
    const monthlySalaries = employeeIds.map(id => {
      const existing = existingSalaries.find(sal => sal.id === id);
      const latest = salaries.find(sal => sal.id === id) || { name: `Employee ${id}`, role: 'N/A', amount: '0', paid: false };
      return {
        id,
        name: existing?.name || latest.name,
        role: existing?.role || latest.role,
        amount: existing?.amount || latest.amount,
        paymentDate: existing?.paymentDate || new Date(currentMonth).toISOString().split('T')[0],
        paid: existing?.paid || latest.paid || false,
      };
    });

    const paidEmployees = monthlySalaries.filter(sal => sal.paid).map(sal => ({
      'Employee ID': sal.id,
      'Name': sal.name,
      'Role': sal.role,
      'Amount': `LKR ${sal.amount}`,
      'Payment Date': new Date(sal.paymentDate).toLocaleDateString(),
      'Status': 'Paid',
    }));
    const unpaidEmployees = monthlySalaries.filter(sal => !sal.paid).map(sal => ({
      'Employee ID': sal.id,
      'Name': sal.name,
      'Role': sal.role,
      'Amount': `LKR ${sal.amount}`,
      'Payment Date': new Date(sal.paymentDate).toLocaleDateString(),
      'Status': 'Unpaid',
    }));

    const totalPaidAmount = paidEmployees.reduce((sum, sal) => {
      const amount = sal.Amount.replace('LKR ', '') || '0';
      return sum + (Number(amount) || 0);
    }, 0);
    const totalUnpaidAmount = unpaidEmployees.reduce((sum, sal) => {
      const amount = sal.Amount.replace('LKR ', '') || '0';
      return sum + (Number(amount) || 0);
    }, 0);
    const totalSalaryExpense = totalPaidAmount; // Only paid amounts are expenses
    const profit = monthlyIncome - totalSalaryExpense; // Income minus paid salaries

    const reportData = [
      ...paidEmployees,
      { 'Employee ID': 'Total Paid Amount', 'Name': '', 'Role': '', 'Amount': `LKR ${totalPaidAmount}`, 'Payment Date': '', 'Status': '' },
      ...unpaidEmployees,
      { 'Employee ID': 'Total Unpaid Amount', 'Name': '', 'Role': '', 'Amount': `LKR ${totalUnpaidAmount}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Total Salary Expense', 'Name': '', 'Role': '', 'Amount': `LKR ${totalSalaryExpense}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Monthly Income', 'Name': '', 'Role': '', 'Amount': `LKR ${monthlyIncome}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Profit', 'Name': '', 'Role': '', 'Amount': `LKR ${profit}`, 'Payment Date': '', 'Status': '' },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Finance Report');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `finance-report-${currentMonth}.xlsx`);
  };

  const filtered = salaries.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar activePage="salary" />
      <main className="ml-64 p-6 w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Salary & Finance Management</h1>
            <p className="text-sm text-gray-500">Manage salaries, payments, and financial overview</p>
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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            className="w-full md:w-1/3 border rounded px-4 py-2"
            placeholder="Search by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <input
            type="month"
            className="w-full md:w-1/3 border rounded px-4 py-2"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)} // Fixed to use setSelectedMonth directly
          />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
            <input className="border px-2 py-1 rounded" placeholder="ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className="border px-2 py-1 rounded" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition">{editing ? 'Update' : 'Add'}</button>
          </div>
          <button
            onClick={generateReport}
            className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-700 transition"
          >
            <FiDownload /> Generate Report
          </button>
        </div>
        <div className="bg-white shadow rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
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
              {filtered
                .filter(sal => new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth)
                .map((sal) => (
                  <tr key={sal.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{sal.id}</td>
                    <td className="px-4 py-2">{sal.name}</td>
                    <td className="px-4 py-2">{sal.role}</td>
                    <td className="px-4 py-2">{`LKR ${sal.amount}`}</td>
                    <td className="px-4 py-2">{new Date(sal.paymentDate).toLocaleDateString()}</td>
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
              {filtered.filter(sal => new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth).length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-400" colSpan="7">No payments found for this month.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Salary Expense</p>
              <p className="text-2xl font-bold text-gray-800">
                LKR {salaries
                  .filter(sal => sal.paid && new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth)
                  .reduce((sum, sal) => sum + Number(sal.amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Profit</p>
              <p className="text-2xl font-bold text-gray-800">
                LKR {(monthlyIncome - salaries
                  .filter(sal => sal.paid && new Date(sal.paymentDate).toISOString().slice(0, 7) === selectedMonth)
                  .reduce((sum, sal) => sum + Number(sal.amount || 0), 0))
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SalaryFinanceManagement;