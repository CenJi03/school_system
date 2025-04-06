// src/pages/dashboard/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import toast from 'react-hot-toast';
import "../../assets/styles/dashboard/AdminDashboard.css";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    revenue: 0
  });
  
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch summary statistics
        const statsResponse = await apiService.get('/dashboard/stats/');
        setStats(statsResponse.data);
        
        // Fetch recent enrollments
        const enrollmentsResponse = await apiService.get('/dashboard/enrollments/');
        setRecentEnrollments(enrollmentsResponse.data);
        
        // Fetch upcoming classes
        const classesResponse = await apiService.get('/dashboard/classes/');
        setUpcomingClasses(classesResponse.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }
  
  return (
    <div className="o-dashboard o-dashboard--admin">
      <header className="o-dashboard__header">
        <h1>Admin Dashboard</h1>
        <div className="o-dashboard__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            as={Link}
            to="/students/new"
          >
            Add Student
          </Button>
          <Button 
            variant="secondary"
            icon={<i className="fa fa-download"></i>}
          >
            Export Reports
          </Button>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div className="o-dashboard__stats">
        <Card title="Total Students" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.students}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-user-graduate"></i>
          </div>
          <Link to="/students" className="o-stat-card__link">View Students</Link>
        </Card>
        
        <Card title="Teaching Staff" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.teachers}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-chalkboard-teacher"></i>
          </div>
          <Link to="/staff" className="o-stat-card__link">View Staff</Link>
        </Card>
        
        <Card title="Active Courses" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.courses}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-book"></i>
          </div>
          <Link to="/curriculum" className="o-stat-card__link">View Courses</Link>
        </Card>
        
        <Card title="Monthly Revenue" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{formatCurrency(stats.revenue)}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-dollar-sign"></i>
          </div>
          <Link to="/finance" className="o-stat-card__link">View Finances</Link>
        </Card>
      </div>
      
      {/* Recent Enrollments */}
      <Card 
        title="Recent Enrollments" 
        variant="default"
        className="o-dashboard__card o-dashboard__enrollments"
        footer={
          <Link to="/students/enrollment" className="o-card-link">
            View All Enrollments
          </Link>
        }
      >
        {recentEnrollments.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEnrollments.map((enrollment) => (
                  <tr key={enrollment.id}>
                    <td>
                      <Link to={`/students/${enrollment.student.id}`}>
                        {enrollment.student.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/curriculum/courses/${enrollment.course.id}`}>
                        {enrollment.course.name}
                      </Link>
                    </td>
                    <td>{formatDate(enrollment.enrollment_date)}</td>
                    <td>
                      <span className={`o-tag o-tag--${enrollment.status.toLowerCase()}`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="icon" 
                          aria-label="View Details"
                          as={Link}
                          to={`/students/${enrollment.student.id}`}
                        >
                          <i className="fa fa-eye"></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-info-circle"></i>
            <p>No recent enrollments</p>
          </div>
        )}
      </Card>
      
      {/* Upcoming Classes */}
      <Card 
        title="Upcoming Classes" 
        variant="default"
        className="o-dashboard__card o-dashboard__classes"
        footer={
          <Link to="/staff/schedule" className="o-card-link">
            View Full Schedule
          </Link>
        }
      >
        {upcomingClasses.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Schedule</th>
                  <th>Room</th>
                  <th>Students</th>
                </tr>
              </thead>
              <tbody>
                {upcomingClasses.map((cls) => (
                  <tr key={cls.id}>
                    <td>
                      <Link to={`/curriculum/courses/${cls.course.id}`}>
                        {cls.course.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/staff/${cls.teacher.id}`}>
                        {cls.teacher.name}
                      </Link>
                    </td>
                    <td>{formatDate(cls.start_time)}</td>
                    <td>{cls.room}</td>
                    <td>{cls.student_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-info-circle"></i>
            <p>No upcoming classes</p>
          </div>
        )}
      </Card>
      
      {/* Quick Links */}
      <Card 
        title="Quick Actions" 
        variant="default"
        className="o-dashboard__card o-dashboard__quick-links"
      >
        <div className="o-quick-links">
          <Link to="/students/new" className="o-quick-link">
            <i className="fa fa-user-plus"></i>
            <span>New Student</span>
          </Link>
          <Link to="/staff/new" className="o-quick-link">
            <i className="fa fa-user-tie"></i>
            <span>New Staff</span>
          </Link>
          <Link to="/curriculum/courses/new" className="o-quick-link">
            <i className="fa fa-book"></i>
            <span>New Course</span>
          </Link>
          <Link to="/finance/payments" className="o-quick-link">
            <i className="fa fa-credit-card"></i>
            <span>Record Payment</span>
          </Link>
          <Link to="/marketing/campaigns" className="o-quick-link">
            <i className="fa fa-bullhorn"></i>
            <span>New Campaign</span>
          </Link>
          <Link to="/quality/feedback" className="o-quick-link">
            <i className="fa fa-comment"></i>
            <span>View Feedback</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;