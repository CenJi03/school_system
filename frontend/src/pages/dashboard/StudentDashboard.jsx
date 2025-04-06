// src/pages/dashboard/StudentDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import "../../assets/styles/dashboard/StudentDashboard.css";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState({
    overall_progress: 0,
    courses_completed: 0,
    current_level: '',
    next_assessment: null
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchStudentDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch enrolled courses
        const coursesResponse = await apiService.get('/dashboard/student/courses/');
        setMyCourses(coursesResponse.data);
        
        // Fetch upcoming classes
        const classesResponse = await apiService.get('/dashboard/student/classes/');
        setUpcomingClasses(classesResponse.data);
        
        // Fetch assignments
        const assignmentsResponse = await apiService.get('/dashboard/student/assignments/');
        setAssignments(assignmentsResponse.data);
        
        // Fetch progress data
        const progressResponse = await apiService.get('/dashboard/student/progress/');
        setProgress(progressResponse.data);
      } catch (error) {
        console.error('Error fetching student dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentDashboardData();
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
    <div className="o-dashboard o-dashboard--student">
      <header className="o-dashboard__header">
        <h1>My Learning Dashboard</h1>
        <div className="o-student-welcome">
          <p>Welcome back, {user?.name || 'Student'}!</p>
        </div>
      </header>
      
      {/* Progress Overview */}
      <Card 
        title="My Progress Overview" 
        variant="default"
        className="o-dashboard__card o-dashboard__progress-overview"
      >
        <div className="o-progress-overview">
          <div className="o-progress-overview__stat">
            <div className="o-progress-circle">
              <svg viewBox="0 0 36 36" className="o-progress-circle__svg">
                <path
                  className="o-progress-circle__bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="o-progress-circle__fill"
                  strokeDasharray={`${progress.overall_progress}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="o-progress-circle__text">
                  {progress.overall_progress}%
                </text>
              </svg>
              <span className="o-progress-circle__label">Overall Progress</span>
            </div>
          </div>
          
          <div className="o-progress-overview__details">
            <div className="o-progress-stat">
              <span className="o-progress-stat__label">Current Level</span>
              <span className="o-progress-stat__value">{progress.current_level}</span>
            </div>
            
            <div className="o-progress-stat">
              <span className="o-progress-stat__label">Courses Completed</span>
              <span className="o-progress-stat__value">{progress.courses_completed}</span>
            </div>
            
            <div className="o-progress-stat">
              <span className="o-progress-stat__label">Next Assessment</span>
              <span className="o-progress-stat__value">
                {progress.next_assessment 
                  ? formatDate(progress.next_assessment.date)
                  : 'None scheduled'}
              </span>
            </div>
            
            <Button 
              variant="primary"
              className="o-progress-overview__action"
              as={Link}
              to="/progress"
            >
              View Detailed Progress
            </Button>
          </div>
        </div>
      </Card>
      
      {/* My Courses */}
      <Card 
        title="My Courses" 
        variant="default"
        className="o-dashboard__card o-dashboard__courses"
        footer={
          <Link to="/courses" className="o-card-link">
            View All Courses
          </Link>
        }
      >
        {myCourses.length > 0 ? (
          <div className="o-courses-grid">
            {myCourses.map((course) => (
              <div key={course.id} className="o-course-card">
                <div 
                  className="o-course-card__header"
                  style={{ backgroundImage: `url(${course.image_url || '/assets/images/course-default.jpg'})` }}
                >
                  <span className={`o-course-level o-course-level--${course.level.toLowerCase()}`}>
                    {course.level}
                  </span>
                </div>
                <div className="o-course-card__body">
                  <h3 className="o-course-card__title">{course.name}</h3>
                  <div className="o-course-card__teacher">
                    <i className="fa fa-user-tie"></i>
                    <span>{course.teacher.name}</span>
                  </div>
                  <div className="o-course-card__progress">
                    <div className="o-progress-meter">
                      <div className="o-progress-meter__label">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="o-progress-meter__bar">
                        <div 
                          className="o-progress-meter__fill" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="o-course-card__footer">
                  <Button 
                    variant="primary" 
                    fullWidth
                    as={Link}
                    to={`/courses/${course.id}`}
                  >
                    Continue Learning
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-book"></i>
            <p>You are not enrolled in any courses yet</p>
            <Button 
              variant="primary"
              as={Link}
              to="/courses/browse"
            >
              Browse Available Courses
            </Button>
          </div>
        )}
      </Card>
      
      {/* Upcoming Classes */}
      <Card 
        title="Upcoming Classes" 
        variant="default"
        className="o-dashboard__card o-dashboard__classes"
      >
        {upcomingClasses.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Teacher</th>
                  <th>Date & Time</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingClasses.map((cls) => (
                  <tr key={cls.id}>
                    <td>{cls.course.name}</td>
                    <td>{cls.teacher.name}</td>
                    <td>{formatDate(cls.start_time)}</td>
                    <td>{cls.room}</td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="secondary" 
                          size="small"
                          as={Link}
                          to={`/courses/${cls.course.id}/lessons/${cls.lesson_id}`}
                        >
                          <i className="fa fa-book-open"></i> View Materials
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
            <i className="fa fa-calendar"></i>
            <p>No upcoming classes scheduled</p>
          </div>
        )}
      </Card>
      
      {/* Assignments */}
      <Card 
        title="Assignments & Assessments" 
        variant="default"
        className="o-dashboard__card o-dashboard__assignments"
      >
        {assignments.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Course</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr key={assignment.id}>
                    <td>{assignment.name}</td>
                    <td>{assignment.course.name}</td>
                    <td>{formatDate(assignment.due_date)}</td>
                    <td>
                      <span className={`o-tag o-tag--${assignment.status.toLowerCase()}`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="primary" 
                          size="small"
                          as={Link}
                          to={`/courses/${assignment.course.id}/assignments/${assignment.id}`}
                        >
                          {assignment.status === 'Pending' ? 'Submit' : 'View'}
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
            <i className="fa fa-tasks"></i>
            <p>No pending assignments</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDashboard;