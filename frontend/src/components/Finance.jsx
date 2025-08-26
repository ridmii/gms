import { useState, useEffect, useCallback } from 'react';
import { FiEdit, FiTrash2, FiLogOut, FiCheckCircle, FiDownload } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const SalaryFinanceManagement = () => {
  const [salaries, setSalaries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ _id: '', id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to 2025-08
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlySalaryExpense, setMonthlySalaryExpense] = useState(0);
  const [inventoryExpense, setInventoryExpense] = useState(0); // New state for inventory expense
  const [monthlyProfit, setMonthlyProfit] = useState(0);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salariesRes, statsRes, inventoryRes] = await Promise.all([
          axios.get('http://localhost:5000/api/salaries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/dashboard/stats?month=${selectedMonth}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/inventory/total-value', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setSalaries(salariesRes.data);
        const stats = statsRes.data || { monthlyIncome: 0, totalSalaryExpense: 0, profit: 0 };
        setMonthlyIncome(stats.monthlyIncome);
        setMonthlySalaryExpense(stats.totalSalaryExpense);
        setInventoryExpense(inventoryRes.data.totalInventoryValue || 0);
        // Recalculate profit: Income - (Salary Expense + Inventory Expense)
        setMonthlyProfit(stats.monthlyIncome - (stats.totalSalaryExpense + (inventoryRes.data.totalInventoryValue || 0)));
      } catch (err) {
        console.error('Error fetching data:', err.response?.data || err.message);
        setMonthlyIncome(100000); // Fallback for demo
        setMonthlySalaryExpense(40000);
        setInventoryExpense(30000); // Fallback inventory expense
        setMonthlyProfit(30000); // Fallback profit
      }
    };
    if (token) fetchData();
  }, [token, selectedMonth]);

  // Real-time updates via SSE with token
  useEffect(() => {
    if (!token) return;

    const es = new EventSourcePolyfill('http://localhost:5000/api/dashboard/stream', {
      headers: { Authorization: `Bearer ${token}` },
    });

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMonthlyIncome(data.monthlyIncome);
      setMonthlySalaryExpense(data.totalSalaryExpense);
      // Fetch inventory expense separately as SSE might not include it
      axios.get('http://localhost:5000/api/inventory/total-value', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        setInventoryExpense(res.data.totalInventoryValue || 0);
        setMonthlyProfit(data.monthlyIncome - (data.totalSalaryExpense + (res.data.totalInventoryValue || 0)));
      }).catch((err) => console.error('Error fetching inventory value:', err));
    };
    es.onerror = (err) => {
      console.error('SSE error:', err);
      es.close();
    };

    return () => es.close();
  }, [token]);

  // Search salaries
  const handleSearch = useCallback(async () => {
    if (!search) {
      setSalaries([]); // Clear results if search is empty
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/salaries/search?query=${search}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSalaries(res.data);
    } catch (err) {
      console.error('Error searching salaries:', err.response?.data || err.message);
    }
  }, [search, token]);

  useEffect(() => {
    const debounce = setTimeout(() => handleSearch(), 300); // Debounce search
    return () => clearTimeout(debounce);
  }, [search, handleSearch]);

  const handleTogglePaid = useCallback(async (_id) => {
    try {
      const salary = salaries.find(sal => sal._id === _id);
      if (!salary) {
        console.error('Salary not found for _id:', _id);
        return;
      }
      const newPaidStatus = !salary.paid;
      const res = await axios.put(`http://localhost:5000/api/salaries/${_id}/mark-paid`, { paid: newPaidStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data && res.data._id) {
        setSalaries((prev) => prev.map((sal) => sal._id === res.data._id ? res.data : sal));
      }
    } catch (err) {
      console.error('Error toggling paid status:', err.response?.data || err.message);
      setSalaries((prev) => prev.map((sal) => sal._id === _id ? { ...sal, paid: !sal.paid } : sal));
    }
  }, [token, salaries]);

  const handleEdit = (sal) => {
    setForm(sal);
    setEditing(sal._id);
  };

  const handleDelete = async (_id) => {
    try {
      const salary = salaries.find(sal => sal._id === _id);
      if (!salary) {
        console.error('Salary not found for _id:', _id);
        return;
      }
      console.log(`Deleting salary with _id: ${_id}, custom id: ${salary.id}`);
      const response = await axios.delete(`http://localhost:5000/api/salaries/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete response:', response.data);
      setSalaries((prev) => prev.filter((sal) => sal._id !== _id));
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
      let res;
      if (editing) {
        res = await axios.put(`http://localhost:5000/api/salaries/${editing}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        res = await axios.post('http://localhost:5000/api/salaries', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSalaries((prev) => {
        if (editing) {
          return prev.map((sal) => sal._id === res.data._id ? res.data : sal);
        }
        return [...prev, res.data];
      });
      setForm({ _id: '', id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
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

    const employeeIds = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0')); // '01' to '10'
    const monthlySalaries = employeeIds.map(id => {
      const existing = existingSalaries.find(sal => sal.id === id);
      const latest = salaries.find(sal => sal.id === id) || { id, name: `Employee ${id}`, role: 'N/A', amount: '0', paid: false, paymentDate: new Date(currentMonth).toISOString().split('T')[0] };
      return {
        ...latest,
        _id: existing?._id || latest._id, // Include _id if exists
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

    const totalPaidAmount = paidEmployees.reduce((sum, sal) => sum + (Number(sal.Amount.replace('LKR ', '') || 0)), 0);
    const totalUnpaidAmount = unpaidEmployees.reduce((sum, sal) => sum + (Number(sal.Amount.replace('LKR ', '') || 0)), 0);
    const totalSalaryExpense = monthlySalaryExpense; // Use backend-calculated value
    const totalExpenses = totalSalaryExpense + inventoryExpense; // Add inventory expense
    const profit = monthlyProfit; // Already adjusted with inventory expense

    const reportData = [
      ...paidEmployees,
      { 'Employee ID': 'Total Paid Amount', 'Name': '', 'Role': '', 'Amount': `LKR ${totalPaidAmount}`, 'Payment Date': '', 'Status': '' },
      ...unpaidEmployees,
      { 'Employee ID': 'Total Unpaid Amount', 'Name': '', 'Role': '', 'Amount': `LKR ${totalUnpaidAmount}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Total Salary Expense', 'Name': '', 'Role': '', 'Amount': `LKR ${totalSalaryExpense}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Total Inventory Expense', 'Name': '', 'Role': '', 'Amount': `LKR ${inventoryExpense.toLocaleString()}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Total Expenses', 'Name': '', 'Role': '', 'Amount': `LKR ${totalExpenses.toLocaleString()}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Monthly Income', 'Name': '', 'Role': '', 'Amount': `LKR ${monthlyIncome.toLocaleString()}`, 'Payment Date': '', 'Status': '' },
      { 'Employee ID': 'Profit', 'Name': '', 'Role': '', 'Amount': `LKR ${profit.toLocaleString()}`, 'Payment Date': '', 'Status': '' },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Finance Report');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `finance-report-${currentMonth}.xlsx`);
  };

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
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
            <input className="border px-2 py-1 rounded" placeholder="ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className="border px-2 py-1 rounded" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition">
              {editing ? 'Update' : 'Add'}
            </button>
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
              {salaries.map(sal => (
                <tr key={sal._id} className="border-t hover:bg-gray-50">
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
                    <button
                      onClick={() => handleTogglePaid(sal._id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      <FiCheckCircle className="inline" /> {sal.paid ? 'Mark as Unpaid' : 'Mark as Paid'}
                    </button>
                    <button onClick={() => handleEdit(sal)} className="text-blue-600 hover:text-blue-800">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(sal._id)} className="text-red-600 hover:text-red-800">
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Monthly Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-gray-800">LKR {monthlyIncome.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Salary Expense</p>
              <p className="text-2xl font-bold text-gray-800">LKR {monthlySalaryExpense.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Total Inventory Expense</p>
              <p className="text-2xl font-bold text-gray-800">LKR {inventoryExpense.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Profit</p>
              <p className="text-2xl font-bold text-gray-800">LKR {monthlyProfit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Polyfill for EventSource with custom headers
class EventSourcePolyfill {
  constructor(url, options = {}) {
    this.url = url;
    this.options = options;
    this.onmessage = () => {};
    this.onerror = () => {};
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => this.onmessage(event);
    this.eventSource.onerror = (event) => this.onerror(event);
  }

  close() {
    this.eventSource.close();
  }
}

export default SalaryFinanceManagement;