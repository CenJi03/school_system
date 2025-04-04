// src/components/auth/RegisterForm.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the terms and conditions';
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
    
    try {
      await register(formData);
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      setErrors({
        form: error.message || 'Registration failed'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="o-auth-form o-auth-form--register">
      <h1 className="o-auth-form__title">Create Account</h1>
      
      {errors.form && (
        <div className="o-alert o-alert--danger">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="o-form-group">
          <label htmlFor="fullName" className="o-form-label">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className={`o-form-control ${errors.fullName ? 'is-invalid' : ''}`}
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {errors.fullName && <div className="o-form-feedback">{errors.fullName}</div>}
        </div>
        
        <div className="o-form-group">
          <label htmlFor="email" className="o-form-label">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className={`o-form-control ${errors.email ? 'is-invalid' : ''}`}
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            disabled={isLoading}
          />
          {errors.email && <div className="o-form-feedback">{errors.email}</div>}
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
            placeholder="Create a password"
            disabled={isLoading}
          />
          {errors.password && <div className="o-form-feedback">{errors.password}</div>}
        </div>
        
        <div className="o-form-group">
          <label htmlFor="confirmPassword" className="o-form-label">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className={`o-form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          {errors.confirmPassword && <div className="o-form-feedback">{errors.confirmPassword}</div>}
        </div>
        
        <div className="o-form-group">
          <label htmlFor="role" className="o-form-label">I am a</label>
          <select
            id="role"
            name="role"
            className="o-form-control"
            value={formData.role}
            onChange={handleChange}
            disabled={isLoading}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="parent">Parent</option>
          </select>
        </div>
        
        <div className="o-form-group o-form-check">
          <input
            type="checkbox"
            id="agreeTerms"
            name="agreeTerms"
            className={`o-form-check-input ${errors.agreeTerms ? 'is-invalid' : ''}`}
            checked={formData.agreeTerms}
            onChange={handleChange}
            disabled={isLoading}
          />
          <label htmlFor="agreeTerms" className="o-form-check-label">
            I agree to the <Link to="/terms" target="_blank">Terms of Service</Link> and <Link to="/privacy" target="_blank">Privacy Policy</Link>
          </label>
          {errors.agreeTerms && <div className="o-form-feedback">{errors.agreeTerms}</div>}
        </div>
        
        <div className="o-form-group">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
        
        <div className="o-auth-form__links">
          <span>Already have an account?</span>
          <Link to="/login" className="o-link">Log In</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;