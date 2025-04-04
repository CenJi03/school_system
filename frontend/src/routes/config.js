// src/config.js

/**
 * Application configuration
 */

// API configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || '/api',
    TIMEOUT: 30000,
    RETRY_COUNT: 3,
    RETRY_DELAY: 1000
  };
  
  // Auth configuration
  export const AUTH_CONFIG = {
    TOKEN_KEY: 'auth_token',
    USER_KEY: 'user',
    REFRESH_TOKEN_KEY: 'refresh_token',
    TOKEN_EXPIRY_KEY: 'token_expiry'
  };
  
  // Date format configuration
  export const DATE_FORMATS = {
    DEFAULT: 'MMM dd, yyyy',
    SHORT: 'MM/dd/yyyy',
    LONG: 'MMMM dd, yyyy',
    WITH_TIME: 'MMM dd, yyyy HH:mm',
    TIME_ONLY: 'HH:mm'
  };
  
  // Pagination configuration
  export const PAGINATION_CONFIG = {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [5, 10, 20, 50, 100]
  };
  
  // File upload configuration
  export const UPLOAD_CONFIG = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_EXTENSIONS: {
      IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      DOCUMENT: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      AUDIO: ['.mp3', '.wav', '.ogg'],
      VIDEO: ['.mp4', '.webm', '.mov']
    }
  };
  
  // Theme configuration
  export const THEME_CONFIG = {
    DEFAULT_THEME: 'light',
    AVAILABLE_THEMES: ['light', 'dark']
  };
  
  // Feature flags
  export const FEATURES = {
    ENABLE_NOTIFICATIONS: true,
    ENABLE_PWA: false,
    ENABLE_ANALYTICS: import.meta.env.PROD,
    ENABLE_CHAT: true,
    ENABLE_DARK_MODE: true
  };
  
  // Constants
  export const CONSTANTS = {
    APP_NAME: 'Language School Management',
    SUPPORT_EMAIL: 'support@languageschool.com',
    SCHOOL_PHONE: '+1 (555) 123-4567',
    SCHOOL_ADDRESS: '123 Education St, Learning City, 54321'
  };