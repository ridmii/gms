import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { FiSearch, FiLogOut, FiPlus } from 'react-icons/fi';

// ---------- Error Boundary ----------
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-500 mt-2">Error: {this.state.error?.message || 'Unexpected error'}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
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

// ---------- Small helpers ----------
const formatOrderId = (id) => (id ? `ORD-${id.slice(-8)}` : '—');
const cardClass =
  'rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow';

// ---------- Main Component ----------
const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [editOrder, setEditOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // New order state
  const [newOrder, setNewOrder] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    material: 'Cotton',
    quantity: 30,
    artworkFile: null,
    artworkText: '',
    needsArtwork: false,
  });

  // ---------- Auth + Polling ----------
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersResponse = await axios.get('http://localhost:5000/api/orders/admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setOrders(data);
        setFilteredOrders(data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch orders. Please log in again.');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  // ---------- Debounce search ----------
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ---------- Filter & Search ----------
  useEffect(() => {
    let filtered = orders || [];

    if (debouncedQuery) {
      filtered = filtered.filter((order) => {
        const idMatch = order._id?.slice(-8).toLowerCase().includes(debouncedQuery);
        const nameMatch = order.name?.toLowerCase().includes(debouncedQuery);
        const emailMatch = order.email?.toLowerCase().includes(debouncedQuery);
        const mobileMatch = order.mobile?.toLowerCase().includes(debouncedQuery);
        return idMatch || nameMatch || emailMatch || mobileMatch;
      });
    }

    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === '7days') cutoff.setDate(now.getDate() - 7);
      else if (timeFilter === '30days') cutoff.setDate(now.getDate() - 30);
      filtered = filtered.filter((order) => new Date(order.date) >= cutoff);
    }

    setFilteredOrders(filtered);
  }, [debouncedQuery, timeFilter, orders]);

  // ---------- Actions ----------
  const handleDownload = async (orderId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download invoice.');
    }
  };

  const handleEdit = (order) => {
    setEditOrder({
      ...order,
      artworkFile: null,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editOrder.name || !editOrder.email || !editOrder.mobile || !editOrder.material || !editOrder.quantity) {
      setError('All required fields must be filled.');
      return;
    }

    const qty = parseInt(editOrder.quantity, 10);
    const unitPrice = qty > 30 ? 1500 : 2000;
    const artworkFee = editOrder.artwork ? 5000 : 0;
    const subtotal = qty * unitPrice;
    const total = subtotal + artworkFee;
    const advance = Math.round(total * 0.5);
    const balance = total - advance;
    const priceDetails = JSON.stringify({ unitPrice, subtotal, artworkFee, total, advance, balance });

    const formDataToSend = new FormData();
    formDataToSend.append('name', editOrder.name);
    formDataToSend.append('email', editOrder.email);
    formDataToSend.append('mobile', editOrder.mobile);
    formDataToSend.append('address', editOrder.address || '');
    formDataToSend.append('material', editOrder.material);
    formDataToSend.append('quantity', editOrder.quantity);
    formDataToSend.append('artwork', editOrder.artwork);
    formDataToSend.append('artworkText', editOrder.artworkText || '');
    formDataToSend.append('priceDetails', priceDetails);
    if (editOrder.artworkFile) formDataToSend.append('artworkFile', editOrder.artworkFile);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `http://localhost:5000/api/orders/${editOrder._id}`,
        formDataToSend,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      setOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? { ...editOrder, ...response.data } : order))
      );
      setFilteredOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? { ...editOrder, ...response.data } : order))
      );
      setEditOrder(null);
      setToastMessage('Order updated successfully');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Edit Error:', err.response?.data);
      setError(`Failed to update order. ${err.response?.data?.message || 'Please check server logs.'}`);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/orders/${deleteConfirm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) => prev.filter((order) => order._id !== deleteConfirm));
      setFilteredOrders((prev) => prev.filter((order) => order._id !== deleteConfirm));
      setDeleteConfirm(null);
      setToastMessage('Order deleted successfully');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      setError('Failed to delete order.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleNewOrderChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setNewOrder((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? checked
        : type === 'file' ? files[0]
        : value,
    }));
  };

  const handleNewOrderSubmit = async (e) => {
    e.preventDefault();
    if (!newOrder.name || !newOrder.email || !newOrder.mobile || !newOrder.material || !newOrder.quantity) {
      setError('All required fields must be filled.');
      return;
    }

    const formData = new FormData();
    formData.append('name', newOrder.name);
    formData.append('email', newOrder.email);
    formData.append('mobile', newOrder.mobile);
    formData.append('address', newOrder.address || '');
    formData.append('material', newOrder.material);
    formData.append('quantity', newOrder.quantity);
    formData.append('artwork', newOrder.needsArtwork);
    formData.append('artworkText', newOrder.artworkText || '');
    if (newOrder.artworkFile) formData.append('artworkFile', newOrder.artworkFile);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newOrderData = response.data;

      const deliveryData = {
        deliveryId: `DEL-${newOrderData._id.slice(-8)}`,
        orderId: newOrderData._id,
        customerName: newOrderData.name,
        customerEmail: newOrderData.email,
        address: newOrderData.address || 'Not specified',
        driver: {
          employeeNumber: 'EMP001',
          name: 'Default Driver',
        },
        assignedTo: 'Default Driver',
        scheduledDate: new Date().toISOString(),
        status: 'Pending',
      };
      console.log('Sending Delivery Data:', deliveryData);
      const deliveryResponse = await axios.post('http://localhost:5000/api/deliveries', deliveryData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      console.log('Delivery Creation Response:', deliveryResponse.data);

      setOrders((prev) => [newOrderData, ...prev]);
      setFilteredOrders((prev) => [newOrderData, ...prev]);
      setNewOrderForm(false);
      setNewOrder({
        name: '',
        email: '',
        mobile: '',
        address: '',
        material: 'Cotton',
        quantity: 30,
        artworkFile: null,
        artworkText: '',
        needsArtwork: false,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setToastMessage('New order created successfully');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Create Error:', err.response?.data || err.message);
      setError(`Failed to create order or delivery. ${err.response?.data?.message || err.message}`);
    }
  };

  useEffect(() => {
    if (editOrder || newOrderForm || deleteConfirm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [editOrder, newOrderForm, deleteConfirm]);

  // Sync order status with delivery status
  useEffect(() => {
    const syncOrderStatus = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      try {
        const deliveriesResponse = await axios.get('http://localhost:5000/api/deliveries', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const deliveries = deliveriesResponse.data;

        const updatedOrders = orders.map((order) => {
          const delivery = deliveries.find((d) => d.orderId === order._id);
          if (delivery) {
            const newStatus = delivery.status === 'Delivered' ? 'Delivered' : order.status;
            if (newStatus !== order.status) {
              axios.put(
                `http://localhost:5000/api/orders/${order._id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
              ).catch((err) => console.error('Status sync error:', err));
            }
            return { ...order, status: newStatus };
          }
          return order;
        });

        if (JSON.stringify(updatedOrders) !== JSON.stringify(orders)) {
          setOrders(updatedOrders);
          setFilteredOrders(updatedOrders);
        }
      } catch (err) {
        console.error('Failed to sync order status:', err);
      }
    };

    syncOrderStatus();
    const interval = setInterval(syncOrderStatus, 5000); // Sync every 5 seconds
    return () => clearInterval(interval);
  }, [orders]);

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order._id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    setFilteredOrders(updatedOrders);
  };

  // ---------- Derived quick stats ----------
  const totalOrders = filteredOrders.length;
  const today = new Date('2025-08-28T10:15:00+0530'); // Current date and time
  const todayOrders = filteredOrders.filter((o) => new Date(o.date).toDateString() === today.toDateString()).length;
  const pendingOrders = filteredOrders.filter((o) => (o.status || 'Pending') === 'Pending').length;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gray-50 font-inter">
        <AdminSidebar activePage="orders" />

        {/* Main Content */}
        <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
          {/* Top header bar */}
          <div className="flex justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">Manage and track all customer orders</p>
            </div>
            <div className="flex items-center gap-3">
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
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    navigate('/admin/login');
                  }}
                  className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:text-red-600 hover:border-red-200"
                  title="Log out"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick stats with colors */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Total Orders */}
            <div className="bg-blue-100 text-blue-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <img src="/receipt.png" alt="Total Orders" className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-center">Total Orders</h2>
              <p className="text-3xl font-bold text-center">{totalOrders}</p>
            </div>

            {/* Today */}
            <div className="bg-green-100 text-green-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <img src="/calendar.png" alt="Today Orders" className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-center">Today</h2>
              <p className="text-3xl font-bold text-center">{todayOrders}</p>
            </div>

            {/* Pending */}
            <div className="bg-yellow-100 text-yellow-800 p-6 rounded-2xl shadow-lg hover:shadow-xl transition">
              <img src="/document.png" alt="Pending Orders" className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-center">Pending</h2>
              <p className="text-3xl font-bold text-center">{pendingOrders}</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className={`${cardClass} p-4 mb-6`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="Search by order ID, factory name, email, or mobile..."
                  className="pl-10 pr-4 py-2 w-full rounded-xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Time filter */}
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

          {/* Errors */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Orders Table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="sticky top-0 bg-gray-100/70 backdrop-blur text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Order</th>
                    <th className="px-4 py-3 text-left font-semibold">Factory Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Mobile</th>
                    <th className="px-4 py-3 text-left font-semibold">Product</th>
                    <th className="px-4 py-3 text-left font-semibold">Qty</th>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{formatOrderId(order._id)}</td>
                      <td className="px-4 py-3 text-gray-700">{order.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{order.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{order.mobile || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{order.material || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">{order.quantity || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.date ? new Date(order.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleDownload(order._id)}
                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => handleEdit(order)}
                            className="rounded-lg bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(order._id)}
                            className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --------- Modals & Toasts --------- */}
          <AnimatePresence>
            {/* Edit Modal */}
            {editOrder && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditOrder(null)}
              >
                <motion.div
                  className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.96, y: 12 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.96, y: 12 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Order</h2>
                  <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-sm text-gray-600">Factory Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={editOrder.name || ''}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, name: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={editOrder.email || ''}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, email: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Mobile Number *</label>
                      <input
                        type="tel"
                        name="mobile"
                        value={editOrder.mobile || ''}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, mobile: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Material *</label>
                      <select
                        name="material"
                        value={editOrder.material || 'Cotton'}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, material: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Cotton">Cotton</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Linen">Linen</option>
                        <option value="Silk">Silk</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={editOrder.quantity || 30}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, quantity: e.target.value }))}
                        required
                        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Artwork toggle */}
                    <div className="md:col-span-2 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="editArtwork"
                        name="artwork"
                        checked={!!editOrder.artwork}
                        onChange={(e) => setEditOrder((prev) => ({ ...prev, artwork: e.target.checked }))}
                        className="h-4 w-4 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                      />
                      <label htmlFor="editArtwork" className="text-sm text-gray-700">
                        Include custom artwork (+LKR 5,000)
                      </label>
                    </div>

                    {editOrder.artwork && (
                      <>
                        <div>
                          <label className="text-sm text-gray-600">Upload Artwork File</label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) =>
                              setEditOrder((prev) => ({ ...prev, artworkFile: e.target.files[0] }))
                            }
                            accept="image/*,.pdf,.ai,.eps"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm text-gray-600">Artwork Description</label>
                          <textarea
                            name="artworkText"
                            value={editOrder.artworkText || ''}
                            onChange={(e) => setEditOrder((prev) => ({ ...prev, artworkText: e.target.value }))}
                            placeholder="Describe your artwork requirements..."
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                          />
                        </div>
                      </>
                    )}

                    <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditOrder(null)}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md"
                  initial={{ scale: 0.96, y: 12 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.96, y: 12 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete order?</h2>
                  <p className="mb-6 text-gray-600">
                    This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
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
                </motion.div>
              </motion.div>
            )}
            {/* Toast */}
            {toastMessage && (
              <motion.div
                className="fixed bottom-6 right-6 rounded-xl bg-green-600 text-white px-4 py-3 shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default OrderDashboard;