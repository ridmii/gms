// src/components/AdminSidebar.jsx
import { Link } from 'react-router-dom';
import { FiHome, FiShoppingBag, FiTruck, FiPackage, FiDollarSign, FiUsers, FiSettings } from 'react-icons/fi';

const AdminSidebar = ({ activePage }) => {
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
  };

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 fixed h-full shadow-lg">
      <div className="text-2xl font-bold mb-6">Dimalsha Fashions</div>
      <nav className="space-y-2">
        <Link
          to="/admin/dashboard"
          className={`block py-2 px-4 rounded flex items-center ${activePage === 'dashboard' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          <FiHome className="mr-2" /> Dashboard
        </Link>
        <Link
          to="/admin/orders"
          className={`block py-2 px-4 rounded flex items-center ${activePage === 'orders' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          <FiShoppingBag className="mr-2" /> Orders
        </Link>
        <Link
          to="/admin/deliveries"
          className={`block py-2 px-4 rounded flex items-center ${activePage === 'deliveries' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          <FiTruck className="mr-2" /> Delivery
        </Link>
        <Link
          to="#"
          className="block py-2 px-4 rounded flex items-center hover:bg-blue-600"
        >
          <FiPackage className="mr-2" /> Inventory
        </Link>
        <Link
          to="#"
          className="block py-2 px-4 rounded flex items-center hover:bg-blue-600"
        >
          <FiDollarSign className="mr-2" /> Salary
        </Link>
        <Link
          to="#"
          className="block py-2 px-4 rounded flex items-center hover:bg-blue-600"
        >
          <FiUsers className="mr-2" /> Income
        </Link>
        <button
          onClick={handleLogout}
          className="w-full text-left py-2 px-4 rounded hover:bg-red-600 mt-4 text-white flex items-center"
        >
          <FiSettings className="mr-2" /> Logout
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;