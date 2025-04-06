import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AccessDenied from '../pages/AccessDenied'; // Create this component

const SystemProtectedRoute = ({ children }) => {
  const { isAuthenticated, hasSystemAccess } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!hasSystemAccess()) {
    return <AccessDenied />;
  }
  
  return children || <Outlet />;
};

export default SystemProtectedRoute;