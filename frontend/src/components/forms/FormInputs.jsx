// src/components/forms/FormInputs.jsx

import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

export const TextInput = forwardRef(({
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClass = 'o-form-control';
  const errorClass = error ? 'o-form-control--error' : '';
  const disabledClass = disabled ? 'o-form-control--disabled' : '';
  
  const inputClasses = [
    baseClass,
    errorClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="o-form-group">
      {label && (
        <label htmlFor={name} className="o-form-label">
          {label}
          {required && <span className="o-form-required">*</span>}
        </label>
      )}
      
      <input
        id={name}
        name={name}
        type="text"
        ref={ref}
        className={inputClasses}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        {...props}
      />
      
      {error && <div className="o-form-feedback">{error}</div>}
    </div>
  );
});

export const TextArea = forwardRef(({
  name,
  label,
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  rows = 4,
  className = '',
  ...props
}, ref) => {
  const baseClass = 'o-form-control';
  const errorClass = error ? 'o-form-control--error' : '';
  const disabledClass = disabled ? 'o-form-control--disabled' : '';
  
  const textareaClasses = [
    baseClass,
    errorClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="o-form-group">
      {label && (
        <label htmlFor={name} className="o-form-label">
          {label}
          {required && <span className="o-form-required">*</span>}
        </label>
      )}
      
      <textarea
        id={name}
        name={name}
        ref={ref}
        className={textareaClasses}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        {...props}
      />
      
      {error && <div className="o-form-feedback">{error}</div>}
    </div>
  );
});

export const SelectInput = forwardRef(({
  name,
  label,
  value,
  onChange,
  options,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClass = 'o-form-control';
  const errorClass = error ? 'o-form-control--error' : '';
  const disabledClass = disabled ? 'o-form-control--disabled' : '';
  
  const selectClasses = [
    baseClass,
    errorClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="o-form-group">
      {label && (
        <label htmlFor={name} className="o-form-label">
          {label}
          {required && <span className="o-form-required">*</span>}
        </label>
      )}
      
      <select
        id={name}
        name={name}
        ref={ref}
        className={selectClasses}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && <div className="o-form-feedback">{error}</div>}
    </div>
  );
});

export const CheckboxInput = forwardRef(({
  name,
  label,
  checked,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}, ref) => {
  const baseClass = 'o-form-check-input';
  const errorClass = error ? 'o-form-check-input--error' : '';
  const disabledClass = disabled ? 'o-form-check-input--disabled' : '';
  
  const checkboxClasses = [
    baseClass,
    errorClass,
    disabledClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className="o-form-check">
      <input
        type="checkbox"
        id={name}
        name={name}
        ref={ref}
        className={checkboxClasses}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        required={required}
        {...props}
      />
      
      {label && (
        <label htmlFor={name} className="o-form-check-label">
          {label}
          {required && <span className="o-form-required">*</span>}
        </label>
      )}
      
      {error && <div className="o-form-feedback">{error}</div>}
    </div>
  );
});

// PropTypes for each component
TextInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string
};

TextArea.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string
};

SelectInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string
};

CheckboxInput.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.node,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string
};

TextInput.displayName = 'TextInput';
TextArea.displayName = 'TextArea';
SelectInput.displayName = 'SelectInput';
CheckboxInput.displayName = 'CheckboxInput';