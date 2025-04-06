// src/pages/dashboard/Dashboard.jsx

import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import "../../assets/styles/dashboard/dashboard.css";

/**
 * Dashboard router component that redirects to the appropriate
 * dashboard based on user role
 */
const Dashboard = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Set page title
    document.title = 'Dashboard | Language School Management';
  }, []);
  
  if (loading) {
    return (
      <div className="o-loading-page">
        <div className="o-loading__spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is admin and we're at the general dashboard, redirect to admin dashboard
  if (user.role === 'admin' && location.pathname === '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  // Always return the admin dashboard
  return <AdminDashboard />;
};

export default Dashboard;