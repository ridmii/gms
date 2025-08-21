import { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiLogOut, FiCheckCircle } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const SalaryFinanceManagement = () => {
  const [salaries, setSalaries] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', role: '', amount: '', paymentDate: '', paid: false });
  const [search, setSearch] = useState('');
  const [token] = useState(localStorage.getItem('adminToken') || '');

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/salaries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Fetched salaries:', res.data); // Debug fetch
        setSalaries(res.data);
      } catch (err) {
        console.error('Error fetching salaries:', err.response?.data || err.message); // Log error details
      }
    };
    if (token) fetchSalaries();
  }, [token]);

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
        amount: form.amount.replace('LKR ', ''), // Clean amount
        paymentDate: form.paymentDate || new Date().toISOString().split('T')[0],
        paid: form.paid || false,
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
            <h1 className="text-2xl font-bold">Salary Management</h1>
            <p className="text-sm text-gray-500">Manage employee salaries and payments</p>
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
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 w-full">
            <input className="border px-2 py-1 rounded" placeholder="ID" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            <input className="border px-2 py-1 rounded" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <input className="border px-2 py-1 rounded" type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
            <button onClick={handleSubmit} className="bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700 transition">{editing ? 'Update' : 'Add'}</button>
          </div>
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
              {filtered.map((sal) => (
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
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-4 text-center text-gray-400" colSpan="7">No payments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default SalaryFinanceManagement;