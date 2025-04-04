// src/components/common/Modal.jsx

import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'medium',
  closeOnOutsideClick = true,
  className = '',
  ...props
}) => {
  const modalRef = useRef(null);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    const handleOutsideClick = (e) => {
      if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      document.body.style.overflow = ''; // Restore scrolling when modal is closed
    };
  }, [isOpen, onClose, closeOnOutsideClick]);
  
  if (!isOpen) return null;
  
  const baseClass = 'o-modal';
  const sizeClass = size ? `${baseClass}--${size}` : '';
  
  const modalClasses = [
    baseClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
  
  const modalContent = (
    <div className={`${baseClass}__overlay`}>
      <div className={modalClasses} ref={modalRef} {...props}>
        <div className={`${baseClass}__header`}>
          <h3 className={`${baseClass}__title`}>{title}</h3>
          <button 
            className={`${baseClass}__close`} 
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        
        <div className={`${baseClass}__body`}>
          {children}
        </div>
        
        {footer && (
          <div className={`${baseClass}__footer`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(modalContent, document.body);
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'fullscreen']),
  closeOnOutsideClick: PropTypes.bool,
  className: PropTypes.string
};

export default Modal;