// src/utils/dates.js

/**
 * Date formatting and manipulation utilities
 */

// Format a date using Intl.DateTimeFormat
export const formatDate = (date, options = {}) => {
    if (!date) return '';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  };
  
  // Format date with time
  export const formatDateTime = (date, options = {}) => {
    return formatDate(date, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    });
  };
  
  // Format time only
  export const formatTime = (date, options = {}) => {
    if (!date) return '';
    
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
  };
  
  // Get a readable relative time format (e.g., "2 days ago")
  export const getRelativeTimeString = (date) => {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
  };
  
  // Check if a date is today
  export const isToday = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  };
  
  // Check if a date is in the past
  export const isPast = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj < new Date();
  };
  
  // Check if a date is in the future
  export const isFuture = (date) => {
    if (!date) return false;
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj > new Date();
  };
  
  // Add days to a date
  export const addDays = (date, days) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setDate(dateObj.getDate() + days);
    return dateObj;
  };
  
  // Get the start of a day (midnight)
  export const startOfDay = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  };
  
  // Get the end of a day (23:59:59.999)
  export const endOfDay = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setHours(23, 59, 59, 999);
    return dateObj;
  };
  
  // Get the start of a week (Sunday, midnight)
  export const startOfWeek = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const day = dateObj.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = dateObj.getDate() - day;
    const result = new Date(dateObj);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  };
  
  // Get the end of a week (Saturday, 23:59:59.999)
  export const endOfWeek = (date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = day === 0 ? 0 : 7 - day; // adjust when day is Sunday
    result.setDate(result.getDate() + diff);
    result.setHours(23, 59, 59, 999);
    return result;
  };
  
  // Format a date range
  export const formatDateRange = (startDate, endDate, options = {}) => {
    if (!startDate || !endDate) return '';
    
    const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // If dates are on the same day
    if (
      startObj.getDate() === endObj.getDate() &&
      startObj.getMonth() === endObj.getMonth() &&
      startObj.getFullYear() === endObj.getFullYear()
    ) {
      return `${formatDate(startObj)}, ${formatTime(startObj)} - ${formatTime(endObj)}`;
    }
    
    return `${formatDateTime(startObj)} - ${formatDateTime(endObj)}`;
  };