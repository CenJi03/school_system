import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RegisterForm from '../../components/auth/RegisterForm';

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  useEffect(() => {
    // Set page title
    document.title = 'Register | Language School Management';
  }, []);
  
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
    <div className="o-auth-page o-auth-page--register">
      <div className="o-auth-container">
        <div className="o-auth-brand">
          <img src="/assets/images/logo.png" alt="School Logo" className="o-auth-brand__logo" />
          <h1 className="o-auth-brand__name">Language School</h1>
          <p className="o-auth-brand__tagline">Join our language learning community</p>
        </div>
        
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
