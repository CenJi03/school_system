import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoginForm from '../../components/auth/LoginForm';
import toast from 'react-hot-toast';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Set page title
    document.title = 'Login | Language School Management';
    
    // Check if user was redirected from registration
    if (location.state?.registered) {
      toast.success('Registration successful! Please log in.');
    }
    
    // Check if session expired
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
    }
  }, [location]);
  
  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'student') {
        navigate('/courses');
      } else {
        navigate('/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  return (
    <div className="o-auth-page o-auth-page--login">
      <div className="o-auth-container">
        <div className="o-auth-brand">
          <img src="/assets/images/logo.png" alt="School Logo" className="o-auth-brand__logo" />
          <h1 className="o-auth-brand__name">Language School</h1>
          <p className="o-auth-brand__tagline">Learn a language, open new doors</p>
        </div>
        
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
