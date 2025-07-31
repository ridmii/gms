import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiTruck, FiClock, FiCheck, FiLogOut, FiTrash2, FiX } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const DeliveryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [deliveries, setDeliveries] = useState([]);
  const [unassignedOrders, setUnassignedOrders] = useState([]);
  const [drivers, setDrivers] = useState(['Namal Perera', 'Geeth Kawshal', 'Samantha Pieris']);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deliveryToDelete, setDeliveryToDelete] = useState(null);

  useEffect(() => {
    const loginAndFetch = async () => {
      if (!token) {
        try {
          const loginRes = await axios.post('http://localhost:5000/api/admin/login', {
            email: 'admin@dimalsha.com',
            password: 'admin123',
          }, {
            headers: { 'Content-Type': 'application/json' },
          });
          const newToken = loginRes.data.token;
          setToken(newToken);
          localStorage.setItem('adminToken', newToken);
          console.log('Login successful, token:', newToken);
        } catch (err) {
          setError('Failed to login: ' + (err.response?.data?.message || err.message));
          console.error('Login error:', err);
          setIsLoading(false);
          return;
        }
      }
      try {
        const [deliveriesRes, ordersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/deliveries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/orders/unassigned', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDeliveries(Array.isArray(deliveriesRes.data) ? deliveriesRes.data : []);
        setUnassignedOrders(Array.isArray(ordersRes.data) ? ordersRes.data.filter(order => order.status === 'Pending') : []);
      } catch (err) {
        setError('Failed to load data: ' + (err.response?.data?.message || err.message));
        console.error('Fetch error:', err);
        setDeliveries([]); // Reset to empty array on error to avoid stale data
        setUnassignedOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    loginAndFetch();
  }, [token]); // Re-run on token change (e.g., login)

  const assignDelivery = async (orderId) => {
    const order = unassignedOrders.find(o => o._id === orderId);
    if (!order) return;

    const availableDrivers = drivers.filter(d => !deliveries.some(del => del.assignedTo === d));
    const driver = availableDrivers.length > 0 ? availableDrivers[0] : drivers[0];

    try {
      const deliveryData = {
        orderId: order._id, // Use order._id directly
        customer: order.name || 'Unknown Customer',
        address: order.address || 'Not provided',
        scheduledDate: new Date().toISOString(),
        assignedTo: driver,
        status: 'Pending',
      };
      const response = await axios.post('http://localhost:5000/api/deliveries', deliveryData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries(prev => [...prev, response.data].sort((a, b) => (a.deliveryId || '').localeCompare(b.deliveryId || '')));
      setUnassignedOrders(prev => prev.filter(o => o._id !== orderId));
      setError(null);
    } catch (err) {
      setError('Failed to assign delivery: ' + (err.response?.data?.message || err.message));
      console.error('Assign error:', err);
    }
  };

  const updateDelivery = async (deliveryId, updates) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/deliveries/${deliveryId}/assign`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries(prev => prev.map(d => (d.deliveryId === deliveryId ? response.data : d)));
      setError(null);
    } catch (err) {
      setError('Failed to update delivery: ' + err.message);
      console.error('Update error:', err);
    }
  };

  const deleteDelivery = async (deliveryId) => {
    if (!deliveryId) {
      setError('Invalid delivery ID for deletion');
      return;
    }
    try {
      const response = await axios.delete(`http://localhost:5000/api/deliveries/${deliveryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200 || response.status === 204) {
        setDeliveries(prev => prev.filter(d => d.deliveryId !== deliveryId));
        setShowDeleteConfirm(false);
        setError(null);
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError('Failed to delete delivery: ' + (err.response?.data?.message || err.message));
      console.error('Delete error:', err);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateDelivery(id, { driverId: deliveries.find(d => d.deliveryId === id)?.assignedTo, status: newStatus });
  };

  const handleDriverChange = (id, newDriver) => {
    updateDelivery(id, { driverId: newDriver });
  };

  const confirmDelete = (deliveryId) => {
    setDeliveryToDelete(deliveryId);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeliveryToDelete(null);
  };

  const getStatusBadge = (status) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center transition-all';
    switch (status) {
      case 'In Progress':
        return <span className={`${base} bg-blue-100 text-blue-800`}><FiTruck className="mr-1" /> In Progress</span>;
      case 'Delivered':
        return <span className={`${base} bg-green-100 text-green-800`}><FiCheck className="mr-1" /> Delivered</span>;
      default:
        return <span className={`${base} bg-yellow-100 text-yellow-800`}><FiClock className="mr-1" /> Pending</span>;
    }
  };

  const getShortId = (id) => {
    try {
      return id ? (typeof id === 'string' ? id.slice(-8) : id.toString().slice(-8)) : 'N/A';
    } catch (e) {
      return id ? id.toString() : 'N/A';
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const customer = d.customer || '';
    const deliveryId = d.deliveryId || '';
    const match = customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  deliveryId.toLowerCase().includes(searchTerm.toLowerCase());
    if (timeFilter === 'all') return match;
    const now = new Date();
    const scheduled = d.scheduledDate ? new Date(d.scheduledDate) : now;
    const cutoff = new Date(now);
    if (timeFilter === '7days') cutoff.setDate(now.getDate() - 7);
    else if (timeFilter === '30days') cutoff.setDate(now.getDate() - 30);
    return match && !isNaN(scheduled.getTime()) && scheduled >= cutoff;
  });

  return (
    <div className="min-h-screen flex bg-gray-50 font-poppins text-gray-800">
      <AdminSidebar activePage="deliveries" />
      <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-sm text-gray-600 mt-1">Track and manage order deliveries efficiently</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">admin@dimalsha.com</p>
            </div>
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              AU
            </div>
            <FiLogOut className="text-gray-500 hover:text-red-500 cursor-pointer" size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="relative w-full md:w-1/3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search by customer or delivery ID"
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-indigo-500 transition-all"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
              <button
                onClick={() => unassignedOrders.length > 0 && assignDelivery(unassignedOrders[0]?._id)}
                className={`flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg ${unassignedOrders.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={unassignedOrders.length === 0}
              >
                <FiPlus /> Assign Delivery
              </button>
            </div>
          </div>
          {unassignedOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">New Orders to Assign</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Order ID</th>
                      <th className="px-6 py-3 text-left font-semibold">Customer</th>
                      <th className="px-6 py-3 text-left font-semibold">Address</th>
                      <th className="px-6 py-3 text-left font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unassignedOrders.map((order, index) => (
                      <tr key={order._id || `order-${index}`} className="hover:bg-gray-50 transition-all duration-200">
                        <td className="px-6 py-4 font-medium">{getShortId(order._id)}</td>
                        <td className="px-6 py-4">{order.name || 'Unknown Customer'}</td>
                        <td className="px-6 py-4">{order.address || 'Not provided'}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => assignDelivery(order._id)}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-all duration-200"
                            disabled={!order._id || unassignedOrders.length === 0}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {isLoading ? (
            <div className="text-center text-gray-500 text-lg">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Delivery ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Order ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold">Address</th>
                    <th className="px-6 py-3 text-left font-semibold">Assigned To</th>
                    <th className="px-6 py-3 text-left font-semibold">Scheduled Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeliveries.map((delivery, index) => (
                    <tr key={delivery.deliveryId || `delivery-${index}`} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4 font-medium">{delivery.deliveryId || 'N/A'}</td>
                      <td className="px-6 py-4">{getShortId(delivery.orderId)}</td>
                      <td className="px-6 py-4">{delivery.customer || 'Unknown Customer'}</td>
                      <td className="px-6 py-4">{delivery.address || 'Not provided'}</td>
                      <td className="px-6 py-4">
                        <select
                          className="p-1 border border-gray-200 rounded-lg text-sm transition-all"
                          value={delivery.assignedTo || ''}
                          onChange={(e) => handleDriverChange(delivery.deliveryId, e.target.value)}
                          disabled={!delivery.deliveryId}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver} value={driver}>
                              {driver}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {delivery.scheduledDate ? new Date(delivery.scheduledDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          className="p-1 border border-gray-200 rounded-lg text-sm transition-all bg-white"
                          value={delivery.status || 'Pending'}
                          onChange={(e) => handleStatusChange(delivery.deliveryId, e.target.value)}
                          disabled={!delivery.deliveryId}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        <div className="mt-1">{getStatusBadge(delivery.status)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => confirmDelete(delivery.deliveryId)}
                          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all duration-200"
                          disabled={!delivery.deliveryId}
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h2>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this delivery?</p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={cancelDelete}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteDelivery(deliveryToDelete)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                  disabled={!deliveryToDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DeliveryManagement;