// src/components/auth/LoginForm.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const LoginForm = () => {
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.loginId) {
      newErrors.loginId = 'Email or username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Pass loginId and password as separate parameters
      const user = await login(
        formData.loginId, 
        formData.password, 
        formData.remember
      );
      
      // Navigate based on user role
      if (user.role === 'student') {
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
          <input
            type="password"
            id="password"
            name="password"
            className={`o-form-control ${errors.password ? 'is-invalid' : ''}`}
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            disabled={isLoading}
          />
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
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Log In'}
          </Button>
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