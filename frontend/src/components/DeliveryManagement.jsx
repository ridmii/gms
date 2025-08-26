import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { FiSearch, FiLogOut, FiPlus } from 'react-icons/fi';

const API_BASE_URL = 'http://localhost:5000/api';

// Tracking Modal Component
const TrackingModal = ({ delivery, onClose }) => {
  const [customerEmail, setCustomerEmail] = useState(delivery?.customerEmail || '');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return '#d69e2e';
      case 'In Progress':
        return '#f6ad55';
      case 'Delivered':
        return '#38a169';
      case 'Cancelled':
        return '#e53e3e';
      default:
        return '#718096';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return '⏳';
      case 'In Progress':
        return '🚛';
      case 'Delivered':
        return '✅';
      case 'Cancelled':
        return '❌';
      default:
        return '📦';
    }
  };

  const handleSendEmail = async (deliveryId, customerEmail, trackingDetails) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/send-tracking-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deliveryId, customerEmail, trackingDetails: 'Tracking details here' }), // Placeholder tracking details
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    } catch (error) {
      console.error('Email sending error:', error);
      // Handle error display (e.g., via parent component state)
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
        position: 'relative',
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          borderBottom: '1px solid #e2e8f0',
          paddingBottom: '16px',
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a202c', margin: '0' }}>
            📍 Order Tracking
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#718096',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f7fafc'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        <div style={{
          backgroundColor: '#f7fafc',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          border: '1px solid #e2e8f0',
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px', 
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📦 Order Details
          </h3>
          
          <div style={{ display: 'grid', gap: '12px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Order ID:</span>
              <span style={{ color: '#2d3748' }}>{delivery.orderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Delivery ID:</span>
              <span style={{ color: '#2d3748' }}>{delivery.deliveryId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Customer Name:</span> {/* Changed to customerName */}
              <span style={{ color: '#2d3748' }}>{delivery.customerName || 'N/A'}</span> {/* Changed to customerName */}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Current Status:</span>
              <span style={{ 
                color: getStatusColor(delivery.status),
                fontWeight: '600',
                backgroundColor: getStatusColor(delivery.status) + '20',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '13px',
              }}>
                {getStatusIcon(delivery.status)} {delivery.status}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Assigned To:</span>
              <span style={{ color: '#2d3748' }}>{delivery.assignedTo}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '600', color: '#4a5568' }}>Scheduled Date:</span>
              <span style={{ color: '#2d3748' }}>{new Date(delivery.scheduledDate).toLocaleDateString()}</span>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: '600', color: '#4a5568', display: 'block', marginBottom: '4px' }}>Delivery Address:</span>
              <span style={{ color: '#2d3748' }}>{delivery.address}</span>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#e6fffa',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #81e6d9',
          marginBottom: '20px',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '16px', 
          }}>
            <span style={{ fontSize: '18px' }}>📧</span>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              color: '#234e52',
              margin: '0',
            }}>
              Send Order Details to Customer
            </h4>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#234e52',
              marginBottom: '8px', 
            }}>
              Customer Email Address:
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Enter customer email"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #b2f5ea',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#319795'}
              onBlur={(e) => e.target.style.borderColor = '#b2f5ea'}
            />
          </div>

          {emailSent && (
            <div style={{
              backgroundColor: '#c6f6d5',
              border: '1px solid #9ae6b4',
              color: '#2f855a',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontWeight: '500',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>✅</span>
              Email sent successfully to customer!
            </div>
          )}

          <button
            onClick={() => handleSendEmail(delivery.deliveryId, customerEmail, 'Tracking details here')}
            disabled={sendingEmail || !customerEmail}
            style={{
              backgroundColor: sendingEmail || !customerEmail ? '#a0aec0' : '#319795',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: sendingEmail || !customerEmail ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              if (!sendingEmail && customerEmail) {
                e.target.style.backgroundColor = '#2c7a7b';
              }
            }}
            onMouseOut={(e) => {
              if (!sendingEmail && customerEmail) {
                e.target.style.backgroundColor = '#319795';
              }
            }}
          >
            {sendingEmail ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}></div>
                Sending...
              </>
            ) : (
              <>
                <span>📧</span>
                Send Email to Customer
              </>
            )}
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#718096',
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4a5568'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#718096'}
          >
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
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryId: '',
    orderId: '',
    customerName: '', // Changed from customer to customerName
    customerEmail: '',
    address: '',
    assignedTo: '',
    scheduledDate: '',
    status: 'Pending',
  });

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

  // Initialize deliveries from recent orders on first load
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const initializeDeliveries = async () => {
      setLoading(true);
      try {
        const [deliveriesResponse, ordersResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/deliveries`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/orders/admin`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!deliveriesResponse.ok) throw new Error(`Deliveries fetch failed: ${await deliveriesResponse.text()}`);
        if (!ordersResponse.ok) throw new Error(`Orders fetch failed: ${await ordersResponse.text()}`);

        const deliveriesData = await deliveriesResponse.json();
        const ordersData = await ordersResponse.json();

        // Limit to 12 most recent orders, sorted by date
        const recentOrders = ordersData
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 12)
          .filter((order) => order.status === 'Pending');

        setDeliveries(deliveriesData);

        // Create deliveries for pending orders not already in deliveries
        for (const order of recentOrders) {
          const existingDelivery = deliveriesData.find((d) => d.orderId === order._id.toString());
          if (!existingDelivery) {
            const deliveryData = {
              deliveryId: `DEL-${order._id.toString().slice(-8)}`, // Ensure _id is string
              orderId: order._id.toString(),
              customerName: order.name,
              customerEmail: order.email,
              address: order.address || 'Not specified',
              driver: {
                employeeNumber: 'EMP001',
                name: 'Default Driver',
              },
              assignedTo: 'Default Driver',
              scheduledDate: new Date().toISOString(),
              status: 'Pending',
            };
            const response = await fetch(`${API_BASE_URL}/deliveries`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(deliveryData),
            });
            if (!response.ok) {
              console.error(`Failed to create delivery for order ${order._id}:`, await response.text());
            }
          }
        }

        fetchDeliveries(); // Refresh after potential creations
        setError(null);
      } catch (err) {
        setError(`Failed to initialize: ${err.message}`);
        console.error('Initialization Error:', err);
      } finally {
      setLoading(false);
    }
  };

    initializeDeliveries();
  }, [navigate]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let filtered = deliveries || [];
    if (debouncedQuery) {
      filtered = filtered.filter((delivery) =>
        delivery.deliveryId.toLowerCase().includes(debouncedQuery) ||
        delivery.orderId.toLowerCase().includes(debouncedQuery) ||
        (delivery.customerName || '').toLowerCase().includes(debouncedQuery) || // Changed to customerName
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
  }, [debouncedQuery, timeFilter, deliveries]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingDelivery ? 'PUT' : 'POST';
      const url = editingDelivery
        ? `${API_BASE_URL}/deliveries/${editingDelivery._id}`
        : `${API_BASE_URL}/deliveries`;

      const token = localStorage.getItem('adminToken');
      const payload = {
        ...formData,
        scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : new Date().toISOString(),
      };
      console.log('Submitting Delivery Data:', payload);
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server Response:', errorText);
        throw new Error(`Failed to save: ${response.status} - ${errorText}`);
      }

      fetchDeliveries();
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
      deliveryId: '',
      orderId: '',
      customerName: '', // Changed from customer to customerName
      customerEmail: '',
      address: '',
      assignedTo: '',
      scheduledDate: '',
      status: 'Pending',
    });
    setEditingDelivery(null);
  };

  const handleEdit = (delivery) => {
    setFormData({
      deliveryId: delivery.deliveryId,
      orderId: delivery.orderId,
      customerName: delivery.customerName || '', // Changed to customerName
      customerEmail: delivery.customerEmail || '',
      address: delivery.address,
      assignedTo: delivery.assignedTo,
      scheduledDate: delivery.scheduledDate
        ? new Date(delivery.scheduledDate).toISOString().split('T')[0]
        : '',
      status: delivery.status,
    });
    setEditingDelivery(delivery);
    setShowForm(true);
    setShowReports(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        const token = localStorage.getItem('adminToken');
        const url = `${API_BASE_URL}/deliveries/${id}`;
        console.log('DELETE Request URL:', url, 'Token:', token);
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Response Status:', response.status, 'Response OK:', response.ok);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to delete: ${response.status} - ${errorText}`);
        }
        fetchDeliveries();
        setSuccess('Delivery deleted successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Delete Error:', err);
        setError(`Failed to delete delivery: ${err.message}`);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/deliveries/${id}/status`, {
        method: 'PATCH',
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

  const handleTrackOrder = (delivery) => {
    setTrackingDelivery(delivery);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #3182ce',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}></div>
          <span style={{ fontSize: '16px', color: '#4a5568' }}>Loading deliveries...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 font-inter">
      <AdminSidebar activePage="deliveries" />

      <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Deliveries</h1>
            <p className="text-sm text-gray-500">Manage and track all deliveries</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowReports(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              <FiPlus /> {showForm ? 'Close Form' : 'Assign Delivery'}
            </button>
            <div className="hidden md:block h-8 w-px bg-gray-200" />
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
                className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-red-600 hover:border-red-200"
                title="Log out"
              >
                <FiLogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {success && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search by delivery ID, order ID, customer name, or email..."
                className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {showReports && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Reports Section</h3>
            <p className="text-gray-500">Reports functionality will be implemented here.</p>
          </div>
        )}

        {showForm && (
          <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {editingDelivery ? 'Edit Delivery' : 'Add New Delivery'}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                name="deliveryId" 
                placeholder="Delivery ID" 
                value={formData.deliveryId} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <input 
                type="text" 
                name="orderId" 
                placeholder="Order ID" 
                value={formData.orderId} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <input 
                type="text" 
                name="customerName" 
                placeholder="Customer Name" 
                value={formData.customerName} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <input 
                type="email" 
                name="customerEmail" 
                placeholder="Customer Email" 
                value={formData.customerEmail} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input 
                type="text" 
                name="address" 
                placeholder="Delivery Address" 
                value={formData.address} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <input 
                type="text" 
                name="assignedTo" 
                placeholder="Assigned To" 
                value={formData.assignedTo} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <input 
                type="date" 
                name="scheduledDate" 
                value={formData.scheduledDate} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required 
              />
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                className="p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700"
                >
                  {editingDelivery ? 'Update' : 'Add'} Delivery
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); resetForm(); }} 
                  className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
  <div className="overflow-x-auto">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100/70 backdrop-blur text-gray-600">
        <tr><th className="px-4 py-3 text-left font-semibold">Delivery ID</th><th className="px-4 py-3 text-left font-semibold">Order ID</th><th className="px-4 py-3 text-left font-semibold">Customer Name</th><th className="px-4 py-3 text-left font-semibold">Email</th><th className="px-4 py-3 text-left font-semibold">Address</th><th className="px-4 py-3 text-left font-semibold">Assigned To</th><th className="px-4 py-3 text-left font-semibold">Scheduled Date</th><th className="px-4 py-3 text-left font-semibold">Status</th><th className="px-4 py-3 text-left font-semibold">Actions</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {loading && (
          [...Array(6)].map((_, i) => (
            <tr key={`skeleton-${i}`} className="animate-pulse">
              <td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-40 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-32 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-20 bg-gray-200 rounded" /></td><td className="px-4 py-3"><div className="h-4 w-24 bg-gray-200 rounded" /></td>
            </tr>
          ))
        )}
        {!loading && deliveries.length === 0 && (
          <tr>
            <td colSpan="9" className="px-4 py-10 text-center text-gray-500">
              No deliveries found. Try adjusting your search or date filter.
            </td>
          </tr>
        )}
        {!loading &&
          deliveries.map((delivery) => (
            <tr key={delivery._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{delivery.deliveryId}</td><td className="px-4 py-3 text-gray-700">{delivery.orderId}</td><td className="px-4 py-3 text-gray-700">{delivery.customerName || 'N/A'}</td><td className="px-4 py-3 text-gray-700">{delivery.customerEmail || 'Not provided'}</td><td className="px-4 py-3 text-gray-700">{delivery.address}</td><td className="px-4 py-3 text-gray-700">{delivery.assignedTo}</td><td className="px-4 py-3 text-gray-700">{new Date(delivery.scheduledDate).toLocaleDateString()}</td><td className="px-4 py-3">
                <select value={delivery.status} onChange={(e) => handleStatusChange(delivery._id, e.target.value)} className="p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                </select>
              </td><td className="px-4 py-3">
                <div className="flex gap-2">
                  <button onClick={() => handleTrackOrder(delivery)} className="text-blue-600 hover:bg-blue-50 p-1 rounded-lg" title="Track Order">📍 Track</button><button onClick={() => handleEdit(delivery)} className="text-blue-600 hover:bg-blue-50 p-1 rounded-lg">Edit</button><button onClick={() => handleDelete(delivery._id)} className="text-red-600 hover:bg-red-50 p-1 rounded-lg">Delete</button>
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
</div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mt-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-gray-900">{deliveries.length}</div>
            <div className="text-xs text-gray-500 uppercase">Total Deliveries</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-yellow-600">{deliveries.filter(d => d.status === 'Pending').length}</div>
            <div className="text-xs text-gray-500 uppercase">Pending</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-orange-600">{deliveries.filter(d => d.status === 'In Progress').length}</div>
            <div className="text-xs text-gray-500 uppercase">In Progress</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-semibold text-green-600">{deliveries.filter(d => d.status === 'Delivered').length}</div>
            <div className="text-xs text-gray-500 uppercase">Delivered</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
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

export default DeliveryManagement;