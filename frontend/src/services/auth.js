// src/services/auth.js

import api from './api';

const authService = {
  // Login user
  login: async (loginId, password, remember = false) => {
    try {
      // Determine if loginId is an email or username
      const loginData = loginId.includes('@') 
        ? { email: loginId, password, remember }
        : { username: loginId, password, remember };
      
      const response = await api.post('/auth/login/', loginData);
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.error ||
        'Login failed. Please check your credentials.'
      );
    }
  },
  
  // Register new user - Fixed endpoint to match backend URL pattern
  register: async (userData) => {
    try {
      // Format the data for the backend
      const formattedData = {
        email: userData.email,
        password: userData.password,
        first_name: userData.fullName.split(' ')[0],
        last_name: userData.fullName.split(' ').slice(1).join(' ') || '',
        username: userData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''), // Generate cleaner username from email
        user_type: userData.role || 'student', // Make sure this matches backend expectations
      };
      
      // Remove frontend-specific fields
      delete formattedData.fullName;
      delete formattedData.confirmPassword;
      delete formattedData.agreeTerms;
      
      // Use the correct endpoint - check Django URLs to ensure this is right
      const response = await api.post('/auth/register/', formattedData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Extract the error message from the response
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response && error.response.data) {
        // Check for field-specific errors
        if (typeof error.response.data === 'object') {
          const fieldErrors = Object.entries(error.response.data)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('; ');
          
          if (fieldErrors) {
            errorMessage = fieldErrors;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          }
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }
      
      throw new Error(errorMessage);
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage, even if the API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },
  
  // Request password reset
  resetPassword: async (email) => {
    try {
      const response = await api.post('/auth/reset-password/', { email });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Password reset request failed. Please try again.'
      );
    }
  },
  
  // Complete password reset with token
  confirmResetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password/confirm/', {
        token,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Password reset failed. Please try again.'
      );
    }
  },
  
  // Get current user
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      localStorage.removeItem('user');
      return null;
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('auth_token');
  }
};

export default authService;