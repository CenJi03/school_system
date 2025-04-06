// src/routes/index.jsx

import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import SystemProtectedRoute from './SystemProtectedRoute';

// Layout components
import Layout from '../components/layout/Layout';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="o-loading-container">
    <div className="o-loading__spinner"></div>
    <p>Loading...</p>
  </div>
);

// Lazy-loaded pages
// Auth
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const NotFound = lazy(() => import('../pages/NotFound'));

// Dashboard pages
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));

// Student pages
const StudentDashboard = lazy(() => import('../pages/dashboard/StudentDashboard'));
const StudentProgress = lazy(() => import('../pages/students/StudentProgress'));
const StudentPayments = lazy(() => import('../pages/students/StudentPayments'));

// Curriculum pages
const Courses = lazy(() => import('../pages/curriculum/Courses'));
const CourseDetail = lazy(() => import('../pages/curriculum/CourseDetail'));
const LessonPlanner = lazy(() => import('../pages/curriculum/LessonPlanner'));
const Materials = lazy(() => import('../pages/curriculum/Materials'));

// Student management pages
const StudentList = lazy(() => import('../pages/students/StudentList'));
const StudentDetail = lazy(() => import('../pages/students/StudentDetail'));
const Enrollment = lazy(() => import('../pages/students/Enrollment'));
const Progress = lazy(() => import('../pages/students/Progress'));

// Staff pages
const StaffList = lazy(() => import('../pages/staff/StaffList'));
const StaffDetail = lazy(() => import('../pages/staff/StaffDetail'));
const Schedule = lazy(() => import('../pages/staff/Schedule'));

// Settings and profile
const UserProfile = lazy(() => import('../pages/UserProfile'));
const Settings = lazy(() => import('../pages/Settings'));

// Public content pages
const CoursesInfo = lazy(() => import("../pages/public/CoursesInfo"));
const AboutUs = lazy(() => import('../pages/AboutUs'));
const Contact = lazy(() => import('../pages/Contact'));

// App Routes Component
const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Public content routes */}
        <Route path="/courses-info" element={<CoursesInfo />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected Routes with Layout */}
        <Route element={
          <SystemProtectedRoute>
            <Layout />
          </SystemProtectedRoute>
        }>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Student Portal Routes */}
          <Route path="/courses" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute roles={['student']}>
              <StudentProgress />
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute roles={['student']}>
              <StudentPayments />
            </ProtectedRoute>
          } />
          
          {/* Curriculum Routes */}
          <Route path="/curriculum" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <Courses />
            </ProtectedRoute>
          } />
          <Route path="/curriculum/courses/new" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/curriculum/courses/:id" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/curriculum/lessons/new" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <LessonPlanner />
            </ProtectedRoute>
          } />
          <Route path="/curriculum/lessons/:id" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <LessonPlanner />
            </ProtectedRoute>
          } />
          <Route path="/curriculum/materials" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <Materials />
            </ProtectedRoute>
          } />
          
          {/* Student Management Routes */}
          <Route path="/students" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <StudentList />
            </ProtectedRoute>
          } />
          <Route path="/students/new" element={
            <ProtectedRoute roles={['admin']}>
              <StudentDetail />
            </ProtectedRoute>
          } />
          <Route path="/students/:id" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <StudentDetail />
            </ProtectedRoute>
          } />
          <Route path="/students/enrollment" element={
            <ProtectedRoute roles={['admin']}>
              <Enrollment />
            </ProtectedRoute>
          } />
          <Route path="/students/progress" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <Progress />
            </ProtectedRoute>
          } />
          
          {/* Staff Routes */}
          <Route path="/staff" element={
            <ProtectedRoute roles={['admin']}>
              <StaffList />
            </ProtectedRoute>
          } />
          <Route path="/staff/new" element={
            <ProtectedRoute roles={['admin']}>
              <StaffDetail />
            </ProtectedRoute>
          } />
          <Route path="/staff/:id" element={
            <ProtectedRoute roles={['admin']}>
              <StaffDetail />
            </ProtectedRoute>
          } />
          <Route path="/staff/schedule" element={
            <ProtectedRoute roles={['admin', 'teacher']}>
              <Schedule />
            </ProtectedRoute>
          } />
          
          {/* Profile & Settings */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Catch All Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;