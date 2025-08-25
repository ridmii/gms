import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './components/Home';
import OrderForm from './components/OrderForm';
import PastOrders from './components/PastOrders';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import OrderDashboard from './components/OrderDashboard';
import CustomerLogin from './components/CustomerLogin';
import CustomerRegister from './components/CustomerRegister';
import ProtectedRoute from './components/ProtectedRoute';
import DeliveryPage from './components/DeliveryManagement'; // Correct import
import Inventory from './components/Inventory';
import Employee from './components/Employee';
import Finance from './components/Finance';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/order" element={<OrderForm />} />
        <Route path="/past-orders" element={<PastOrders />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <OrderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/deliveries"
          element={
            <ProtectedRoute>
              <DeliveryPage /> {/* Changed from DeliveryManagement to DeliveryPage */}
            </ProtectedRoute>
          }
        />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/employee" element={<Employee />} />
        <Route path="/admin/finance" element={<Finance />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;