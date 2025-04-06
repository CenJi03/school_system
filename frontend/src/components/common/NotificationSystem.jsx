// src/components/common/NotificationSystem.jsx

import React, { useState, useCallback, useEffect } from 'react';
import Notification from './Notification';

// Create a context for the notification system
import { createContext, useContext } from 'react';

const NotificationContext = createContext();

// Generate unique IDs for notifications
const generateId = () => `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Add a new notification
  const addNotification = useCallback((message, options = {}) => {
    const id = options.id || generateId();
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        message,
        type: options.type || 'info',
        duration: options.duration !== undefined ? options.duration : 3000,
        position: options.position || 'top-right',
        isVisible: true
      }
    ]);
    
    return id;
  }, []);
  
  // Helper methods for different notification types
  const notifySuccess = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: 'success' });
  }, [addNotification]);
  
  const notifyError = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: 'error' });
  }, [addNotification]);
  
  const notifyWarning = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: 'warning' });
  }, [addNotification]);
  
  const notifyInfo = useCallback((message, options = {}) => {
    return addNotification(message, { ...options, type: 'info' });
  }, [addNotification]);
  
  // Remove a notification
  const removeNotification = useCallback(id => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);
  
  // Export the notification API
  const contextValue = {
    notify: addNotification,
    success: notifySuccess,
    error: notifyError,
    warning: notifyWarning,
    info: notifyInfo,
    remove: removeNotification
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer 
        notifications={notifications} 
        removeNotification={removeNotification} 
      />
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification system
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Container component to render notifications
const NotificationContainer = ({ notifications, removeNotification }) => {
  // Group notifications by position
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {});
  
  return Object.entries(groupedNotifications).map(([position, notificationsInPosition]) => (
    <div key={position} className={`o-notification-container o-notification-container--${position}`}>
      {notificationsInPosition.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          position={notification.position}
          isVisible={notification.isVisible}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  ));
};

export default NotificationProvider;