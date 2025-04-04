import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PasswordReset from '../../components/auth/PasswordReset';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Set page title
    document.title = 'Forgot Password | Language School Management';
  }, []);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      // Redirect to dashboard
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);
  
  return (
    <div className="o-auth-page o-auth-page--reset">
      <div className="o-auth-container">
        <div className="o-auth-brand">
          <img src="/assets/images/logo.png" alt="School Logo" className="o-auth-brand__logo" />
          <h1 className="o-auth-brand__name">Language School</h1>
          <p className="o-auth-brand__tagline">Reset your password</p>
        </div>
        
        <PasswordReset />
      </div>
    </div>
  );
};

export default ForgotPassword;
