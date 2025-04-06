// src/hooks/useToast.js

import { useCallback } from 'react';
import { useNotification } from '../components/common/NotificationSystem';

/**
 * Custom hook to provide a toast-like API that uses our notification system
 * This provides a drop-in replacement for react-hot-toast
 */
const useToast = () => {
  const notification = useNotification();
  
  // Basic toast function
  const toast = useCallback((message, options = {}) => {
    return notification.notify(message, options);
  }, [notification]);
  
  // Success toast
  toast.success = useCallback((message, options = {}) => {
    return notification.success(message, options);
  }, [notification]);
  
  // Error toast
  toast.error = useCallback((message, options = {}) => {
    return notification.error(message, options);
  }, [notification]);
  
  // Warning toast
  toast.warning = useCallback((message, options = {}) => {
    return notification.warning(message, options);
  }, [notification]);
  
  // Info toast
  toast.info = useCallback((message, options = {}) => {
    return notification.info(message, options);
  }, [notification]);
  
  // Remove a specific toast by ID
  toast.remove = useCallback((id) => {
    notification.remove(id);
  }, [notification]);
  
  // Create a loading toast that can be updated later
  toast.loading = useCallback((message, options = {}) => {
    // Create a persistent notification (by setting duration to 0)
    const id = notification.notify(message, {
      ...options,
      duration: 0,
      type: 'info',
      // Add loading indicator styling if needed
      message: (
        <div className="o-toast-loading">
          <div className="o-toast-loading__spinner"></div>
          <div className="o-toast-loading__message">{message}</div>
        </div>
      )
    });
    
    // Return object with methods to update or dismiss the toast
    return {
      id,
      update: (newMessage, newOptions = {}) => {
        notification.remove(id);
        return notification.notify(newMessage, {
          ...options,
          ...newOptions,
          id
        });
      },
      success: (newMessage, newOptions = {}) => {
        notification.remove(id);
        return notification.success(newMessage, {
          ...options,
          ...newOptions,
          id
        });
      },
      error: (newMessage, newOptions = {}) => {
        notification.remove(id);
        return notification.error(newMessage, {
          ...options,
          ...newOptions,
          id
        });
      },
      dismiss: () => notification.remove(id)
    };
  }, [notification]);
  
  // Dismiss all toasts
  toast.dismiss = useCallback(() => {
    // This would require an additional method in the notification context
    // For now, we'll leave this as a placeholder
    console.warn('toast.dismiss() is not fully implemented');
  }, []);
  
  return toast;
};

export default useToast;