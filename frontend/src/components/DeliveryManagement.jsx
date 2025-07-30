import { useState, useEffect } from 'react';
import { FiSearch, FiChevronDown, FiRefreshCw, FiCheck, FiTruck, FiClock, FiPackage, FiPlus, FiTrash } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const DeliveryManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1Mzg1MjY2MiwiZXhwIjoxNzUzOTM5MDYyfQ.83fpdOuUmPWtgCOpk5r1btJMXIOg6lSOp_vdSg3oHmQ'; // Replace with the token from login

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError('No token available. Please login.');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const [deliveriesResponse, driversResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/deliveries', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/drivers', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setDeliveries(deliveriesResponse.data);
        setDrivers(driversResponse.data);
      } catch (err) {
        console.error('Fetch Error:', err.response?.data || err.message);
        setError('Failed to load data. Please check the token or server.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDeliveries = [...deliveries].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const filteredDeliveries = sortedDeliveries.filter(
    (delivery) =>
      delivery.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.deliveryId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <FiPackage className="mr-1" /> Ready
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <FiTruck className="mr-1" /> In Progress
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FiCheck className="mr-1" /> Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <FiClock className="mr-1" /> Pending
          </span>
        );
    }
  };

  const assignDriver = async (deliveryId, driverId) => {
    if (!token) {
      setError('No token available. Please login.');
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/deliveries/${deliveryId}/assign`, { driverId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(prev =>
        prev.map(delivery =>
          delivery.deliveryId === deliveryId ? { ...delivery, assignedTo: driverId, status: 'In Progress' } : delivery
        )
      );
      setError(null);
    } catch (err) {
      console.error('Assign Error:', err.response?.data || err.message);
      setError('Failed to assign driver. Please try again.');
    }
  };

  const removeDriver = async (deliveryId) => {
    if (!token) {
      setError('No token available. Please login.');
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/deliveries/${deliveryId}/remove-driver`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliveries(prev =>
        prev.map(delivery =>
          delivery.deliveryId === deliveryId ? { ...delivery, assignedTo: '', status: 'Ready' } : delivery
        )
      );
      setError(null);
    } catch (err) {
      console.error('Remove Error:', err.response?.data || err.message);
      setError('Failed to remove driver. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <AdminSidebar activePage="deliveries" />
      <div className="max-w-7xl mx-auto ml-64">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dimalsha Fashions</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mt-2">Delivery Management</h2>
          <p className="text-gray-500 mt-1">Track and manage order deliveries</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6 transition-all duration-300 hover:shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Search Deliveries</h3>
              <p className="text-sm text-gray-500">Search by customer or delivery ID</p>
            </div>
            <div className="mt-4 md:mt-0 relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <FiRefreshCw className="animate-spin text-indigo-600 text-2xl" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-4">{error}</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('deliveryId')}
                    >
                      <div className="flex items-center">
                        Delivery ID
                        <FiChevronDown
                          className={`ml-1 transition-transform duration-200 ${
                            sortConfig.key === 'deliveryId' && sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('orderId')}
                    >
                      <div className="flex items-center">
                        Order ID
                        <FiChevronDown
                          className={`ml-1 transition-transform duration-200 ${
                            sortConfig.key === 'orderId' && sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('customer')}
                    >
                      <div className="flex items-center">
                        Customer
                        <FiChevronDown
                          className={`ml-1 transition-transform duration-200 ${
                            sortConfig.key === 'customer' && sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Address
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('assignedTo')}
                    >
                      <div className="flex items-center">
                        Assigned To
                        <FiChevronDown
                          className={`ml-1 transition-transform duration-200 ${
                            sortConfig.key === 'assignedTo' && sortConfig.direction === 'desc' ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                      onClick={() => handleSort('scheduledDate')}
                    >
                      <div className="flex items-center">
                        Scheduled Date
                        <FiChevronDown
                          className={`ml-1 transition-transform duration-200 ${
                            sortConfig.key === 'scheduledDate' && sortConfig.direction === 'desc'
                              ? 'transform rotate-180'
                              : ''
                          }`}
                        />
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeliveries.map((delivery) => (
                    <tr
                      key={delivery.deliveryId}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {delivery.deliveryId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {delivery.customer}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {delivery.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {delivery.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(delivery.scheduledDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(delivery.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <select
                          className="mr-2 p-1 border rounded text-sm"
                          value={delivery.assignedTo || ''}
                          onChange={(e) => assignDriver(delivery.deliveryId, e.target.value)}
                          disabled={delivery.status === 'Delivered'}
                        >
                          <option value="">Assign Driver</option>
                          {drivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name}
                            </option>
                          ))}
                        </select>
                        {delivery.assignedTo && (
                          <button
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 ml-2"
                            onClick={() => removeDriver(delivery.deliveryId)}
                            disabled={delivery.status === 'Delivered'}
                          >
                            <FiTrash />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryManagement;