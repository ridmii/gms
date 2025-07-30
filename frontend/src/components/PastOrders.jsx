import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from './Layout'; // Import the Layout component
import '../styles/Main.css';

const PastOrders = () => {
  const [email, setEmail] = useState(localStorage.getItem('customerEmail') || '');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!email) {
      setError('Please enter your email to view orders.');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/customer/${email}`);
      setOrders(response.data);
      setError(null);
      localStorage.setItem('customerEmail', email);
    } catch (err) {
      setError('Failed to fetch orders. Please check your email or try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (email) fetchOrders();
  }, []);

  const handleDownload = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}/invoice/public`, {
        responseType: 'blob',
        params: { email }, // Pass email as query parameter
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

  return (
    <Layout activePage="view-orders"> {/* Use Layout with activePage for View Orders */}
      <div className="past-orders-container">
        <div className="orders-card">
          <div className="orders-header">
            <h2>Your Past Orders</h2>
          </div>
          <div className="email-form">
            <label className="form-label">Enter Your Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="email-input"
                placeholder="your@email.com"
              />
              <button onClick={fetchOrders} className="submit-button">
                Fetch Orders
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : orders.length === 0 ? (
            <p>No orders found for this email.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Material</th>
                  <th>Quantity</th>
                  <th>Total (Rs.)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order._id.slice(-8)}</td>
                    <td>{new Date(order.date).toLocaleDateString('en-US')}</td>
                    <td>{order.material}</td>
                    <td>{order.quantity}</td>
                    <td>{(order.priceDetails?.total || 0).toLocaleString()}</td>
                    <td>
                      <button
                        onClick={() => handleDownload(order._id)}
                        className="download-button"
                      >
                        Download Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PastOrders;