// AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import axios from 'axios';
import AdminSidebar from './AdminSidebar';
import { FiLogOut } from 'react-icons/fi';

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingDeliveries: 0,
    monthlyIncome: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
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
        const [statsResponse, ordersResponse, deliveriesResponse, inventoryResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/orders/admin', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/deliveries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/inventory', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const orders = ordersResponse.data;
        const deliveries = deliveriesResponse.data;

        // Sync order status with delivery status
        const updatedOrders = orders.map((order) => {
          const delivery = deliveries.find((d) => d.orderId === order._id);
          return delivery ? { ...order, status: delivery.status === 'Delivered' ? 'Delivered' : order.status } : order;
        });

        setDashboardStats({
          totalOrders: statsResponse.data.totalOrders,
          pendingDeliveries: deliveries.filter((d) => d.status === 'Pending').length,
          monthlyIncome: statsResponse.data.monthlyIncome,
        });
        setRecentOrders(updatedOrders.slice(0, 5));
        setInventoryItems(inventoryResponse.data);
        setError(null);
      } catch (err) {
        setError(`Failed to fetch data. Status: ${err.response?.status}. Message: ${err.response?.data?.message || err.message}.`);
        if (err.response?.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const lowInventoryItems = inventoryItems.filter(item => item.quantity <= item.threshold);

  return (
    <div className="min-h-screen bg-gray-100 flex font-inter">
      <AdminSidebar activePage="dashboard" />

      <main className="ml-64 p-6 w-full">
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@dimalsha.com</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              AU
            </div>
            <FiLogOut className="text-gray-500 hover:text-red-500 cursor-pointer" size={20} onClick={handleLogout} />
          </div>
        </header>

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:scale-105 transform transition duration-300 flex items-center gap-4">
                <img src="/total.png" alt="Orders" className="w-12 h-12" />
                <div>
                  <h3 className="text-sm font-medium">Total Orders</h3>
                  <p className="text-2xl font-bold">{dashboardStats.totalOrders}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-xl shadow-lg hover:scale-105 transform transition duration-300 flex items-center gap-4">
                <img src="/delivery.png" alt="Delivery" className="w-12 h-12" />
                <div>
                  <h3 className="text-sm font-medium">Pending Deliveries</h3>
                  <p className="text-2xl font-bold">{dashboardStats.pendingDeliveries}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-6 rounded-xl shadow-lg hover:scale-105 transform transition duration-300 flex items-center gap-4">
                <img src="/income.png" alt="Income" className="w-12 h-12" />
                <div>
                  <h3 className="text-sm font-medium">Monthly Income</h3>
                  <p className="text-2xl font-bold">LKR {dashboardStats.monthlyIncome.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <img src="/order.png" alt="" className="w-6 h-6" /> Recent Orders
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Order ID', 'Customer', 'Amount', 'Date', 'Status'].map(header => (
                        <th key={header} className="p-3 font-semibold text-gray-600">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order._id} className="border-b hover:bg-gray-50 transition duration-200">
                        <td className="p-3">ORD-{order._id.slice(-8)}</td>
                        <td className="p-3">{order.name || 'N/A'}</td>
                        <td className="p-3">LKR {order.priceDetails?.total || 0}</td>
                        <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <img src="/stock.png" alt="" className="w-6 h-6" /> Inventory Alerts
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      {['ID', 'Item', 'Qty', 'Threshold', 'Status', 'Unit', 'Last Updated'].map(header => (
                        <th key={header} className="p-3 font-semibold text-gray-600">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lowInventoryItems.length ? lowInventoryItems.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition duration-200">
                        <td className="p-3">{item.id}</td>
                        <td className="p-3">{item.item}</td>
                        <td className="p-3">{item.quantity}</td>
                        <td className="p-3">{item.threshold}</td>
                        <td className="p-3"><span className="text-red-500 font-medium">Low</span></td>
                        <td className="p-3">{item.unit}</td>
                        <td className="p-3">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-gray-500">No low inventory items</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;