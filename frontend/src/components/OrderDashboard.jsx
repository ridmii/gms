import React, { useState, useEffect, useRef, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';
import { FiSearch, FiLogOut, FiPlus } from 'react-icons/fi';

// Error Boundary Component
class ErrorBoundary extends Component {
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
            <p className="text-gray-500 mt-2">Error: {this.state.error.message}</p>
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

const OrderDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [editOrder, setEditOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [newOrderForm, setNewOrderForm] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

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
        setOrders(ordersResponse.data || []);
        setFilteredOrders(ordersResponse.data || []);
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
  }, [navigate]);

  useEffect(() => {
    let filtered = orders || [];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = (orders || []).filter(
        (order) =>
          order._id?.slice(-8).toLowerCase().includes(query) ||
          order.factoryName?.toLowerCase().includes(query) ||
          order.email?.toLowerCase().includes(query) ||
          order.mobile?.toLowerCase().includes(query)
      );
    }
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === '7days') cutoff.setDate(now.getDate() - 7);
      else if (timeFilter === '30days') cutoff.setDate(now.getDate() - 30);
      filtered = filtered.filter((order) => new Date(order.date) >= cutoff);
    }
    setFilteredOrders(filtered);
  }, [searchQuery, timeFilter, orders]);

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
    if (!editOrder.factoryName || !editOrder.email || !editOrder.mobile || !editOrder.material || !editOrder.quantity) {
      setError('All required fields must be filled.');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('factoryName', editOrder.name);
    formDataToSend.append('email', editOrder.email);
    formDataToSend.append('mobile', editOrder.mobile);
    formDataToSend.append('material', editOrder.material);
    formDataToSend.append('quantity', editOrder.quantity);
    formDataToSend.append('needsArtwork', editOrder.needsArtwork);
    if (editOrder.artworkFile) formDataToSend.append('artworkFile', editOrder.artworkFile);
    if (editOrder.artworkText) formDataToSend.append('artworkText', editOrder.artworkText);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`http://localhost:5000/api/orders/${editOrder._id}`, formDataToSend, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? { ...editOrder, ...response.data } : order))
      );
      setFilteredOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? { ...editOrder, ...response.data } : order))
      );
      setEditOrder(null);
      setToastMessage('Order updated successfully');
      setTimeout(() => setToastMessage(null), 5000);
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
      setTimeout(() => setToastMessage(null), 5000);
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
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const handleNewOrderSubmit = async (e) => {
    e.preventDefault();
    if (!newOrder.factoryName || !newOrder.email || !newOrder.mobile || !newOrder.material || !newOrder.quantity) {
      setError('All required fields must be filled.');
      return;
    }

    const formData = new FormData();
    formData.append('factoryName', newOrder.name);
    formData.append('email', newOrder.email);
    formData.append('mobile', newOrder.mobile);
    formData.append('material', newOrder.material);
    formData.append('quantity', newOrder.quantity);
    formData.append('needsArtwork', newOrder.needsArtwork);
    if (newOrder.artworkFile) formData.append('artworkFile', newOrder.artworkFile);
    if (newOrder.artworkText) formData.append('artworkText', newOrder.artworkText);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      const newOrderData = response.data;
      setOrders((prev) => [...prev, newOrderData]);
      setFilteredOrders((prev) => [...prev, newOrderData]);
      setNewOrderForm(false);
      setNewOrder({
        factoryName: '',
        email: '',
        mobile: '',
        material: 'Cotton',
        quantity: 30,
        artworkFile: null,
        artworkText: '',
        needsArtwork: false,
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setToastMessage('New order created successfully');
      setTimeout(() => setToastMessage(null), 5000);
      await fetchData();
    } catch (err) {
      console.error('Create Error:', err.response?.data);
      setError(`Failed to create order. ${err.response?.data?.message || 'Please check server logs.'}`);
    }
  };

  const [newOrder, setNewOrder] = useState({
    factoryName: '',
    email: '',
    mobile: '',
    material: 'Cotton',
    quantity: 30,
    artworkFile: null,
    artworkText: '',
    needsArtwork: false,
  });

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

  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order._id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    setFilteredOrders(updatedOrders);
  };

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    try {
      const ordersResponse = await axios.get('http://localhost:5000/api/orders/admin', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(ordersResponse.data || []);
      setFilteredOrders(ordersResponse.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to refresh orders.');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex bg-gray-100 font-inter animate-fadeIn">
        <AdminSidebar activePage="orders" />

        {/* Main Content */}
        <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
          {/* Header Top Bar */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Order Dashboard</h1>
              <p className="text-sm text-gray-500">Manage and track all orders</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">admin@dimalsha.com</p>
              </div>
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                AU
              </div>
              <FiLogOut
                className="text-gray-500 hover:text-red-500 cursor-pointer"
                size={18}
                onClick={handleLogout}
              />
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              {/* Search */}
              <div className="relative w-full md:w-1/2">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiSearch />
                </span>
                <input
                  type="text"
                  placeholder="Search by order ID, factory name, email, or mobile..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter + Button */}
              <div className="flex items-center gap-4">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 transition"
                >
                  <option value="all">All Time</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                </select>

                <button
                  onClick={() => setNewOrderForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all shadow-md hover:scale-105"
                >
                  <FiPlus /> New Order
                </button>
              </div>
            </div>

            {/* Order Table */}
            {error && <div className="text-red-500">{error}</div>}
            {loading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center text-gray-500">No orders found.</div>
            ) : (
              <div className="overflow-x-auto transition">
                <table className="min-w-full text-sm bg-white border border-gray-200 rounded-md">
                  <thead className="bg-gray-100 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order ID</th>
                      <th className="px-4 py-3 font-semibold">Factory Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Mobile</th>
                      <th className="px-4 py-3 font-semibold">Product</th>
                      <th className="px-4 py-3 font-semibold">Quantity</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-all">
                        <td className="px-4 py-3 font-medium">ORD-{order._id.slice(-8)}</td>
                        <td className="px-4 py-3">{order.name || 'N/A'}</td>
                        <td className="px-4 py-3">{order.email || 'N/A'}</td>
                        <td className="px-4 py-3">{order.mobile || 'N/A'}</td>
                        <td className="px-4 py-3">{order.material || 'N/A'}</td>
                        <td className="px-4 py-3">{order.quantity || 'N/A'}</td>
                        <td className="px-4 py-3">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status || 'Pending'}
                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                            className="p-1 border border-gray-300 rounded-md text-sm transition bg-white"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            onClick={() => handleDownload(order._id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition duration-300"
                          >
                            Invoice
                          </button>
                          <button
                            onClick={() => handleEdit(order)}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition duration-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(order._id)}
                            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <AnimatePresence>
            {editOrder && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditOrder(null)}
              >
                <motion.div
                  className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.9, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 50 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Order</h2>
                  <form onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Factory Name *
                      </label>
                      <input
                        type="text"
                        name="factoryName"
                        value={editOrder.factoryName || ''}
                        onChange={(e) =>
                          setEditOrder((prev) => ({ ...prev, factoryName: e.target.value }))
                        }
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editOrder.email || ''}
                        onChange={(e) =>
                          setEditOrder((prev) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={editOrder.mobile || ''}
                        onChange={(e) =>
                          setEditOrder((prev) => ({ ...prev, mobile: e.target.value }))
                        }
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material *
                      </label>
                      <select
                        name="material"
                        value={editOrder.material || 'Cotton'}
                        onChange={(e) =>
                          setEditOrder((prev) => ({ ...prev, material: e.target.value }))
                        }
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cotton">Cotton</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Linen">Linen</option>
                        <option value="Silk">Silk</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={editOrder.quantity || 30}
                        onChange={(e) =>
                          setEditOrder((prev) => ({ ...prev, quantity: e.target.value }))
                        }
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="needsArtwork"
                          name="needsArtwork"
                          checked={editOrder.needsArtwork || false}
                          onChange={(e) =>
                            setEditOrder((prev) => ({
                              ...prev,
                              needsArtwork: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="needsArtwork"
                          className="text-sm font-medium text-gray-700"
                        >
                          Include custom artwork (+LKR 5,000)
                        </label>
                      </div>
                    </div>
                    {editOrder.needsArtwork && (
                      <>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Artwork File
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) =>
                              setEditOrder((prev) => ({
                                ...prev,
                                artworkFile: e.target.files[0],
                              }))
                            }
                            accept="image/*,.pdf,.ai,.eps"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="form-group col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Artwork Description
                          </label>
                          <textarea
                            name="artworkText"
                            value={editOrder.artworkText || ''}
                            onChange={(e) =>
                              setEditOrder((prev) => ({
                                ...prev,
                                artworkText: e.target.value,
                              }))
                            }
                            placeholder="Describe your artwork requirements..."
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group col-span-2 flex justify-end gap-4 mt-6">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditOrder(null)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
            {deleteConfirm && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md"
                  initial={{ scale: 0.9, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 50 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Confirm Deletion</h2>
                  <p className="mb-6 text-gray-600">Are you sure you want to delete this order?</p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
            {newOrderForm && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setNewOrderForm(false)}
              >
                <motion.div
                  className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.9, y: 50 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 50 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">New Order</h2>
                  <form
                    onSubmit={handleNewOrderSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Factory Name *
                      </label>
                      <input
                        type="text"
                        name="factoryName"
                        value={newOrder.factoryName}
                        onChange={handleNewOrderChange}
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={newOrder.email}
                        onChange={handleNewOrderChange}
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={newOrder.mobile}
                        onChange={handleNewOrderChange}
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Material *
                      </label>
                      <select
                        name="material"
                        value={newOrder.material}
                        onChange={handleNewOrderChange}
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Cotton">Cotton</option>
                        <option value="Polyester">Polyester</option>
                        <option value="Linen">Linen</option>
                        <option value="Silk">Silk</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        value={newOrder.quantity}
                        onChange={handleNewOrderChange}
                        required
                        className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="form-group col-span-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="needsArtwork"
                          name="needsArtwork"
                          checked={newOrder.needsArtwork}
                          onChange={handleNewOrderChange}
                          className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <label
                          htmlFor="needsArtwork"
                          className="text-sm font-medium text-gray-700"
                        >
                          Include custom artwork (+LKR 5,000)
                        </label>
                      </div>
                    </div>
                    {newOrder.needsArtwork && (
                      <>
                        <div className="form-group">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Upload Artwork File
                          </label>
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleNewOrderChange}
                            accept="image/*,.pdf,.ai,.eps"
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="form-group col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Artwork Description
                          </label>
                          <textarea
                            name="artworkText"
                            value={newOrder.artworkText}
                            onChange={handleNewOrderChange}
                            placeholder="Describe your artwork requirements..."
                            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group col-span-2 flex justify-end gap-4 mt-6">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOrderForm(false)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
                      >
                        Back
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
            {toastMessage && (
              <motion.div
                className="fixed bottom-6 right-6 bg-green-500 text-white p-3 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
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