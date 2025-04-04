// src/hooks/useAuth.js

import { useState, useEffect, useContext, createContext } from 'react';
import authService from '../services/auth';

// Create a context for authentication
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize auth state on component mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);
  
  // Login function - updated to support multiple login types
  const login = async (loginId, password, remember) => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      // Detect if loginId is an object (for social login) or string (for traditional login)
      if (typeof loginId === 'object') {
        // Social login or specialized authentication
        result = await authService.login(loginId);
      } else {
        // Traditional login with username/email and password
        // Ensure password and remember are passed correctly
        result = await authService.login(loginId, password, remember);
      }
      
      setUser(result.user);
      return result.user;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      return await authService.register(userData);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await authService.logout();
      setUser(null);
    } catch (err) {
      setError(err);
      // Still clear user on frontend even if logout API fails
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Update profile function
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Password reset function
  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      return await authService.resetPassword(email);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Complete reset password with token
  const confirmResetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      return await authService.confirmResetPassword(token, newPassword);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!user) return false;
    
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    
    return user.role === roles;
  };
  
  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    confirmResetPassword,
    hasRole,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;