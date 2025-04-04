// src/components/common/Card.jsx

import React from 'react';
import PropTypes from 'prop-types';

const Card = ({
  title,
  subtitle,
  children,
  footer,
  variant = 'default',
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  ...props
}) => {
  const baseClass = 'o-card';
  const variantClass = variant ? `${baseClass}--${variant}` : '';
  
  const cardClasses = [
    baseClass,
    variantClass,
    className
  ].filter(Boolean).join(' ');
  
  const headerClasses = [
    `${baseClass}__header`,
    headerClassName
  ].filter(Boolean).join(' ');
  
  const bodyClasses = [
    `${baseClass}__body`,
    bodyClassName
  ].filter(Boolean).join(' ');
  
  const footerClasses = [
    `${baseClass}__footer`,
    footerClassName
  ].filter(Boolean).join(' ');
  
  return (
    <div className={cardClasses} {...props}>
      {(title || subtitle) && (
        <div className={headerClasses}>
          {title && <h3 className={`${baseClass}__title`}>{title}</h3>}
          {subtitle && <p className={`${baseClass}__subtitle`}>{subtitle}</p>}
        </div>
      )}
      
      <div className={bodyClasses}>
        {children}
      </div>
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.node,
  subtitle: PropTypes.node,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'compact', 'outlined', 'shadowed']),
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  headerClassName: PropTypes.string,
  footerClassName: PropTypes.string
};

export default Card;