import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import axios from 'axios';
import AdminSidebar from './AdminSidebar';


const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalOrders: 0,
    pendingDeliveries: 0,
    stockLevel: 0,
    monthlyIncome: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
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
        const [statsResponse, ordersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/orders/admin', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDashboardStats(statsResponse.data);
        setRecentOrders(ordersResponse.data.slice(0, 5)); // Top 5 recent orders
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch data. Please log in again.');
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-inter">
      <AdminSidebar activePage="dashboard" />
      <aside className="w-64 bg-gray-800 text-white p-6 fixed h-full shadow-lg">
        <div className="text-2xl font-bold mb-6">Dimalsha Fashions</div>
        <nav className="space-y-2">
          <Link
            to="/admin/dashboard"
            className="block py-2 px-4 rounded bg-blue-700 text-white"
          >
            Dashboard
          </Link>
          <Link 
            to="/admin/orders" 
            className="block py-2 px-4 rounded hover:bg-blue-600"
          >
            Orders
          </Link>
          <Link 
            to="/admin/deliveries" 
            className="block py-2 px-4 rounded hover:bg-blue-600"
          >
            Delivery
          </Link>
             <Link 
            to="/admin/inventory" 
            className="block py-2 px-4 rounded hover:bg-blue-600"
          >
            Inventory
          </Link>
           <Link 
            to="/admin/employee" 
            className="block py-2 px-4 rounded hover:bg-blue-600"
          >
            Employee
          </Link>
           <Link 
            to="/admin/finance" 
            className="block py-2 px-4 rounded hover:bg-blue-600"
          >
            Salary & Finance
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded hover:bg-red-600 mt-4 text-white"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="ml-64 p-6 w-full">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        </header>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Total Orders</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {dashboardStats.totalOrders} <span className="text-green-500">+12%</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Pending Deliveries</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {dashboardStats.pendingDeliveries}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Stock Level</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {dashboardStats.stockLevel}% <span className="text-red-500">-3%</span>
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Monthly Income</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  LKR {dashboardStats.monthlyIncome.toLocaleString()}{' '}
                  <span className="text-green-500">+8%</span>
                </p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Orders</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600">Order ID</th>
                      <th className="p-3 font-semibold text-gray-600">Customer</th>
                      <th className="p-3 font-semibold text-gray-600">Factory Name</th>
                      <th className="p-3 font-semibold text-gray-600">Amount</th>
                      <th className="p-3 font-semibold text-gray-600">Date</th>
                      <th className="p-3 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50 transition duration-200">
                        <td className="p-3">ORD-{order._id.slice(-8)}</td>
                        <td className="p-3">{order.name || 'N/A'}</td>
                        <td className="p-3">LKR {order.priceDetails?.total || 0}</td>
                        <td className="p-3">{new Date(order.date).toLocaleDateString()}</td>
                        <td className="p-3">{order.status || 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Inventory Alerts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 font-semibold text-gray-600">Item</th>
                      <th className="p-3 font-semibold text-gray-600">Quantity</th>
                      <th className="p-3 font-semibold text-gray-600">Threshold</th>
                      <th className="p-3 font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { item: 'Cotton Fabric', qty: 120, thresh: 150, status: 'Low' },
                      { item: 'Polyester Blend', qty: 300, thresh: 200, status: 'High' },
                      { item: 'Buttons (Small)', qty: 1500, thresh: 1000, status: 'High' },
                      { item: 'Zippers', qty: 250, thresh: 300, status: 'Low' },
                    ].map((alert, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="p-3">{alert.item}</td>
                        <td className="p-3">{alert.qty}</td>
                        <td className="p-3">{alert.thresh}</td>
                        <td className="p-3">
                          <span
                            className={
                              alert.status === 'Low' ? 'text-red-500' : 'text-green-500'
                            }
                          >
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))}
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