// src/routes/RouteConfig.js

// Define application routes
const routes = [
    // Public routes
    {
      path: '/',
      name: 'home',
      component: ({ user }) => {
        if (user && user.role === 'admin') {
          return <Navigate to="/admin/dashboard" replace />;
        }
        return <Home />;
      },
      roles: ['all']
    },
    {
      path: '/login',
      name: 'login',
      component: 'Login',
      public: true
    },
    {
      path: '/register',
      name: 'register',
      component: 'Register',
      public: true
    },
    {
      path: '/forgot-password',
      name: 'forgotPassword',
      component: 'ForgotPassword',
      public: true
    },
    {
      path: '/reset-password/:token',
      name: 'resetPassword',
      component: 'ResetPassword',
      public: true
    },
    
    // Dashboard routes
    {
      path: '/admin/dashboard',
      name: 'adminDashboard',
      component: 'AdminDashboard',
      roles: ['admin']
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: 'Dashboard',
      roles: ['admin', 'teacher', 'student']
    },
    
    // Curriculum routes
    {
      path: '/curriculum',
      name: 'curriculum',
      component: 'Courses',
      roles: ['admin', 'teacher']
    },
    {
      path: '/curriculum/courses/new',
      name: 'newCourse',
      component: 'CourseDetail',
      roles: ['admin', 'teacher']
    },
    {
      path: '/curriculum/courses/:id',
      name: 'courseDetail',
      component: 'CourseDetail',
      roles: ['admin', 'teacher']
    },
    {
      path: '/curriculum/lessons/new',
      name: 'newLesson',
      component: 'LessonPlanner',
      roles: ['admin', 'teacher']
    },
    {
      path: '/curriculum/lessons/:id',
      name: 'lessonDetail',
      component: 'LessonPlanner',
      roles: ['admin', 'teacher']
    },
    {
      path: '/curriculum/materials',
      name: 'materials',
      component: 'Materials',
      roles: ['admin', 'teacher']
    },
    
    // Student management routes
    {
      path: '/students',
      name: 'students',
      component: 'StudentList',
      roles: ['admin', 'teacher']
    },
    {
      path: '/students/new',
      name: 'newStudent',
      component: 'StudentDetail',
      roles: ['admin']
    },
    {
      path: '/students/:id',
      name: 'studentDetail',
      component: 'StudentDetail',
      roles: ['admin', 'teacher']
    },
    {
      path: '/students/enrollment',
      name: 'enrollment',
      component: 'Enrollment',
      roles: ['admin']
    },
    {
      path: '/students/progress',
      name: 'progress',
      component: 'Progress',
      roles: ['admin', 'teacher']
    },
    
    // Staff management routes
    {
      path: '/staff',
      name: 'staff',
      component: 'StaffList',
      roles: ['admin']
    },
    {
      path: '/staff/new',
      name: 'newStaff',
      component: 'StaffDetail',
      roles: ['admin']
    },
    {
      path: '/staff/:id',
      name: 'staffDetail',
      component: 'StaffDetail',
      roles: ['admin']
    },
    {
      path: '/staff/schedule',
      name: 'schedule',
      component: 'Schedule',
      roles: ['admin', 'teacher']
    },
    
    // Facilities routes
    {
      path: '/facilities',
      name: 'facilities',
      component: 'ClassroomList',
      roles: ['admin']
    },
    {
      path: '/facilities/resources',
      name: 'resources',
      component: 'ResourceManagement',
      roles: ['admin']
    },
    
    // Finance routes
    {
      path: '/finance',
      name: 'finance',
      component: 'Fees',
      roles: ['admin']
    },
    {
      path: '/finance/payments',
      name: 'payments',
      component: 'Payments',
      roles: ['admin']
    },
    {
      path: '/finance/expenses',
      name: 'expenses',
      component: 'Expenses',
      roles: ['admin']
    },
    {
      path: '/finance/reports',
      name: 'financeReports',
      component: 'Reports',
      roles: ['admin']
    },
    
    // Marketing routes
    {
      path: '/marketing',
      name: 'marketing',
      component: 'Campaigns',
      roles: ['admin']
    },
    {
      path: '/marketing/leads',
      name: 'leads',
      component: 'Leads',
      roles: ['admin']
    },
    {
      path: '/marketing/analytics',
      name: 'marketingAnalytics',
      component: 'Analytics',
      roles: ['admin']
    },
    
    // Quality assurance routes
    {
      path: '/quality',
      name: 'quality',
      component: 'Feedback',
      roles: ['admin']
    },
    {
      path: '/quality/assessments',
      name: 'assessments',
      component: 'Assessments',
      roles: ['admin', 'teacher']
    },
    {
      path: '/quality/improvements',
      name: 'improvements',
      component: 'Improvements',
      roles: ['admin']
    },
    
    // Student portal routes
    {
      path: '/courses',
      name: 'studentCourses',
      component: 'StudentDashboard',
      roles: ['student']
    },
    {
      path: '/progress',
      name: 'studentProgress',
      component: 'StudentProgress',
      roles: ['student']
    },
    {
      path: '/payments',
      name: 'studentPayments',
      component: 'StudentPayments',
      roles: ['student']
    },
    
    // Settings and profile
    {
      path: '/profile',
      name: 'profile',
      component: 'UserProfile',
      roles: ['admin', 'teacher', 'student']
    },
    {
      path: '/settings',
      name: 'settings',
      component: 'Settings',
      roles: ['admin', 'teacher', 'student']
    },
    
    // 404 route
    {
      path: '*',
      name: 'notFound',
      component: 'NotFound',
      public: true
    }
  ];
  
  export default routes;