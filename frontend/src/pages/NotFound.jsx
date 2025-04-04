import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Set page title
    document.title = 'Page Not Found | Language School Management';
  }, []);
  
  // Determine where to redirect based on authentication status and role
  const getHomeLink = () => {
    if (!isAuthenticated || !user) {
      return '/';
    }
    
    switch (user.role) {
      case 'student':
        return '/courses';
      case 'teacher':
      case 'admin':
      default:
        return '/dashboard';
    }
  };
  
  return (
    <div className="o-not-found">
      <div className="o-not-found__container">
        <h1 className="o-not-found__code">404</h1>
        <h2 className="o-not-found__title">Page Not Found</h2>
        <p className="o-not-found__message">
          The page you are looking for might have been removed,
          had its name changed, or is temporarily unavailable.
        </p>
        <Link to={getHomeLink()} className="o-btn o-btn--primary">
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
