// src/components/layout/Header.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-logo">
          <Link to="/dashboard">
            <img src="/assets/images/logo.png" alt="School Logo" />
            <span>Language School</span>
          </Link>
        </div>
        
        <div className="header-actions">
          <div className="notifications">
            <i className="fa fa-bell"></i>
            {/* Notification indicator */}
            <span className="badge">3</span>
          </div>
          
          <div className="user-profile" onClick={() => setMenuOpen(!menuOpen)}>
            <img src={user?.avatar || '/assets/images/default-avatar.png'} alt="User" />
            <span>{user?.name || 'User'}</span>
            <i className={`fa fa-chevron-${menuOpen ? 'up' : 'down'}`}></i>
            
            {menuOpen && (
              <div className="dropdown-menu">
                <Link to="/profile">Profile</Link>
                <Link to="/settings">Settings</Link>
                <button onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;