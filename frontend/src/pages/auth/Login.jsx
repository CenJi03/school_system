// src/pages/auth/Login.jsx

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import '../../assets/styles/auth/auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Set page title
    document.title = 'Login | Language School Management';

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