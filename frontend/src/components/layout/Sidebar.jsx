// src/components/layout/Sidebar.jsx

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  
  // Define menu items based on user role
  const getMenuItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: 'fa-dashboard', label: 'Dashboard' },
    ];
    
    const adminItems = [
      { path: '/curriculum', icon: 'fa-book', label: 'Curriculum' },
      { path: '/students', icon: 'fa-users', label: 'Students' },
      { path: '/staff', icon: 'fa-user-tie', label: 'Staff' },
      { path: '/facilities', icon: 'fa-building', label: 'Facilities' },
      { path: '/finance', icon: 'fa-money-bill', label: 'Finance' },
      { path: '/marketing', icon: 'fa-bullhorn', label: 'Marketing' },
      { path: '/quality', icon: 'fa-chart-line', label: 'Quality' },
    ];
    
    const teacherItems = [
      { path: '/curriculum', icon: 'fa-book', label: 'Curriculum' },
      { path: '/students', icon: 'fa-users', label: 'Students' },
      { path: '/schedule', icon: 'fa-calendar', label: 'Schedule' },
    ];
    
    const studentItems = [
      { path: '/courses', icon: 'fa-graduation-cap', label: 'My Courses' },
      { path: '/progress', icon: 'fa-chart-line', label: 'My Progress' },
      { path: '/payments', icon: 'fa-credit-card', label: 'Payments' },
    ];
    
    switch(user?.role) {
      case 'admin':
        return [...commonItems, ...adminItems];
      case 'teacher':
        return [...commonItems, ...teacherItems];
      case 'student':
        return [...commonItems, ...studentItems];
      default:
        return commonItems;
    }
  };
  
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        <i className={`fa fa-chevron-${collapsed ? 'right' : 'left'}`}></i>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {getMenuItems().map((item, index) => (
            <li key={index}>
              <NavLink to={item.path} className={({ isActive }) => isActive ? 'active' : ''}>
                <i className={`fa ${item.icon}`}></i>
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;