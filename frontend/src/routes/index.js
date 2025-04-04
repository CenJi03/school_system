// src/routes/index.js

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import routes from './RouteConfig';

// Layout components
import Layout from '../components/layout/Layout';

// Lazy-loaded pages
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Dashboard pages
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const AdminDashboard = lazy(() => import('../pages/dashboard/AdminDashboard'));
const TeacherDashboard = lazy(() => import('../pages/dashboard/TeacherDashboard'));
const StudentDashboard = lazy(() => import('../pages/dashboard/StudentDashboard'));

// Curriculum pages
const Courses = lazy(() => import('../pages/curriculum/Courses'));
const CourseDetail = lazy(() => import('../pages/curriculum/CourseDetail'));

// App Routes Component
const AppRoutes = () => {
  return (
    <Suspense fallback={
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading...</p>
      </div>
    }>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/courses" element={
          <ProtectedRoute roles={['student']}>
            <Layout>
              <Courses />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Catch All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;