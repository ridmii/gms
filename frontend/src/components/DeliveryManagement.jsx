import React, { useState, useEffect, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { FiSearch, FiLogOut, FiPlus } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something Went Wrong</h2>
            <p className="text-gray-600 mb-4">We're sorry, but an error occurred. Please try again later or contact support.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Confirmation Modal Component
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Tracking Modal Component - Fixed version
const TrackingModal = ({ delivery, onClose }) => {
  const [customerEmail, setCustomerEmail] = useState(delivery?.customerEmail || '');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState(null); // Added error state for email

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#d69e2e';
      case 'In Progress': return '#f6ad55';
      case 'Delivered': return '#38a169';
      case 'Cancelled': return '#e53e3e';
      default: return '#718096';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return '⏳';
      case 'In Progress': return '🚛';
      case 'Delivered': return '✅';
      case 'Cancelled': return '❌';
      default: return '📦';
    }
  };

const handleSendEmail = async () => {
  try {
    setSendingEmail(true);
    setEmailError(null);
    
    const token = localStorage.getItem('adminToken');
    if (!token) throw new Error('No authentication token found. Please log in.');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new Error('Please enter a valid email address');
    }

    console.log('Sending email with payload:', { delivery, customerEmail }); // Debug log
    const response = await fetch(`${API_BASE_URL}/deliveries/send-tracking-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ delivery, customerEmail }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `Failed to send email: ${response.status}`);
    }

    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  } catch (error) {
    console.error('Email sending error:', error);
    let errorMessage = 'Failed to send email';
    if (error.message.includes('valid email address')) errorMessage = 'Please enter a valid email address';
    else if (error.message.includes('credentials') || error.message.includes('authentication')) errorMessage = 'Email service not configured. Contact admin.';
    else if (error.message.includes('Invalid email address')) errorMessage = 'The recipient email address is invalid';
    else if (error.message.includes('token')) errorMessage = 'Authentication failed. Please log in again.';
    setEmailError(errorMessage);
    setTimeout(() => setEmailError(null), 5000);
  } finally {
    setSendingEmail(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">📍 Track Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors">
            ×
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3">📦 Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-600 font-medium">Order ID:</span><span className="text-gray-900">{delivery.orderId}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 font-medium">Delivery ID:</span><span className="text-gray-900">{delivery.deliveryId}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 font-medium">Customer Name:</span><span className="text-gray-900">{delivery.customerName || 'N/A'}</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-600 font-medium">Status:</span><span className="text-white px-2 py-1 rounded-full text-xs" style={{ backgroundColor: getStatusColor(delivery.status) + '20', color: getStatusColor(delivery.status) }}>{getStatusIcon(delivery.status)} {delivery.status}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 font-medium">Driver:</span><span className="text-gray-900">{delivery.driver?.name || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600 font-medium">Scheduled Date:</span><span className="text-gray-900">{new Date(delivery.scheduledDate).toLocaleDateString()}</span></div>
            <div className="mt-2 pt-2 border-t border-gray-200"><span className="text-gray-600 font-medium block mb-1">Address:</span><span className="text-gray-900">{delivery.address}</span></div>
          </div>
        </div>

        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
          <div className="flex items-center gap-2 mb-3"><span className="text-xl">📧</span><h4 className="text-base font-semibold text-teal-800">Send Tracking Details</h4></div>
          
          {emailError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {emailError}
            </div>
          )}
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-teal-700 mb-1">Customer Email</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter email"
              className="w-full p-2 border border-teal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          
          {emailSent && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 p-2 rounded-lg mb-3 text-sm">
              <span>✅</span> Email sent successfully!
            </div>
          )}
          
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !customerEmail}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${sendingEmail || !customerEmail ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {sendingEmail ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <span>📧</span> Send Email
              </>
            )}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button onClick={onClose} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Delivery Management Component
const DeliveryManagement = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(null);
  const [trackingDelivery, setTrackingDelivery] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [availableOrders, setAvailableOrders] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    orderId: '',
    customerName: '',
    customerEmail: '',
    address: '',
    scheduledDate: '',
    status: 'Pending',
    driver: { name: '' },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDriverChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      driver: { ...prev.driver, [name]: value },
    }));
  };

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) {
        navigate('/admin/login');
        return;
      }
      const response = await fetch(`${API_BASE_URL}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Deliveries fetch failed: ${await response.text()}`);
      const data = await response.json();
      setAllDeliveries(data);
      setDeliveries(data);
    } catch (err) {
      setError(`Failed to fetch deliveries: ${err.message}`);
      console.error('Error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
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

  const initializeData = async () => {
    setLoading(true);
    try {
      // Only fetch deliveries, don't create them automatically
      const deliveriesResponse = await fetch(`${API_BASE_URL}/deliveries`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (!deliveriesResponse.ok) {
        throw new Error(`Deliveries fetch failed: ${await deliveriesResponse.text()}`);
      }

      const deliveriesData = await deliveriesResponse.json();
      setDeliveries(deliveriesData);
      setAllDeliveries(deliveriesData);

      // Just fetch available orders for the dropdown, don't create deliveries
      const ordersResponse = await fetch(`${API_BASE_URL}/orders/admin`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const recentOrders = ordersData
          .filter((order) => order.status === 'Pending')
          .map(order => ({ _id: order._id, name: order.name }));
        
        setAvailableOrders(recentOrders);
      }

      setError(null);
    } catch (err) {
      setError(`Failed to initialize: ${err.message}`);
      console.error('Initialization Error:', err);
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, [navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let filtered = [...allDeliveries];
    if (debouncedQuery) {
      filtered = filtered.filter((delivery) =>
        (delivery.customerName || '').toLowerCase().includes(debouncedQuery) ||
        (delivery.customerEmail || '').toLowerCase().includes(debouncedQuery)
      );
    }
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === '7days') cutoff.setDate(now.getDate() - 7);
      else if (timeFilter === '30days') cutoff.setDate(now.getDate() - 30);
      filtered = filtered.filter((delivery) => new Date(delivery.scheduledDate) >= cutoff);
    }
    setDeliveries(filtered);
  }, [debouncedQuery, timeFilter, allDeliveries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.orderId || !formData.customerName || !formData.address || !formData.driver.name) {
      setError('Missing required fields: orderId, customerName, address, driver.name');
      return;
    }
    try {
      const method = editingDelivery ? 'PUT' : 'POST';
      const url = editingDelivery
        ? `${API_BASE_URL}/deliveries/${editingDelivery._id}`
        : `${API_BASE_URL}/deliveries`;

      const token = localStorage.getItem('adminToken');
      const payload = {
        ...formData,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : new Date().toISOString(),
        driver: formData.driver,
      };
      console.log('Submitting Delivery Data:', payload);
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Response:', errorText);
        throw new Error(`Failed to save: ${response.status} - ${errorText}`);
      }

      await fetchDeliveries();
      resetForm();
      setShowForm(false);

      setSuccess(editingDelivery ? 'Delivery updated successfully!' : 'Delivery added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save delivery: ${err.message}`);
      console.error('Save Error:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      orderId: '',
      customerName: '',
      customerEmail: '',
      address: '',
      scheduledDate: '',
      status: 'Pending',
      driver: { name: '' },
    });
    setEditingDelivery(null);
  };

  const handleEdit = (delivery) => {
    setFormData({
      orderId: delivery.orderId,
      customerName: delivery.customerName || '',
      customerEmail: delivery.customerEmail || '',
      address: delivery.address,
      scheduledDate: delivery.scheduledDate ? new Date(delivery.scheduledDate).toISOString().split('T')[0] : '',
      status: delivery.status,
      driver: { name: delivery.driver?.name || '' },
    });
    setEditingDelivery(delivery);
    setShowForm(true);
    setShowReports(false);
  };

  const handleConfirm = () => {
    confirmAction();
    setShowDeleteConfirm(false);
    setShowStatusConfirm(false);
  };

  const handleCancel = () => {
    setShowDeleteConfirm(false);
    setShowStatusConfirm(false);
    setConfirmAction(null);
  };

  const confirmDelete = (id) => {
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const url = `${API_BASE_URL}/deliveries/${id}`;
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
        }
        
        // Refresh the deliveries list
        await fetchDeliveries();
        setSuccess('Delivery deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Delete Error:', err);
        setError(`Failed to delete delivery: ${err.message}`);
      }
    });
    setShowDeleteConfirm(true);
  };

  const confirmStatusChange = (id, newStatus) => {
    setConfirmAction(() => async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await fetch(`${API_BASE_URL}/deliveries/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    });
    setShowStatusConfirm(true);
  };

  const handleDelete = (id) => {
    confirmDelete(id);
  };

  const handleStatusChange = (id, newStatus) => {
    confirmStatusChange(id, newStatus);
  };

  const handleTrackOrder = (delivery) => {
    setTrackingDelivery(delivery);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-lg text-gray-600">Loading deliveries...</span>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gray-50 font-sans">
        <AdminSidebar activePage="deliveries" />

        <main className="ml-64 w-full p-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
              <p className="text-sm text-gray-500">Manage and track all deliveries</p>
            </div>
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <button
                onClick={() => { setShowForm(!showForm); setShowReports(false); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-shadow shadow-md"
              >
                <FiPlus /> {showForm ? 'Close Form' : 'Assign Delivery'}
              </button>
              <div className="hidden md:block w-px h-8 bg-gray-200" />
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">Admin User</p>
                  <p className="text-xs text-gray-500">admin@dimalsha.com</p>
                </div>
                <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                  AU
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                  title="Log out"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="Search by customer name or email..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="p-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>
              </div>
            </div>
          </div>

          {showReports && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Reports Section</h3>
              <p className="text-gray-500">Reports functionality will be implemented here.</p>
            </div>
          )}

          {showForm && (
            <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {editingDelivery ? 'Edit Delivery' : 'Add New Delivery'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select an Order</option>
                  {availableOrders.map((order) => (
                    <option key={order._id} value={order._id}>{`ORD-${order._id.slice(-8)} (${order.name})`}</option>
                  ))}
                </select>
                <input
                  type="text"
                  name="customerName"
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="email"
                  name="customerEmail"
                  placeholder="Customer Email"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  name="address"
                  placeholder="Delivery Address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <input
                  type="text"
                  name="name"
                  placeholder="Driver Name"
                  value={formData.driver.name}
                  onChange={handleDriverChange}
                  className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <div className="md:col-span-2 flex justify-end gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-shadow"
                  >
                    {editingDelivery ? 'Update' : 'Add'} Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-shadow"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Delivery ID</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Address</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Scheduled Date</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left font-semibold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && (
                    [...Array(6)].map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-32 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-40 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-32 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-20 bg-gray-300 rounded" /></td>
                        <td className="px-6 py-3"><div className="h-4 w-24 bg-gray-300 rounded" /></td>
                      </tr>
                    ))
                  )}
                  {!loading && deliveries.length === 0 && (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                        No deliveries found. Try adjusting your search or date filter.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    deliveries.map((delivery) => (
                      <tr key={delivery._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{delivery.deliveryId}</td>
                        <td className="px-6 py-4 text-gray-700">{delivery.orderId}</td>
                        <td className="px-6 py-4 text-gray-700">{delivery.customerName || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-700">{delivery.customerEmail || 'Not provided'}</td>
                        <td className="px-6 py-4 text-gray-700">{delivery.address}</td>
                        <td className="px-6 py-4 text-gray-700">{delivery.driver?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-gray-700">{new Date(delivery.scheduledDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <select
                            value={delivery.status}
                            onChange={(e) => handleStatusChange(delivery._id, e.target.value)}
                            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTrackOrder(delivery)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg"
                              title="Track Order"
                            >
                              📍
                            </button>
                            <button
                              onClick={() => handleEdit(delivery)}
                              className="text-green-600 hover:bg-green-50 p-2 rounded-lg"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(delivery._id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-md hover:shadow-lg transition">
              <div className="text-2xl font-semibold text-gray-900">{deliveries.length}</div>
              <div className="text-xs text-gray-500 uppercase">Total Deliveries</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-md hover:shadow-lg transition">
              <div className="text-2xl font-semibold text-yellow-600">{deliveries.filter(d => d.status === 'Pending').length}</div>
              <div className="text-xs text-gray-500 uppercase">Pending</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-md hover:shadow-lg transition">
              <div className="text-2xl font-semibold text-orange-600">{deliveries.filter(d => d.status === 'In Progress').length}</div>
              <div className="text-xs text-gray-500 uppercase">In Progress</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-md hover:shadow-lg transition">
              <div className="text-2xl font-semibold text-green-600">{deliveries.filter(d => d.status === 'Delivered').length}</div>
              <div className="text-xs text-gray-500 uppercase">Delivered</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-md hover:shadow-lg transition">
              <div className="text-2xl font-semibold text-red-600">{deliveries.filter(d => d.status === 'Cancelled').length}</div>
              <div className="text-xs text-gray-500 uppercase">Cancelled</div>
            </div>
          </div>

          {trackingDelivery && (
            <TrackingModal
              delivery={trackingDelivery}
              onClose={() => setTrackingDelivery(null)}
            />
          )}
          {showDeleteConfirm && (
            <ConfirmationModal
              title="Confirm Deletion"
              message="Are you sure you want to delete this delivery? This action cannot be undone."
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}
          {showStatusConfirm && (
            <ConfirmationModal
              title="Confirm Status Change"
              message="Are you sure you want to change the delivery status?"
              onConfirm={handleConfirm}
              onCancel={handleCancel}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default DeliveryManagement;