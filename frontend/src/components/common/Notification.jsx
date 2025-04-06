// src/components/common/Notification.jsx

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const Notification = ({
  message,
  type = 'info',
  duration = 3000,
  position = 'top-right',
  onClose,
  isVisible = true
}) => {
  const [isShowing, setIsShowing] = useState(isVisible);
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Close notification after duration
  useEffect(() => {
    if (!isVisible || !isShowing || duration === 0) return;
    
    const timer = setTimeout(() => {
      handleClose();
    }, duration);
    
    return () => clearTimeout(timer);
  }, [isVisible, isShowing, duration]);
  
  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      setIsShowing(true);
      setIsLeaving(false);
    }
  }, [isVisible]);
  
  // Close notification with animation
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    
    // Wait for animation to complete before removing from DOM
    const timer = setTimeout(() => {
      setIsShowing(false);
      if (onClose) onClose();
    }, 300); // Animation duration
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Classes based on notification type and position
  const getTypeClass = () => {
    switch (type) {
      case 'success': return 'o-notification--success';
      case 'error': return 'o-notification--error';
      case 'warning': return 'o-notification--warning';
      default: return 'o-notification--info';
    }
  };
  
  const getPositionClass = () => {
    switch (position) {
      case 'top-left': return 'o-notification--top-left';
      case 'top-center': return 'o-notification--top-center';
      case 'bottom-left': return 'o-notification--bottom-left';
      case 'bottom-center': return 'o-notification--bottom-center';
      case 'bottom-right': return 'o-notification--bottom-right';
      default: return 'o-notification--top-right';
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <i className="fa fa-check-circle"></i>;
      case 'error': return <i className="fa fa-exclamation-circle"></i>;
      case 'warning': return <i className="fa fa-exclamation-triangle"></i>;
      default: return <i className="fa fa-info-circle"></i>;
    }
  };
  
  if (!isShowing) return null;
  
  const notificationClasses = [
    'o-notification',
    getTypeClass(),
    getPositionClass(),
    isLeaving ? 'o-notification--leaving' : ''
  ].filter(Boolean).join(' ');
  
  return createPortal(
    <div className={notificationClasses} role="alert">
      <div className="o-notification__icon">
        {getIcon()}
      </div>
      <div className="o-notification__content">
        {message}
      </div>
      <button 
        className="o-notification__close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        <i className="fa fa-times"></i>
      </button>
    </div>,
    document.body
  );
};

Notification.propTypes = {
  message: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  duration: PropTypes.number,
  position: PropTypes.oneOf([
    'top-right', 
    'top-left', 
    'top-center', 
    'bottom-right', 
    'bottom-left', 
    'bottom-center'
  ]),
  onClose: PropTypes.func,
  isVisible: PropTypes.bool
};

export default Notification;