import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const StudentProgress = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch student's progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      setLoading(true);
      try {
        const coursesResponse = await apiService.get('/student/courses');
        setCourses(coursesResponse.data);
        
        const progressParams = selectedCourse !== 'all' ? { course_id: selectedCourse } : {};
        const progressResponse = await apiService.get('/student/progress', { params: progressParams });
        setProgressData(progressResponse.data);
      } catch (error) {
        console.error('Failed to load progress data:', error);
        toast.error('Failed to load progress data');
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [selectedCourse]);

  // Handle course selection change
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading progress data...</p>
      </div>
    );
  }

  return (
    <div className="o-page o-page--student-progress">
      <header className="o-page__header">
        <h1>My Learning Progress</h1>
        <div className="o-page__filters">
          <div className="o-form-group">
            <select
              className="o-form-control"
              value={selectedCourse}
              onChange={handleCourseChange}
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {progressData ? (
        <div className="o-progress-overview">
          <Card variant="shadowed" className="o-progress-summary-card">
            <div className="o-progress-summary">
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
                    strokeDasharray={`${progressData.overall_progress}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="o-progress-circle__text">
                    {progressData.overall_progress}%
                  </text>
                </svg>
              </div>
              
              <div className="o-progress-stats">
                <div className="o-progress-stat">
                  <span className="o-progress-stat__label">Current Level</span>
                  <span className="o-progress-stat__value">{progressData.current_level}</span>
                </div>
                
                <div className="o-progress-stat">
                  <span className="o-progress-stat__label">Completed Lessons</span>
                  <span className="o-progress-stat__value">{progressData.completed_lessons}</span>
                </div>
                
                <div className="o-progress-stat">
                  <span className="o-progress-stat__label">Hours Studied</span>
                  <span className="o-progress-stat__value">{progressData.hours_studied}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Course Progress Cards */}
          <div className="o-course-progress-grid">
            {progressData.courses.map(course => (
              <Card key={course.id} variant="default" className="o-course-progress-card">
                <div className="o-course-progress-header">
                  <h3>{course.name}</h3>
                  <span className={`o-tag o-tag--${course.status.toLowerCase()}`}>
                    {course.status}
                  </span>
                </div>
                
                <div className="o-course-progress-stats">
                  <div className="o-progress-meter">
                    <div className="o-progress-meter__label">
                      <span>Course Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="o-progress-meter__bar">
                      <div 
                        className="o-progress-meter__fill" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="o-course-completion">
                    <div className="o-course-completion__item">
                      <span className="o-course-completion__label">Completed</span>
                      <span className="o-course-completion__value">
                        {course.completed_lessons} / {course.total_lessons} Lessons
                      </span>
                    </div>
                    
                    <div className="o-course-completion__item">
                      <span className="o-course-completion__label">Last Activity</span>
                      <span className="o-course-completion__value">
                        {new Date(course.last_activity).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="o-course-progress-footer">
                  <Button
                    variant="primary"
                    as={Link}
                    to={`/courses/${course.id}`}
                  >
                    Continue Learning
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Upcoming Assessments */}
          {progressData.upcoming_assessments && progressData.upcoming_assessments.length > 0 && (
            <Card 
              variant="default" 
              title="Upcoming Assessments" 
              className="o-progress-assessments"
            >
              <div className="o-table-responsive">
                <table className="o-table o-table--hover">
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Course</th>
                      <th>Due Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressData.upcoming_assessments.map(assessment => (
                      <tr key={assessment.id}>
                        <td>{assessment.name}</td>
                        <td>{assessment.course_name}</td>
                        <td>{new Date(assessment.due_date).toLocaleDateString()}</td>
                        <td>
                          <span className={`o-tag o-tag--${assessment.status.toLowerCase()}`}>
                            {assessment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <div className="o-empty-state">
          <i className="fa fa-chart-line"></i>
          <p>No progress data available</p>
          <Button 
            variant="primary"
            as={Link}
            to="/courses"
          >
            Browse Courses
          </Button>
        </div>
      )}
    </div>
  );
};

export default StudentProgress;
