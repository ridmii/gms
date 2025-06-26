import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUpload } from 'react-icons/fa';
import '../styles/Main.css';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('Orders');
  const [editOrder, setEditOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No token found');
        const response = await axios.get('http://localhost:5000/api/orders/admin', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(response.data);
        setFilteredOrders(response.data);
        setError(null);
      } catch (err) {
        console.error('Fetch orders error:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setError('Failed to fetch orders. Please log in again.');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  useEffect(() => {
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = orders.filter(
        (order) =>
          order._id.slice(-8).toLowerCase().includes(query) ||
          order.name.toLowerCase().includes(query)
      );
    }
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoff = new Date();
      if (timeFilter === '7days') {
        cutoff.setDate(now.getDate() - 7);
      } else if (timeFilter === '30days') {
        cutoff.setDate(now.getDate() - 30);
      }
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
      priceDetails: JSON.stringify(order.priceDetails || { unitPrice: 0, total: 0 }),
      artworkFile: null,
    });
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setEditOrder((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No token found');
      let response;
      if (editOrder.artworkFile) {
        const formData = new FormData();
        formData.append('name', editOrder.name || '');
        formData.append('email', editOrder.email || '');
        formData.append('mobile', editOrder.mobile || '');
        formData.append('material', editOrder.material || '');
        formData.append('quantity', editOrder.quantity || '1');
        formData.append('artwork', editOrder.artwork ? 'true' : 'false');
        formData.append('artworkText', editOrder.artworkText || '');
        let priceDetails = editOrder.priceDetails;
        try {
          priceDetails = JSON.parse(priceDetails);
        } catch {
          priceDetails = { unitPrice: 0, total: 0 };
        }
        formData.append('priceDetails', JSON.stringify(priceDetails));
        formData.append('artworkImage', editOrder.artworkFile);
        for (let [key, value] of formData.entries()) {
          console.log(`FormData: ${key}=${value instanceof File ? value.name : value}`);
        }
        response = await axios.put(`http://localhost:5000/api/orders/${editOrder._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        const updateData = {
          name: editOrder.name || '',
          email: editOrder.email || '',
          mobile: editOrder.mobile || '',
          material: editOrder.material || '',
          quantity: editOrder.quantity || '1',
          artwork: editOrder.artwork || false,
          artworkText: editOrder.artworkText || '',
          priceDetails: editOrder.priceDetails
            ? JSON.parse(editOrder.priceDetails)
            : { unitPrice: 0, total: 0 },
        };
        console.log('JSON Update:', updateData);
        response = await axios.put(`http://localhost:5000/api/orders/${editOrder._id}/nofile`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? response.data : order))
      );
      setFilteredOrders((prev) =>
        prev.map((order) => (order._id === editOrder._id ? response.data : order))
      );
      setEditOrder(null);
      setToastMessage('Order updated successfully');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Edit error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers,
      });
      setError(err.response?.data?.error || 'Failed to update order.');
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
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
      console.error('Delete error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.error || 'Failed to delete order.');
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    }
  };

  const handleGenerateReport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/orders/report', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'orders-report.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate report.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="admin-dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">Dimalsha Fashions</div>
        <ul className="sidebar-nav">
          <li className={activeSection === 'Dashboard' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Dashboard')}>Dashboard</button>
          </li>
          <li className={activeSection === 'Orders' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Orders')}>Orders</button>
          </li>
          <li className={activeSection === 'Delivery' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Delivery')}>Delivery</button>
          </li>
          <li className={activeSection === 'Inventory' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Inventory')}>Inventory</button>
          </li>
          <li className={activeSection === 'Salary' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Salary')}>Salary</button>
          </li>
          <li className={activeSection === 'Finance' ? 'active' : ''}>
            <button onClick={() => setActiveSection('Finance')}>Finance</button>
          </li>
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        </ul>
      </div>
      <div className="content-area">
        {activeSection === 'Orders' ? (
          <div className="dashboard-content">
            <h2>Orders</h2>
            <div className="search-filter-group">
              <input
                type="text"
                placeholder="Search by Order ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Orders</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
              <button onClick={handleGenerateReport} className="report-button">
                Generate Report
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {loading ? (
              <p>Loading...</p>
            ) : filteredOrders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Material</th>
                    <th>Qty</th>
                    <th>Total (Rs.)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order._id.slice(-8)}</td>
                      <td>{order.name} ({order.email})</td>
                      <td>{new Date(order.date).toLocaleDateString('en-US')}</td>
                      <td>{order.material}</td>
                      <td>{order.quantity}</td>
                      <td>{(order.priceDetails?.total || 0).toLocaleString('en-US')}</td>
                      <td>
                        <button onClick={() => handleEdit(order)} className="edit-button">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(order._id)} className="delete-button">
                          Delete
                        </button>
                        <button onClick={() => handleDownload(order._id)} className="download-button">
                          Download Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="dashboard-content">
            <h2>{activeSection}</h2>
            <p>This section is not yet implemented.</p>
          </div>
        )}
        {editOrder && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-header">Edit Order</h2>
              <form onSubmit={handleEditSubmit} encType="multipart/form-data">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editOrder.name || ''}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editOrder.email || ''}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={editOrder.mobile || ''}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Enter mobile number"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Material</label>
                  <select
                    name="material"
                    value={editOrder.material || ''}
                    onChange={handleEditChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select material</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Silk">Silk</option>
                    <option value="Polyester">Polyester</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editOrder.quantity || ''}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="Enter quantity"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <input
                      type="checkbox"
                      name="artwork"
                      checked={editOrder.artwork || false}
                      onChange={handleEditChange}
                      className="mr-2"
                    />
                    Require Artwork Design
                  </label>
                </div>
                {editOrder.artwork && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Artwork Description</label>
                      <textarea
                        name="artworkText"
                        value={editOrder.artworkText || ''}
                        onChange={handleEditChange}
                        className="form-textarea"
                        rows="4"
                        placeholder="Describe artwork requirements"
                      />
                    </div>
                    <div className="file-upload-wrapper">
                      <label className="form-label">Upload Artwork File</label>
                      <label className="file-upload-label">
                        <input
                          type="file"
                          name="artworkFile"
                          onChange={handleEditChange}
                          className="file-upload-input"
                          accept="image/jpeg,image/png,application/pdf"
                        />
                        <div className="file-upload-content">
                          <FaUpload className="file-upload-icon" />
                          <span className="file-upload-text">Drag & Drop or Click to Upload</span>
                          <span className="file-upload-hint">JPEG, PNG, or PDF (max 10MB)</span>
                        </div>
                      </label>
                      {editOrder.artworkFile && <p>File: {editOrder.artworkFile.name}</p>}
                    </div>
                  </>
                )}
                <div className="form-group">
                  <label className="form-label">Price Details (JSON)</label>
                  <textarea
                    name="priceDetails"
                    value={editOrder.priceDetails || '{}'}
                    onChange={handleEditChange}
                    className="form-textarea"
                    rows="3"
                    placeholder='{"unitPrice": 0, "total": 0}'
                  />
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="submit-button">Save</button>
                  <button type="button" onClick={() => setEditOrder(null)} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-header">Confirm Deletion</h2>
              <p>Are you sure you want to delete this order?</p>
              <div className="modal-buttons">
                <button onClick={handleDelete} className="delete-button">Delete</button>
                <button onClick={() => setDeleteConfirm(null)} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {toastMessage && <div className="toast">{toastMessage}</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;
