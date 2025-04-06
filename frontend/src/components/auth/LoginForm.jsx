// src/components/auth/LoginForm.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import '../../assets/styles/auth/auth.css';

const LoginForm = () => {
  // State for form data
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    remember: false
  });
  
  // State for error handling and loading
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  // Add state for password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  const handlePasswordVisibility = (isVisible) => {
    setShowPassword(isVisible);
  };

  // Get auth context, navigation, and location
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      if (user.role === 'student') {
        navigate('/courses');
      } else {
        navigate('/dashboard');
      }
    }
    
    // Check if redirected from registration
    if (location.state?.registered) {
      toast.success('Registration successful! Please log in.');
    }
    
    // Check if session expired
    const params = new URLSearchParams(location.search);
    if (params.get('session_expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
    }
  }, [isAuthenticated, user, navigate, location]);
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.loginId.trim()) {
      newErrors.loginId = 'Email or username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await login(formData.loginId, formData.password, formData.remember);
      
      // When login is successful
      if (result.role === 'student') {
        navigate('/courses');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        form: error.message || 'Invalid credentials. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Example usage of localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    console.log('Stored user:', storedUser);
  }, []);

  return (
    <div className="o-auth-form o-auth-form--login">
      <h1 className="o-auth-form__title">Log In</h1>
      
      {errors.form && (
        <div className="o-alert o-alert--danger">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="o-form-group">
          <label htmlFor="loginId" className="o-form-label">Email or Username</label>
          <input
            type="text"
            id="loginId"
            name="loginId"
            className={`o-form-control ${errors.loginId ? 'is-invalid' : ''}`}
            value={formData.loginId}
            onChange={handleChange}
            placeholder="Enter your email or username"
            disabled={isLoading}
          />
          {errors.loginId && <div className="o-form-feedback">{errors.loginId}</div>}
        </div>
        
        <div className="o-form-group">
          <label htmlFor="password" className="o-form-label">Password</label>
          <div className="o-form-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              className={`o-form-control ${errors.password ? 'is-invalid' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="o-form-password-toggle"
              onMouseDown={() => handlePasswordVisibility(true)}
              onMouseUp={() => handlePasswordVisibility(false)}
              onMouseLeave={() => handlePasswordVisibility(false)}
              onTouchStart={() => handlePasswordVisibility(true)}
              onTouchEnd={() => handlePasswordVisibility(false)}
              onTouchCancel={() => handlePasswordVisibility(false)}
              aria-label="Show password"
            >
              <i className="fa fa-eye"></i>
            </button>
          </div>
          {errors.password && <div className="o-form-feedback">{errors.password}</div>}
        </div>
        
        <div className="o-form-group o-form-check">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            className="o-form-check-input"
            checked={formData.remember}
            onChange={handleChange}
            disabled={isLoading}
          />
          <label htmlFor="remember" className="o-form-check-label">Remember me</label>
        </div>
        
        <div className="o-form-group">
          <button
            type="submit"
            className="o-btn o-btn--primary o-btn--block"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </button>
        </div>
        
        <div className="o-auth-form__links">
          <Link to="/forgot-password" className="o-link">Forgot Password?</Link>
          <span className="o-divider">|</span>
          <Link to="/register" className="o-link">Create Account</Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;