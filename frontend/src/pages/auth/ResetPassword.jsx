import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';
import '../../assets/styles/auth/auth.css';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(null);
  
  const { token } = useParams();
  const navigate = useNavigate();
  const { confirmResetPassword } = useAuth();
  
  useEffect(() => {
    // Set page title
    document.title = 'Reset Password | Language School Management';
    
    // Validate token
    const validateToken = async () => {
      // In a real app, you'd validate the token with a backend API call
      setIsTokenValid(true);
    };
    
    validateToken();
  }, [token]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      await confirmResetPassword(token, password);
      setIsSubmitted(true);
      toast.success('Password has been reset successfully');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setErrors({
        form: error.message || 'Password reset failed'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isTokenValid === null) {
    return (
      <div className="o-auth-page o-auth-page--reset">
        <div className="o-auth-container">
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Validating reset token...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="o-auth-page o-auth-page--reset">
        <div className="o-auth-container">
          <div className="o-auth-form o-auth-form--reset">
            <div className="o-auth-form__error">
              <i className="fa fa-times-circle"></i>
              <h2>Invalid or Expired Link</h2>
              <p>The password reset link is invalid or has expired.</p>
              <div className="o-auth-form__links">
                <Link to="/forgot-password" className="o-btn o-btn--primary">Request New Link</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="o-auth-page o-auth-page--reset">
        <div className="o-auth-container">
          <div className="o-auth-form o-auth-form--reset">
            <div className="o-auth-form__success">
              <i className="fa fa-check-circle"></i>
              <h2>Password Reset Successful</h2>
              <p>Your password has been reset successfully.</p>
              <p>You will be redirected to the login page shortly.</p>
              <div className="o-auth-form__links">
                <Link to="/login" className="o-link">Log In Now</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="o-auth-page o-auth-page--reset">
      <div className="o-auth-container">
        <div className="o-auth-brand">
          <img src="/assets/images/logo.png" alt="School Logo" className="o-auth-brand__logo" />
          <h1 className="o-auth-brand__name">Language School</h1>
          <p className="o-auth-brand__tagline">Set your new password</p>
        </div>

        <div className="o-auth-form o-auth-form--reset">
          <h1 className="o-auth-form__title">Create New Password</h1>

          {errors.form && (
            <div className="o-alert o-alert--danger">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="o-auth-form__form">
            <div className="o-form-group">
              <label htmlFor="password" className="o-form-label">
                New Password
              </label>
              <input
                id="password"
                type="password"
                className={`o-form-control ${errors.password ? 'o-form-control--error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                disabled={isLoading}
              />
              {errors.password && (
                <span className="o-form-error-text">{errors.password}</span>
              )}
            </div>

            <div className="o-form-group">
              <label htmlFor="confirmPassword" className="o-form-label">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`o-form-control ${errors.confirmPassword ? 'o-form-control--error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                disabled={isLoading}
              />
              {errors.confirmPassword && (
                <span className="o-form-error-text">{errors.confirmPassword}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>

            <div className="o-auth-form__links">
              <Link to="/login" className="o-link">Back to Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
