import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard as DashboardIcon,
  ShoppingBag as OrdersIcon,
  Truck as DeliveryIcon,
  Package as InventoryIcon,
  Users as EmployeeIcon,
  DollarSign as FinanceIcon,
  LogOut as LogoutIcon,
} from 'lucide-react';

const AdminSidebar = ({ activePage }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-gray-900 text-white p-6 fixed h-full shadow-xl transition-all duration-300">
      <div className="text-3xl font-bold mb-8 text-indigo-300">Dimalsha Fashions</div>
      <nav className="space-y-5">
        <Link
          to="/admin/dashboard"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'dashboard' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <DashboardIcon size={20} />
          <span className="text-lg">Dashboard</span>
        </Link>
        <Link
          to="/admin/orders"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'orders' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <OrdersIcon size={20} />
          <span className="text-lg">Orders</span>
        </Link>
        <Link
          to="/admin/deliveries"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'deliveries' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <DeliveryIcon size={20} />
          <span className="text-lg">Delivery</span>
        </Link>
        <Link
          to="/admin/inventory"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'inventory' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <InventoryIcon size={20} />
          <span className="text-lg">Inventory</span>
        </Link>
        <Link
          to="/admin/employee"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'employee' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <EmployeeIcon size={20} />
          <span className="text-lg">Employee</span>
        </Link>
        <Link
          to="/admin/finance"
          className={`flex items-center gap-3 py-3 px-4 rounded-lg ${activePage === 'finance' ? 'bg-blue-800 text-white' : 'hover:bg-gray-800'}`}
        >
          <FinanceIcon size={20} />
          <span className="text-lg">Salary & Finance</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-left py-3 px-4 rounded-lg hover:bg-red-700 mt-8 text-white"
        >
          <LogoutIcon size={20} />
          <span className="text-lg">Logout</span>
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;