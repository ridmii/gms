import { useEffect, useState } from 'react';
import {
  FiSearch,
  FiPlus,
  FiTruck,
  FiClock,
  FiCheck,
  FiLogOut,
} from 'react-icons/fi';
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

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1Mzg4NDIxMiwiZXhwIjoxNzUzOTcwNjEyfQ.Gvw3zPSHoB43FRFdwfWTD7_mBzPcJ9uFhjfdskZXnkI'; // Replace with actual token logic

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deliveriesRes, ordersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/deliveries', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/orders/unassigned', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setDeliveries(deliveriesRes.data);
        setUnassignedOrders(ordersRes.data.filter(order => order.status === 'Pending')); // Filter for Pending status
      } catch (err) {
        setError('Failed to load data.');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const assignDelivery = async (orderId) => {
    const order = unassignedOrders.find(o => o._id === orderId);
    if (!order) return;

    const availableDrivers = drivers.filter(d => !deliveries.some(del => del.assignedTo === d));
    const driver = availableDrivers.length > 0 ? availableDrivers[0] : drivers[0]; // Rotate or fallback

    try {
      const deliveryData = {
        deliveryId: `DEL-${Date.now()}`,
        orderId: order._id,
        customer: order.name,
        address: order.address,
        scheduledDate: new Date().toISOString(),
        assignedTo: driver,
        status: 'Pending',
      };
      const response = await axios.post('http://localhost:5000/api/deliveries', deliveryData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries([...deliveries, response.data]);
      setUnassignedOrders(unassignedOrders.filter(o => o._id !== orderId));
      setError(null);
    } catch (err) {
      setError('Failed to assign delivery.');
      console.error('Assign error:', err);
    }
  };

  const updateDelivery = async (deliveryId, updates) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/deliveries/${deliveryId}/assign`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeliveries(deliveries.map(d => d.deliveryId === deliveryId ? response.data : d));
      setError(null);
    } catch (err) {
      setError('Failed to update delivery.');
      console.error('Update error:', err);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateDelivery(id, { driverId: deliveries.find(d => d.deliveryId === id).assignedTo, status: newStatus });
  };

  const handleDriverChange = (id, newDriver) => {
    updateDelivery(id, { driverId: newDriver });
  };

  const getStatusBadge = (status) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center transition-all';
    switch (status) {
      case 'In Progress':
        return (
          <span className={`${base} bg-blue-100 text-blue-800`}>
            <FiTruck className="mr-1" /> In Progress
          </span>
        );
      case 'Delivered':
        return (
          <span className={`${base} bg-green-100 text-green-800`}>
            <FiCheck className="mr-1" /> Delivered
          </span>
        );
      default:
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            <FiClock className="mr-1" /> Pending
          </span>
        );
    }
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const match = d.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  d.deliveryId.toLowerCase().includes(searchTerm.toLowerCase());

    if (timeFilter === 'all') return match;

    const now = new Date();
    const scheduled = new Date(d.scheduledDate);
    const cutoff = new Date(now);
    if (timeFilter === '7days') cutoff.setDate(now.getDate() - 7);
    else if (timeFilter === '30days') cutoff.setDate(now.getDate() - 30);
    return match && scheduled >= cutoff;
  });

  return (
    <div className="min-h-screen flex bg-gray-100 font-inter animate-fadeIn">
      <AdminSidebar activePage="deliveries" />

      <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
        {/* Header Top Bar */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Delivery Management</h1>
            <p className="text-sm text-gray-500">Track and manage order deliveries</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">admin@dimalsha.com</p>
            </div>
            <div className="w-9 h-9 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
              AU
            </div>
            <FiLogOut className="text-gray-500 hover:text-red-500 cursor-pointer" size={18} />
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
                placeholder="Search by customer or delivery ID"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                onClick={() => unassignedOrders.length > 0 && assignDelivery(unassignedOrders[0]._id)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all shadow-md hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={unassignedOrders.length === 0}
              >
                <FiPlus /> Assign Delivery
              </button>
            </div>
          </div>

          {/* Unassigned Orders Section */}
          {unassignedOrders.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">New Orders to Assign</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm bg-white border border-gray-200 rounded-md">
                  <thead className="bg-gray-100 text-gray-600 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Order ID</th>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Address</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {unassignedOrders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 transition-all">
                        <td className="px-4 py-3 font-medium">{order._id.slice(-8)}</td>
                        <td className="px-4 py-3">{order.name}</td>
                        <td className="px-4 py-3">{order.address}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => assignDelivery(order._id)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 transition"
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

          {/* Delivery Table */}
          {error && <div className="text-red-500">{error}</div>}
          {isLoading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto transition">
              <table className="min-w-full text-sm bg-white border border-gray-200 rounded-md">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Delivery ID</th>
                    <th className="px-4 py-3 font-semibold">Order ID</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Address</th>
                    <th className="px-4 py-3 font-semibold">Assigned To</th>
                    <th className="px-4 py-3 font-semibold">Scheduled Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDeliveries.map((delivery) => (
                    <tr key={delivery.deliveryId} className="hover:bg-gray-50 transition-all">
                      <td className="px-4 py-3 font-medium">{delivery.deliveryId}</td>
                      <td className="px-4 py-3">{delivery.orderId.slice(-8)}</td>
                      <td className="px-4 py-3">{delivery.customer}</td>
                      <td className="px-4 py-3">{delivery.address}</td>
                      <td className="px-4 py-3">
                        <select
                          className="p-1 border border-gray-300 rounded-md text-sm transition"
                          value={delivery.assignedTo || ''}
                          onChange={(e) => handleDriverChange(delivery.deliveryId, e.target.value)}
                        >
                          <option value="">Select Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver} value={driver}>
                              {driver}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(delivery.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="p-1 border border-gray-300 rounded-md text-sm transition bg-white"
                          value={delivery.status}
                          onChange={(e) => handleStatusChange(delivery.deliveryId, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                        <div className="mt-1">{getStatusBadge(delivery.status)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DeliveryManagement;