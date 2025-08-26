import { useEffect, useState } from 'react';
import { FiSearch, FiPlus, FiLogOut, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showStockTakingConfirm, setShowStockTakingConfirm] = useState(false);
  const [newItem, setNewItem] = useState({ id: '', item: '', type: 'Fabric', quantity: '', unit: 'meters', threshold: '', price: '' });
  const [editItem, setEditItem] = useState({ id: '', item: '', type: 'Fabric', quantity: '', unit: 'meters', threshold: '', price: '' });
  const [itemToDelete, setItemToDelete] = useState(null);
  const token = localStorage.getItem('adminToken') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGRpbWFsc2hhLmNvbSIsImlhdCI6MTc1Mzg4NDIxMiwiZXhwIjoxNzUzOTcwNjEyfQ.Gvw3zPSHoB43FRFdwfWTD7_mBzPcJ9uFhjfdskZXnkI';

  const typeToUnitMap = {
    Fabric: 'meters',
    Thread: 'meters',
    Dye: 'liters',
    Buttons: 'buttons',
    Other: 'units',
  };

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/inventory', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedItems = res.data.sort((a, b) => {
          const numA = parseInt(a.id.split('-')[1] || 0);
          const numB = parseInt(b.id.split('-')[1] || 0);
          return numA - numB;
        });
        // Ensure price is defined, default to 0 if missing
        const updatedItems = sortedItems.map(item => ({
          ...item,
          price: item.price || 0,
        }));
        setInventoryItems(updatedItems);
      } catch (err) {
        setError('Failed to load inventory.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInventory();
  }, [token]);

  const handleNewItemTypeChange = (e) => {
    const selectedType = e.target.value;
    setNewItem((prev) => ({
      ...prev,
      type: selectedType,
      unit: typeToUnitMap[selectedType] || 'units',
    }));
  };

  const handleEditItemTypeChange = (e) => {
    const selectedType = e.target.value;
    setEditItem((prev) => ({
      ...prev,
      type: selectedType,
      unit: typeToUnitMap[selectedType] || 'units',
    }));
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id: newItem.id || `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        item: newItem.item,
        type: newItem.type,
        quantity: Number(newItem.quantity),
        unit: newItem.unit,
        threshold: Number(newItem.threshold),
        price: Number(newItem.price) || 0, // Default to 0 if not provided
      };
      const res = await axios.post('http://localhost:5000/api/inventory', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems((prev) => {
        const updated = [...prev, { ...res.data, price: res.data.price || 0 }].sort((a, b) => {
          const numA = parseInt(a.id.split('-')[1] || 0);
          const numB = parseInt(b.id.split('-')[1] || 0);
          return numA - numB;
        });
        return updated;
      });
      setShowAddForm(false);
      setNewItem({ id: '', item: '', type: 'Fabric', quantity: '', unit: 'meters', threshold: '', price: '' });
    } catch (err) {
      setError(`Failed to add item: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        item: editItem.item,
        type: editItem.type,
        quantity: Number(editItem.quantity),
        unit: editItem.unit,
        threshold: Number(editItem.threshold),
        price: Number(editItem.price) || 0, // Default to 0 if not provided
      };
      const res = await axios.put(`http://localhost:5000/api/inventory/${editItem.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems((prev) => {
        const updated = prev.map((item) => (item.id === editItem.id ? { ...res.data, price: res.data.price || 0 } : item)).sort((a, b) => {
          const numA = parseInt(a.id.split('-')[1] || 0);
          const numB = parseInt(b.id.split('-')[1] || 0);
          return numA - numB;
        });
        return updated;
      });
      setShowEditForm(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setError('Failed to update item.');
    }
  };

  const handleDeleteItem = (id) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${itemToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventoryItems((prev) => prev.filter((item) => item.id !== itemToDelete).sort((a, b) => {
        const numA = parseInt(a.id.split('-')[1] || 0);
        const numB = parseInt(b.id.split('-')[1] || 0);
        return numA - numB;
      }));
      setShowDeleteConfirm(false);
    } catch (err) {
      setError('Failed to delete item.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleStockTaking = () => {
    setShowStockTakingConfirm(true);
  };

  const confirmStockTaking = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedItems = res.data.sort((a, b) => {
        const numA = parseInt(a.id.split('-')[1] || 0);
        const numB = parseInt(b.id.split('-')[1] || 0);
        return numA - numB;
      });
      // Ensure price is defined, default to 0 if missing
      const updatedItems = sortedItems.map(item => ({
        ...item,
        price: item.price || 0,
      }));
      setInventoryItems(updatedItems);
      setShowStockTakingConfirm(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setError('Failed to perform stock taking.');
    }
  };

  const cancelStockTaking = () => {
    setShowStockTakingConfirm(false);
  };

  const filteredInventory = inventoryItems.filter((item) =>
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (qty, threshold) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center';
    return qty <= threshold ? (
      <span className={`${base} bg-red-100 text-red-800`}>Low</span>
    ) : (
      <span className={`${base} bg-green-100 text-green-800`}>High</span>
    );
  };

  // Calculate total price with fallback for undefined price
  const totalPrice = inventoryItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  return (
    <div className="min-h-screen flex bg-gray-50 font-poppins text-gray-800">
      <AdminSidebar activePage="inventory" />

      <main className="ml-64 w-full p-6 transition-all duration-300 ease-in-out">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-sm text-gray-600 mt-1">Track and manage stock levels efficiently</p>
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
              </span>
              <input
                type="text"
                placeholder="Search by item or ID"
                className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiPlus /> New Item
              </button>
              <button
                onClick={handleStockTaking}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg transition-all duration-200"
              >
                Stock Taking
              </button>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddItem} className="mb-6 p-6 bg-gray-50 rounded-xl shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="ID (optional)"
                  value={newItem.id}
                  onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
                />
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Item"
                  value={newItem.item}
                  onChange={(e) => setNewItem({ ...newItem, item: e.target.value })}
                  required
                />
                <select
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  value={newItem.type}
                  onChange={handleNewItemTypeChange}
                  required
                >
                  <option value="Fabric">Fabric</option>
                  <option value="Thread">Thread</option>
                  <option value="Dye">Dye</option>
                  <option value="Buttons">Buttons</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Quantity"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  required
                />
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg bg-gray-100"
                  placeholder="Unit"
                  value={newItem.unit}
                  readOnly
                />
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Threshold"
                  value={newItem.threshold}
                  onChange={(e) => setNewItem({ ...newItem, threshold: e.target.value })}
                  required
                />
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Price per Unit (LKR)"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  required
                />
              </div>
              <div className="mt-4 flex justify-end gap-4">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all">
                  Add
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showEditForm && (
            <form onSubmit={handleUpdateItem} className="mb-6 p-6 bg-gray-50 rounded-xl shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg bg-gray-100"
                  value={editItem.id}
                  disabled
                />
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Item"
                  value={editItem.item}
                  onChange={(e) => setEditItem({ ...editItem, item: e.target.value })}
                  required
                />
                <select
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  value={editItem.type}
                  onChange={handleEditItemTypeChange}
                  required
                >
                  <option value="Fabric">Fabric</option>
                  <option value="Thread">Thread</option>
                  <option value="Dye">Dye</option>
                  <option value="Buttons">Buttons</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Quantity"
                  value={editItem.quantity}
                  onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                  required
                />
                <input
                  className="border border-gray-200 px-3 py-2 rounded-lg bg-gray-100"
                  placeholder="Unit"
                  value={editItem.unit}
                  readOnly
                />
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Threshold"
                  value={editItem.threshold}
                  onChange={(e) => setEditItem({ ...editItem, threshold: e.target.value })}
                  required
                />
                <input
                  type="number"
                  className="border border-gray-200 px-3 py-2 rounded-lg"
                  placeholder="Price per Unit (LKR)"
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                  required
                />
              </div>
              <div className="mt-4 flex justify-end gap-4">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all">
                  Update
                </button>
                <button type="button" onClick={() => setShowEditForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Deletion</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this item?</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={cancelDelete}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {showStockTakingConfirm && (
            <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Stock Taking</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to refresh the inventory data?</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={cancelStockTaking}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmStockTaking}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSuccessToast && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slideIn transform transition-all duration-300">
              <div className="flex items-center justify-between">
                <span>Updated successfully!</span>
                <button onClick={() => setShowSuccessToast(false)} className="ml-4 text-white hover:text-gray-200">
                  <FiX size={18} />
                </button>
              </div>
            </div>
          )}

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {isLoading ? (
            <div className="text-center text-gray-500 text-lg">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Item</th>
                    <th className="px-6 py-3 text-left font-semibold">Type</th>
                    <th className="px-6 py-3 text-left font-semibold">Quantity</th>
                    <th className="px-6 py-3 text-left font-semibold">Unit</th>
                    <th className="px-6 py-3 text-left font-semibold">Threshold</th>
                    <th className="px-6 py-3 text-left font-semibold">Price per Unit (LKR)</th>
                    <th className="px-6 py-3 text-left font-semibold">Total Price (LKR)</th>
                    <th className="px-6 py-3 text-left font-semibold">Last Updated</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4">{item.id}</td>
                      <td className="px-6 py-4">{item.item}</td>
                      <td className="px-6 py-4">{item.type}</td>
                      <td className="px-6 py-4">{item.quantity}</td>
                      <td className="px-6 py-4">{item.unit}</td>
                      <td className="px-6 py-4">{item.threshold}</td>
                      <td className="px-6 py-4">LKR {(item.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">LKR {((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
                      <td className="px-6 py-4">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{getStatusBadge(item.quantity, item.threshold)}</td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() => { setEditItem(item); setShowEditForm(true); }}
                          className="flex items-center gap-1 bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-all duration-200"
                        >
                          <FiEdit /> 
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-all duration-200"
                        >
                          <FiTrash2 /> 
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-right text-xl font-semibold text-gray-900">
                Total Inventory Value: LKR {totalPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Inventory;