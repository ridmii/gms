// src/components/OrderDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from './AdminSidebar';

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
        setOrders(ordersResponse.data);
        setFilteredOrders(ordersResponse.data);
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
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = orders.filter(
        (order) =>
          order._id.slice(-8).toLowerCase().includes(query) ||
          order.factoryName.toLowerCase().includes(query)
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
    formDataToSend.append('factoryName', editOrder.factoryName);
    formDataToSend.append('email', editOrder.email);
    formDataToSend.append('mobile', editOrder.mobile);
    formDataToSend.append('material', editOrder.material);
    formDataToSend.append('quantity', editOrder.quantity);
    formDataToSend.append('needsArtwork', editOrder.needsArtwork);
    if (editOrder.artworkFile) formDataToSend.append('artworkFile', editOrder.artworkFile);
    if (editOrder.artworkText) formDataToSend.append('artworkText', editOrder.artworkText);

    console.log('Edit FormData:', Object.fromEntries(formDataToSend)); // Debug log

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
    formData.append('factoryName', newOrder.factoryName);
    formData.append('email', newOrder.email);
    formData.append('mobile', newOrder.mobile);
    formData.append('material', newOrder.material);
    formData.append('quantity', newOrder.quantity);
    formData.append('needsArtwork', newOrder.needsArtwork);
    if (newOrder.artworkFile) formData.append('artworkFile', newOrder.artworkFile);
    if (newOrder.artworkText) formData.append('artworkText', newOrder.artworkText);

    console.log('New Order FormData:', Object.fromEntries(formData)); // Debug log

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setOrders((prev) => [...prev, response.data]);
      setFilteredOrders((prev) => [...prev, response.data]);
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

  return (
    <div className="min-h-screen bg-gray-100 flex font-inter">
      <AdminSidebar activePage="orders" />
      <aside className="w-64 bg-gray-800 text-white p-6 fixed h-full shadow-lg">
        <div className="text-2xl font-bold mb-6">Dimalsha Fashions</div>
        <nav className="space-y-2">
          <a href="/admin/dashboard" className="block py-2 px-4 rounded hover:bg-blue-600">
            Dashboard
          </a>
          <a href="/admin/orders" className="block py-2 px-4 rounded bg-blue-700 text-white">
            Orders
          </a>
          <a href="/admin/deliveries" className="block py-2 px-4 rounded hover:bg-blue-600">
            Delivery
          </a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-blue-600">
            Inventory
          </a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-blue-600">
            Salary
          </a>
          <a href="#" className="block py-2 px-4 rounded hover:bg-blue-600">
            Income
          </a>
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded hover:bg-red-600 mt-4 text-white"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="ml-64 p-6 w-full">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Orders</h1>
          <button
            onClick={() => setNewOrderForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            + New Order
          </button>
        </header>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No orders found.</div>
        ) : (
          <>
            <div className="mb-6 flex gap-4 flex-wrap">
              <input
                type="text"
                placeholder="Search by customer or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-2 border rounded-lg w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="p-2 border rounded-lg w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left bg-white rounded-lg shadow-md">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 font-semibold text-gray-600">Order ID</th>
                    <th className="p-3 font-semibold text-gray-600">Customer</th>
                    <th className="p-3 font-semibold text-gray-600">Factory Name</th>
                    <th className="p-3 font-semibold text-gray-600">Product</th>
                    <th className="p-3 font-semibold text-gray-600">Amount</th>
                    <th className="p-3 font-semibold text-gray-600">Date</th>
                    <th className="p-3 font-semibold text-gray-600">Status</th>
                    <th className="p-3 font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="border-b hover:bg-gray-50 transition duration-200">
                      <td className="p-3">ORD-{order._id.slice(-8)}</td><td className="p-3">{order.factoryName}</td><td className="p-3">{order.factoryName || 'N/A'}</td><td className="p-3">{order.material}</td><td className="p-3">LKR {order.priceDetails?.total || 0}</td><td className="p-3">{new Date(order.date).toLocaleDateString()}</td><td className="p-3">{order.status || 'Pending'}</td><td className="p-3 flex gap-2">
                        <button onClick={() => handleDownload(order._id)} className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition duration-300">Invoice</button>
                        <button onClick={() => handleEdit(order)} className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition duration-300">Edit</button>
                        <button onClick={() => setDeleteConfirm(order._id)} className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition duration-300">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

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
  );
};

export default OrderDashboard;