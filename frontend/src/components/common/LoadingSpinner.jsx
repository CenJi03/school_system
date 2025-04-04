// src/components/common/LoadingSpinner.jsx

import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = 'primary', 
  text = 'Loading...', 
  fullPage = false,
  transparent = false
}) => {
  // Determine size in pixels
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60
  };
  
  const spinnerSize = sizeMap[size] || sizeMap.medium;
  const borderSize = Math.max(3, Math.floor(spinnerSize / 12));
  
  // Determine color
  const colorMap = {
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    success: 'var(--color-success)',
    danger: 'var(--color-danger)',
    warning: 'var(--color-warning)',
    info: 'var(--color-info)',
    light: 'var(--color-text-light)',
    dark: 'var(--color-text)'
  };
  
  const spinnerColor = colorMap[color] || colorMap.primary;
  
  const spinnerStyle = {
    width: `${spinnerSize}px`,
    height: `${spinnerSize}px`,
    borderWidth: `${borderSize}px`,
    borderColor: `rgba(${spinnerColor}, 0.1)`,
    borderTopColor: spinnerColor
  };
  
  const containerClasses = `
    o-loading-container 
    ${fullPage ? 'o-loading-container--fullpage' : ''} 
    ${transparent ? 'o-loading-container--transparent' : ''}
  `.trim();
  
  return (
    <div className={containerClasses}>
      <div 
        className="o-loading__spinner" 
        style={spinnerStyle}
        role="status"
        aria-label="Loading content"
      />
      {text && <p className="o-loading__text">{text}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']),
  text: PropTypes.string,
  fullPage: PropTypes.bool,
  transparent: PropTypes.bool
};

export default LoadingSpinner;