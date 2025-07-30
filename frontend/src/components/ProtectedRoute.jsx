import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  // If no token, redirect to login
  if (token === null) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render children if token exists
  return children;
};

export default ProtectedRoute;