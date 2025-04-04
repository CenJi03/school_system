// src/services/auth.js

import api from './api';

const authService = {
  // Login user with multiple authentication methods
  login: async (credentials, remember = false) => {
    try {
      // Determine login type based on credentials
      let loginData = {};
      
      if (typeof credentials === 'object') {
        // If credentials is an object with specific login data
        loginData = { ...credentials, remember };
      } else if (credentials.includes('@')) {
        // Email-based login
        loginData = { email: credentials, password: arguments[1], remember };
      } else {
        // Username-based login
        loginData = { username: credentials, password: arguments[1], remember };
      }
      
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
  
  // Social login
  socialLogin: async (provider, accessToken) => {
    try {
      const response = await api.post(`/auth/social/${provider}/`, { 
        access_token: accessToken 
      });
      
      const { token, user } = response.data;
      
      // Store token and user in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error) {
      console.error('Social login error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Social login failed. Please try again.'
      );
    }
  },
  
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register/', userData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Registration failed. Please try again.'
      );
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
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile/', userData);
      
      // Update stored user data
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Profile update failed. Please try again.'
      );
    }
  },
  
  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 
        'Password change failed. Please try again.'
      );
    }
  }
};

export default authService;