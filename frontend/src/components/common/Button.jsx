// src/components/common/Button.jsx

import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  variant = 'primary',
  size = 'medium',
  type = 'button',
  children,
  icon,
  fullWidth = false,
  disabled = false,
  isLoading = false,
  className = '',
  as: Component = 'button',
  ...props
}) => {
  const baseClass = 'o-btn';
  const variantClass = variant ? `${baseClass}--${variant}` : '';
  const sizeClass = size ? `${baseClass}--${size}` : '';
  const blockClass = fullWidth ? `${baseClass}--block` : '';
  const disabledClass = disabled || isLoading ? `${baseClass}--disabled` : '';
  
  const buttonClasses = [
    baseClass,
    variantClass,
    sizeClass,
    blockClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <Component 
      className={buttonClasses}
      type={Component === 'button' ? type : undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className={`${baseClass}__spinner`}></span>
      )}
      {icon && !isLoading && (
        <span className={`${baseClass}__icon`}>{icon}</span>
      )}
      {children && (
        <span className={`${baseClass}__text`}>{children}</span>
      )}
    </Component>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'light', 'link', 'icon', 'danger', 'warning', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  children: PropTypes.node,
  icon: PropTypes.node,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  className: PropTypes.string,
  as: PropTypes.elementType
};

export default Button;