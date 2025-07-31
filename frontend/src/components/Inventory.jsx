import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiLogOut } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1Mzg4NDIxMiwiZXhwIjoxNzUzOTcwNjEyfQ.Gvw3zPSHoB43FRFdwfWTD7_mBzPcJ9uFhjfdskZXnkI'; // Replace with actual token

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInventoryItems(res.data);
      } catch (err) {
        setError('Failed to load inventory.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, []);

  const filteredInventory = inventoryItems.filter((item) =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (qty, threshold) => {
    const base = 'px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center';
    return qty < threshold ? (
      <span className={`${base} bg-red-100 text-red-800`}>Low</span>
    ) : (
      <span className={`${base} bg-green-100 text-green-800`}>High</span>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-inter animate-fadeIn">
      <AdminSidebar activePage="inventory" />

      <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
        {/* Admin Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
            <p className="text-sm text-gray-500">
              Track and manage stock levels
            </p>
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

        {/* Search + Buttons */}
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full md:w-1/2">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch />
              </span>
              <input
                type="text"
                placeholder="Search inventory by item or ID"
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all shadow-md hover:scale-105">
                <FiPlus /> New Item
              </button>
              <button className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md transition">
                Stock Taking
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          {error && <div className="text-red-500">{error}</div>}
          {isLoading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm bg-white border border-gray-200 rounded-md">
                <thead className="bg-gray-100 text-gray-600 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold">ID</th>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="px-4 py-3 font-semibold">Threshold</th>
                    <th className="px-4 py-3 font-semibold">Last Updated</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-4 py-3 font-medium">{item.id}</td>
                      <td className="px-4 py-3">{item.item}</td>
                      <td className="px-4 py-3">{item.type}</td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">{item.unit}</td>
                      <td className="px-4 py-3">{item.threshold}</td>
                      <td className="px-4 py-3">{item.lastUpdated}</td>
                      <td className="px-4 py-3">
                        {getStatusBadge(item.quantity, item.threshold)}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600 transition">
                          + Add
                        </button>
                        <button className="bg-red-500 text-white px-3 py-1 rounded-md text-xs hover:bg-red-600 transition">
                          − Remove
                        </button>
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

export default Inventory;
