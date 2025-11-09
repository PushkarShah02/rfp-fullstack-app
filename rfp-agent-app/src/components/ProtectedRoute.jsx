import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { token } = useAuth();

  // If there's a token, show the protected content (via <Outlet />)
  // Otherwise, redirect to the /login page
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;