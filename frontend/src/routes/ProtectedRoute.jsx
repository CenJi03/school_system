// src/routes/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PropTypes from 'prop-types';

const ProtectedRoute = ({ children, roles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  // Show loading state if auth is still initializing
  if (loading) {
    return (
      <div className="o-loading">
        <div className="o-loading__spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Check for required roles
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'student') {
      return <Navigate to="/courses" replace />;
    } else if (user?.role === 'teacher') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // If user has required role or no roles specified, render children
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  roles: PropTypes.array
};

export default ProtectedRoute;