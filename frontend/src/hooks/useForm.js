import { useState, useCallback } from 'react';
import { validateForm } from '../components/forms/FormValidation';

const useForm = (initialValues = {}, validationRules = {}, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitError(null);
  }, [initialValues]);
  
  // Set form values programmatically
  const setFormValues = useCallback((newValues) => {
    setValues(prevValues => ({
      ...prevValues,
      ...newValues
    }));
  }, []);
  
  // Validate a single field
  const validateField = useCallback((name, value) => {
    if (!validationRules[name]) return '';
    
    const fieldErrors = validateForm({ [name]: value }, { [name]: validationRules[name] });
    return fieldErrors[name] || '';
  }, [validationRules]);
  
  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target || {};
    const inputValue = type === 'checkbox' ? checked : value;
    
    setValues(prevValues => ({
      ...prevValues,
      [name]: inputValue
    }));
    
    // Validate field if it's been touched
    if (touched[name]) {
      const fieldError = validateField(name, inputValue);
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: fieldError
      }));
    }
  }, [touched, validateField]);
  
  // Handle custom value change (not from event)
  const setFieldValue = useCallback((name, value) => {
    setValues(prevValues => ({
      ...prevValues,
      [name]: value
    }));
    
    // Validate field if it's been touched
    if (touched[name]) {
      const fieldError = validateField(name, value);
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: fieldError
      }));
    }
  }, [touched, validateField]);
  
  // Handle input blur events to validate on field exit
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prevTouched => ({
      ...prevTouched,
      [name]: true
    }));
    
    // Validate the field
    const fieldError = validateField(name, values[name]);
    setErrors(prevErrors => ({
      ...prevErrors,
      [name]: fieldError
    }));
  }, [validateField, values]);
  
  // Validate all form fields
  const validateAllFields = useCallback(() => {
    const formErrors = validateForm(values, validationRules);
    setErrors(formErrors);
    
    // Mark all fields as touched
    const allTouched = Object.keys(validationRules).reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    return Object.keys(formErrors).length === 0;
  }, [values, validationRules]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    // Validate all fields
    const isValid = validateAllFields();
    
    if (!isValid || !onSubmit) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await onSubmit(values);
    } catch (error) {
      setSubmitError(error.message || 'Form submission failed');
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, validateAllFields, values]);
  
  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFormValues,
    resetForm,
    validateField,
    validateAllFields
  };
};

export default useForm;
