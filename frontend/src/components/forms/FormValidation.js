// src/components/forms/FormValidation.js

/**
 * Form validation helper functions
 */

export const validateRequired = (value, message = 'This field is required') => {
    if (!value) return message;
    if (typeof value === 'string' && !value.trim()) return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return '';
  };
  
  export const validateEmail = (value, message = 'Please enter a valid email address') => {
    if (!value) return '';
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(value) ? '' : message;
  };
  
  export const validateMinLength = (value, minLength, message) => {
    if (!value) return '';
    return value.length < minLength 
      ? message || `Must be at least ${minLength} characters` 
      : '';
  };
  
  export const validateMaxLength = (value, maxLength, message) => {
    if (!value) return '';
    return value.length > maxLength 
      ? message || `Must be no more than ${maxLength} characters` 
      : '';
  };
  
  export const validateMatch = (value, matchValue, message = 'Values do not match') => {
    return value !== matchValue ? message : '';
  };
  
  export const validateNumber = (value, message = 'Please enter a valid number') => {
    if (!value) return '';
    return isNaN(Number(value)) ? message : '';
  };
  
  export const validateInteger = (value, message = 'Please enter a whole number') => {
    if (!value) return '';
    return !Number.isInteger(Number(value)) ? message : '';
  };
  
  export const validateMinValue = (value, min, message) => {
    if (!value) return '';
    return Number(value) < min 
      ? message || `Must be at least ${min}` 
      : '';
  };
  
  export const validateMaxValue = (value, max, message) => {
    if (!value) return '';
    return Number(value) > max 
      ? message || `Must be no more than ${max}` 
      : '';
  };
  
  export const validatePattern = (value, pattern, message = 'Invalid format') => {
    if (!value) return '';
    return !pattern.test(value) ? message : '';
  };
  
  /**
   * Run multiple validations and return the first error
   */
  export const validateField = (value, validations) => {
    for (const validation of validations) {
      const error = validation(value);
      if (error) return error;
    }
    return '';
  };
  
  /**
   * Validate all fields in a form and return errors object
   */
  export const validateForm = (values, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const fieldValidations = validationRules[field];
      const error = validateField(values[field], fieldValidations);
      if (error) {
        errors[field] = error;
      }
    });
    
    return errors;
  };