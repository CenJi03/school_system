// src/pages/dashboard/TeacherDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import "../../assets/styles/dashboard/TeacherDashboard.css";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    courses: 0,
    students: 0,
    hours_this_week: 0,
    materials: 0
  });
  
  const [todayClasses, setTodayClasses] = useState([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState([]);
  const [studentProgress, setStudentProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchTeacherDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch teacher statistics
        const statsResponse = await apiService.get('/dashboard/teacher/stats/');
        setStats(statsResponse.data);
        
        // Fetch today's classes
        const classesResponse = await apiService.get('/dashboard/teacher/classes/today/');
        setTodayClasses(classesResponse.data);
        
        // Fetch upcoming assessments
        const assessmentsResponse = await apiService.get('/dashboard/teacher/assessments/');
        setUpcomingAssessments(assessmentsResponse.data);
        
        // Fetch student progress
        const progressResponse = await apiService.get('/dashboard/teacher/student-progress/');
        setStudentProgress(progressResponse.data);
      } catch (error) {
        console.error('Error fetching teacher dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeacherDashboardData();
  }, []);
  
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
    <div className="o-dashboard o-dashboard--teacher">
      <header className="o-dashboard__header">
        <h1>Teacher Dashboard</h1>
        <div className="o-teacher-welcome">
          <p>Welcome back, {user?.name || 'Teacher'}!</p>
        </div>
      </header>
      
      {/* Stats Cards */}
      <div className="o-dashboard__stats">
        <Card title="My Courses" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.courses}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-book"></i>
          </div>
          <Link to="/curriculum" className="o-stat-card__link">View Courses</Link>
        </Card>
        
        <Card title="My Students" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.students}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-user-graduate"></i>
          </div>
          <Link to="/students" className="o-stat-card__link">View Students</Link>
        </Card>
        
        <Card title="Teaching Hours This Week" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.hours_this_week}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-clock"></i>
          </div>
          <Link to="/staff/schedule" className="o-stat-card__link">View Schedule</Link>
        </Card>
        
        <Card title="Course Materials" variant="shadowed" className="o-stat-card">
          <div className="o-stat-card__value">{stats.materials}</div>
          <div className="o-stat-card__icon">
            <i className="fa fa-file-alt"></i>
          </div>
          <Link to="/curriculum/materials" className="o-stat-card__link">View Materials</Link>
        </Card>
      </div>
      
      {/* Today's Classes */}
      <Card 
        title="Today's Classes" 
        variant="default"
        className="o-dashboard__card o-dashboard__classes"
        footer={
          <Link to="/staff/schedule" className="o-card-link">
            View Full Schedule
          </Link>
        }
      >
        {todayClasses.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Time</th>
                  <th>Room</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {todayClasses.map((cls) => (
                  <tr key={cls.id}>
                    <td>{cls.course.name}</td>
                    <td>{formatDate(cls.start_time)}</td>
                    <td>{cls.room}</td>
                    <td>{cls.student_count}</td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="secondary" 
                          size="small" 
                          as={Link}
                          to={`/curriculum/lessons/${cls.lesson_id}`}
                        >
                          <i className="fa fa-book-open"></i> Lesson Plan
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
            <p>No classes scheduled for today</p>
          </div>
        )}
      </Card>
      
      {/* Upcoming Assessments */}
      <Card 
        title="Upcoming Assessments" 
        variant="default"
        className="o-dashboard__card o-dashboard__assessments"
        footer={
          <Link to="/quality/assessments" className="o-card-link">
            View All Assessments
          </Link>
        }
      >
        {upcomingAssessments.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingAssessments.map((assessment) => (
                  <tr key={assessment.id}>
                    <td>{assessment.name}</td>
                    <td>{assessment.course.name}</td>
                    <td>{formatDate(assessment.due_date)}</td>
                    <td>
                      <span className={`o-tag o-tag--${assessment.status.toLowerCase()}`}>
                        {assessment.status}
                      </span>
                    </td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="secondary" 
                          size="small"
                          as={Link}
                          to={`/quality/assessments/${assessment.id}`}
                        >
                          <i className="fa fa-edit"></i> Grade
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
            <p>No upcoming assessments</p>
          </div>
        )}
      </Card>
      
      {/* Student Progress */}
      <Card 
        title="Student Progress" 
        variant="default"
        className="o-dashboard__card o-dashboard__progress"
        footer={
          <Link to="/students/progress" className="o-card-link">
            View All Progress Reports
          </Link>
        }
      >
        {studentProgress.length > 0 ? (
          <div className="o-student-progress">
            {studentProgress.map((progress) => (
              <div key={progress.id} className="o-progress-card">
                <div className="o-progress-card__header">
                  <div className="o-progress-card__student">
                    <div className="o-avatar o-avatar--small">
                      {progress.student.name.charAt(0)}
                    </div>
                    <div className="o-progress-card__info">
                      <h4>{progress.student.name}</h4>
                      <span>{progress.course.name}</span>
                    </div>
                  </div>
                  <div className="o-progress-card__score">
                    <span className={`o-progress-label o-progress-label--${progress.performance_level.toLowerCase()}`}>
                      {progress.performance_level}
                    </span>
                  </div>
                </div>
                <div className="o-progress-card__body">
                  <div className="o-progress-meter">
                    <div className="o-progress-meter__label">
                      <span>Progress</span>
                      <span>{progress.completion_percentage}%</span>
                    </div>
                    <div className="o-progress-meter__bar">
                      <div 
                        className="o-progress-meter__fill" 
                        style={{ width: `${progress.completion_percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="o-progress-card__footer">
                  <Button 
                    variant="link" 
                    size="small"
                    as={Link}
                    to={`/students/${progress.student.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-info-circle"></i>
            <p>No student progress data available</p>
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
          <Link to="/curriculum/lessons/new" className="o-quick-link">
            <i className="fa fa-file-alt"></i>
            <span>Create Lesson</span>
          </Link>
          <Link to="/curriculum/materials" className="o-quick-link">
            <i className="fa fa-upload"></i>
            <span>Upload Material</span>
          </Link>
          <Link to="/quality/assessments/new" className="o-quick-link">
            <i className="fa fa-tasks"></i>
            <span>Create Assessment</span>
          </Link>
          <Link to="/students/progress" className="o-quick-link">
            <i className="fa fa-chart-line"></i>
            <span>Update Progress</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;