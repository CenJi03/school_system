// src/App.jsx

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { AuthProvider } from './hooks/useAuth';
import { Toaster } from "react-hot-toast";

// Import global styles
import './assets/styles/main.css';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            },
            success: {
              style: {
                background: '#EFFAF5',
                border: '1px solid #48BB78',
                color: '#2F855A'
              },
              iconTheme: {
                primary: '#48BB78',
                secondary: '#EFFAF5'
              }
            },
            error: {
              style: {
                background: '#FFF5F5',
                border: '1px solid #F56565',
                color: '#C53030'
              },
              iconTheme: {
                primary: '#F56565',
                secondary: '#FFF5F5'
              }
            }
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;