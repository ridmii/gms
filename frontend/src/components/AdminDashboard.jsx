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
        const [statsResponse, ordersResponse, inventoryResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/orders/admin', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/inventory', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        console.log('Dashboard Stats:', statsResponse.data);
        console.log('Inventory Data:', inventoryResponse.data);
        setDashboardStats({
          totalOrders: statsResponse.data.totalOrders,
          pendingDeliveries: statsResponse.data.pendingDeliveries,
          monthlyIncome: statsResponse.data.monthlyIncome,
        });
        setRecentOrders(ordersResponse.data.slice(0, 5)); // Top 5 recent orders
        setInventoryItems(inventoryResponse.data);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err.response?.status, err.response?.data || err.message);
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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const lowInventoryItems = inventoryItems.filter(item => item.quantity <= item.threshold);

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@dimalsha.com</p>
              </div>
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                AU
              </div>
              <FiLogOut 
                className="text-gray-500 hover:text-red-500 cursor-pointer" 
                size={20} 
                onClick={handleLogout}
              />
            </div>
          </div>
        </header>
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{error}</div>}
        {loading ? (
          <div className="text-center py-4 text-gray-600">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Total Monthly Orders</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {dashboardStats.totalOrders}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Pending Deliveries</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  {dashboardStats.pendingDeliveries}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition duration-300">
                <h3 className="text-sm text-gray-500">Monthly Income</h3>
                <p className="text-2xl font-semibold text-gray-800">
                  LKR {dashboardStats.monthlyIncome.toLocaleString()}
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
                      <th className="p-3 font-semibold text-gray-600">ID</th>
                      <th className="p-3 font-semibold text-gray-600">Item</th>
                      <th className="p-3 font-semibold text-gray-600">Quantity</th>
                      <th className="p-3 font-semibold text-gray-600">Threshold</th>
                      <th className="p-3 font-semibold text-gray-600">Status</th>
                      <th className="p-3 font-semibold text-gray-600">Unit</th>
                      <th className="p-3 font-semibold text-gray-600">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowInventoryItems.length > 0 ? (
                      lowInventoryItems.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50 transition duration-200">
                          <td className="p-3">{item.id}</td>
                          <td className="p-3">{item.item}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">{item.threshold}</td>
                          <td className="p-3">
                            <span className="text-red-500">Low</span>
                          </td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="p-3 text-center text-gray-500">
                          No low inventory items
                        </td>
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