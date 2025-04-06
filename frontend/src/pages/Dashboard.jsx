import React from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from './dashboard/AdminDashboard';
import LimitedAccessDashboard from './dashboard/LimitedAccessDashboard';

const Dashboard = () => {
  const { user, hasSystemAccess } = useAuth();
  
  if (!hasSystemAccess()) {
    return <LimitedAccessDashboard />;
  }
  
  // Show appropriate dashboard based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <LimitedAccessDashboard />;
  }
};

export default Dashboard;