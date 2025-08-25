import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { FiLogOut } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryId: '',
    orderId: '',
    customerName: '',
    address: '',
    assignedTo: '',
    employeeNumber: '',
    orderDate: '',
    status: 'Pending',
  });

  // Fetch admin name from token (assuming JWT decoding or simple storage)
  const adminToken = localStorage.getItem('adminToken');
  const adminName = adminToken ? JSON.parse(atob(adminToken.split('.')[1])).name || 'Admin' : 'Admin'; // Decode JWT or fallback
  const adminEmail = adminToken ? JSON.parse(atob(adminToken.split('.')[1])).email || 'admin@dimalsha.com' : 'admin@dimalsha.com'; // Fallback email

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDeliveries(data);
    } catch (err) {
      setError('Failed to fetch deliveries');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const [deliveriesResponse, ordersResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/deliveries`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_BASE_URL}/orders/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDeliveries(deliveriesResponse.data || []);

        const pendingOrders = ordersResponse.data.filter((order) => order.status === 'Pending');
        for (const order of pendingOrders) {
          const existingDelivery = deliveriesResponse.data.find((d) => d.orderId === order._id);
          if (!existingDelivery) {
            await axios.post(
              `${API_BASE_URL}/deliveries`,
              {
                orderId: order._id,
                customerName: order.name,
                address: order.address,
                driver: {
                  name: '',
                  employeeNumber: '',
                },
                orderDate: new Date().toISOString(),
                status: 'Pending',
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
        const updatedDeliveries = await axios.get(`${API_BASE_URL}/deliveries`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeliveries(updatedDeliveries.data || []);
        setError(null);
      } catch (err) {
        setError('Failed to fetch deliveries or orders.');
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
        console.error('API Error:', err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const method = editingDelivery ? 'PUT' : 'POST';
      const url = editingDelivery
        ? `${API_BASE_URL}/deliveries/${editingDelivery._id}`
        : `${API_BASE_URL}/deliveries`;

      const payload = {
        customerName: formData.customerName,
        address: formData.address,
        status: formData.status,
        orderDate: formData.orderDate || new Date().toISOString(),
        driver: {
          name: formData.assignedTo || '',
          employeeNumber: formData.employeeNumber || '',
        },
        deliveryId: formData.deliveryId,
        orderId: formData.orderId,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save');

      fetchDeliveries();
      resetForm();
      setShowForm(false);

      setSuccess(
        editingDelivery
          ? 'Delivery updated successfully!'
          : 'Delivery added successfully!'
      );
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save delivery');
      console.error('Error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      deliveryId: '',
      orderId: '',
      customerName: '',
      address: '',
      assignedTo: '',
      employeeNumber: '',
      orderDate: '',
      status: 'Pending',
    });
    setEditingDelivery(null);
  };

  const handleEdit = (delivery) => {
    setFormData({
      deliveryId: delivery.deliveryId || '',
      orderId: delivery.orderId || '',
      customerName: delivery.customerName || '',
      address: delivery.address || '',
      assignedTo: delivery.driver?.name || '',
      employeeNumber: delivery.driver?.employeeNumber || '',
      orderDate: delivery.orderDate ? new Date(delivery.orderDate).toISOString().split('T')[0] : '',
      status: delivery.status || 'Pending',
    });
    setEditingDelivery(delivery);
    setShowForm(true);
    setShowReports(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to delete');
        fetchDeliveries();
        setSuccess('Delivery deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete delivery');
        console.error('Error:', err);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update');
      fetchDeliveries();
      setSuccess(`Status updated to ${newStatus} successfully!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      setError('Failed to update status');
      console.error('Error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '3px solid #e2e8f0',
              borderTop: '3px solid #3182ce',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
          <span style={{ fontSize: '16px', color: '#4a5568' }}>
            Loading deliveries...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100 font-inter">
      {/* Sidebar */}
      <AdminSidebar activePage="deliveries" />

      {/* Main Content with Header */}
      <main className="ml-64 w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Delivery Management</h1>
            <p className="text-sm text-gray-500">Manage delivery details</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">{adminEmail}</p>
            </div>
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              {adminName.charAt(0).toUpperCase()}
              {adminName.split(' ')[1]?.charAt(0).toUpperCase() || ''}
            </div>
            <FiLogOut
              className="text-gray-500 hover:text-red-500 cursor-pointer"
              size={18}
              onClick={handleLogout}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 p-3 rounded-lg mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Reports Section */}
          {showReports && (
            <ReportGenerating
              deliveries={deliveries}
              onClose={() => setShowReports(false)}
            />
          )}

          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {editingDelivery ? 'Edit Delivery' : 'Add New Delivery'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="deliveryId"
                    placeholder="Delivery ID"
                    value={formData.deliveryId}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="orderId"
                    placeholder="Order ID"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Customer Name"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="address"
                    placeholder="Delivery Address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="assignedTo"
                    placeholder="Driver Name"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="text"
                    name="employeeNumber"
                    placeholder="Driver Employee Number"
                    value={formData.employeeNumber}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="date"
                    name="orderDate"
                    value={formData.orderDate}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-3 py-1 rounded flex items-center gap-1 hover:bg-indigo-700 transition"
                  >
                    {editingDelivery ? 'Update' : 'Add'} Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Delivery ID</th>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Employee Number</th>
                  <th className="px-4 py-3">Order Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deliveries.map((delivery) => (
                  <tr key={delivery._id}>
                    <td className="px-4 py-2 font-medium">{delivery.deliveryId}</td>
                    <td className="px-4 py-2">{delivery.orderId}</td>
                    <td className="px-4 py-2">{delivery.customerName}</td>
                    <td className="px-4 py-2">{delivery.address}</td>
                    <td className="px-4 py-2">{delivery.driver?.name}</td>
                    <td className="px-4 py-2">{delivery.driver?.employeeNumber}</td>
                    <td className="px-4 py-2">{new Date(delivery.orderDate).toLocaleDateString()}</td>
                    <td className="px-4 py-2">
                      <select
                        value={delivery.status}
                        onChange={(e) => handleStatusChange(delivery._id, e.target.value)}
                        className={`p-2 border rounded ${
                          delivery.status === 'Pending'
                            ? 'bg-red-100 text-red-700'
                            : delivery.status === 'In Progress'
                            ? 'bg-yellow-100 text-yellow-700'
                            : delivery.status === 'Delivered'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(delivery)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(delivery._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {deliveries.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-4 text-gray-400" colSpan="9">
                      No deliveries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Stats Footer */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{deliveries.length}</div>
              <div className="text-xs text-gray-500 uppercase">Total Deliveries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {deliveries.filter((d) => d.status === 'Pending').length}
              </div>
              <div className="text-xs text-gray-500 uppercase">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">
                {deliveries.filter((d) => d.status === 'In Progress').length}
              </div>
              <div className="text-xs text-gray-500 uppercase">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {deliveries.filter((d) => d.status === 'Delivered').length}
              </div>
              <div className="text-xs text-gray-500 uppercase">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {deliveries.filter((d) => d.status === 'Cancelled').length}
              </div>
              <div className="text-xs text-gray-500 uppercase">Cancelled</div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const ReportGenerating = ({ deliveries, onClose }) => (
  <div>
    <h3>Delivery Report</h3>
    {/* Add report generation logic here */}
    <button onClick={onClose}>Close</button>
  </div>
);

export default DeliveryManagement;