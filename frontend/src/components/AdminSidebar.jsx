import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminSidebar = ({ activePage }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-800 text-white p-6 fixed h-full shadow-lg">
      <div className="text-2xl font-bold mb-6">Dimalsha Fashions</div>
      <nav className="space-y-2">
        <Link
          to="/admin/dashboard"
          className={`block py-2 px-4 rounded ${activePage === 'dashboard' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          Dashboard
        </Link>
        <Link
          to="/admin/orders"
          className={`block py-2 px-4 rounded ${activePage === 'orders' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          Orders
        </Link>
        <Link
          to="/admin/deliveries"
          className={`block py-2 px-4 rounded ${activePage === 'deliveries' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          Delivery
        </Link>
        <Link
          to="/admin/inventory"
          className={`block py-2 px-4 rounded ${activePage === 'inventory' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          Inventory
        </Link>
        <Link
          to="/admin/employee"
          className={`block py-2 px-4 rounded ${activePage === 'employee' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
        >
          Employee
        </Link>
        <Link
          to="/admin/income"
          className={`block py-2 px-4 rounded ${activePage === 'income' ? 'bg-blue-700 text-white' : 'hover:bg-blue-600'}`}
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
  );
};

export default AdminSidebar;