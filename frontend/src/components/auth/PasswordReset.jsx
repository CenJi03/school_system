import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const PasswordReset = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { resetPassword } = useAuth();
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      setErrors({
        form: error.message || 'Password reset failed'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="o-auth-form o-auth-form--reset">
        <div className="o-auth-form__success">
          <i className="fa fa-check-circle"></i>
          <h2>Check Your Email</h2>
          <p>We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.</p>
          <p>If you don't see the email, check your spam folder.</p>
          <div className="o-auth-form__links">
            <Link to="/login" className="o-link">Back to Login</Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="o-auth-form o-auth-form--reset">
      <h1 className="o-auth-form__title">Reset Password</h1>
      <p className="o-auth-form__subtitle">Enter your email address, and we'll send you a link to reset your password.</p>
      
      {errors.form && (
        <div className="o-alert o-alert--danger">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="o-auth-form__form">
        <div className="o-form-group">
          <label htmlFor="email" className="o-form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className={`o-form-control ${errors.email ? 'o-form-control--error' : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
          {errors.email && (
            <span className="o-form-error-text">{errors.email}</span>
          )}
        </div>
        
        <Button 
          type="submit"
          className="o-btn o-btn--primary o-btn--block"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Send Reset Link
        </Button>
        
        <div className="o-auth-form__links">
          <Link to="/login" className="o-link">Back to Login</Link>
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;
