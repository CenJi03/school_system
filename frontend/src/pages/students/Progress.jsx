import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Progress = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseLoading, setCourseLoading] = useState(false);
  
  // Fetch courses for filter
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiService.get('/curriculum/courses/', { 
          params: { 
            status: 'active',
            teacher: user?.role === 'teacher' ? user.id : undefined
          } 
        });
        setCourses(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    
    fetchCourses();
  }, [user]);
  
  // Fetch all students or students for selected course
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        let endpoint = '/students/';
        const params = { limit: 100 };
        
        if (selectedCourse) {
          endpoint = `/curriculum/courses/${selectedCourse}/students/`;
        }
        
        const response = await apiService.get(endpoint, { params });
        setStudents(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [selectedCourse]);
  
  // Fetch progress data when course or student selection changes
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!selectedCourse && !selectedStudent) {
        // If no filters, fetch summary data
        setCourseLoading(true);
        try {
          const response = await apiService.get('/students/progress/summary');
          setProgressData(response.data);
        } catch (error) {
          console.error('Error fetching progress summary:', error);
          toast.error('Failed to load progress data');
        } finally {
          setCourseLoading(false);
        }
        return;
      }
      
      setCourseLoading(true);
      try {
        let endpoint = '/students/progress/';
        const params = {};
        
        if (selectedCourse) {
          params.course_id = selectedCourse;
        }
        
        if (selectedStudent) {
          params.student_id = selectedStudent;
        }
        
        const response = await apiService.get(endpoint, { params });
        setProgressData(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        toast.error('Failed to load progress data');
      } finally {
        setCourseLoading(false);
      }
    };
    
    fetchProgressData();
  }, [selectedCourse, selectedStudent]);
  
  // Handle course selection change
  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedStudent(''); // Reset student selection when course changes
  };
  
  // Handle student selection change
  const handleStudentChange = (e) => {
    setSelectedStudent(e.target.value);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedCourse('');
    setSelectedStudent('');
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="o-page o-page--progress">
      <header className="o-page__header">
        <h1>Student Progress</h1>
        <div className="o-page__actions">
          <Button 
            variant="secondary"
            as={Link}
            to="/quality/assessments"
          >
            <i className="fa fa-tasks"></i> Assessments
          </Button>
        </div>
      </header>
      
      <Card variant="default" className="o-filter-card">
        <div className="o-filter-controls">
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="course" className="o-form-label">Course</label>
              <select
                id="course"
                className="o-form-control"
                value={selectedCourse}
                onChange={handleCourseChange}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name} ({course.level})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="student" className="o-form-label">Student</label>
              <select
                id="student"
                className="o-form-control"
                value={selectedStudent}
                onChange={handleStudentChange}
                disabled={loading}
              >
                <option value="">All Students</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="o-form-group o-form-group--buttons">
              <Button 
                variant="light"
                onClick={resetFilters}
              >
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>
      
      {courseLoading ? (
        <div className="o-loading-container">
          <div className="o-loading__spinner"></div>
          <p>Loading progress data...</p>
        </div>
      ) : (
        <>
          {selectedStudent ? (
            <Card variant="default" className="o-student-progress-detail">
              {progressData.length > 0 ? (
                <div className="o-student-courses">
                  <h2 className="o-student-progress-detail__title">
                    Course Progress for {students.find(s => s.id === selectedStudent)?.name}
                  </h2>
                  
                  {progressData.map(progress => (
                    <div key={progress.id} className="o-progress-course-card">
                      <div className="o-progress-course-card__header">
                        <h3>{progress.course.name}</h3>
                        <span className={`o-tag o-tag--${progress.status.toLowerCase()}`}>
                          {progress.status}
                        </span>
                      </div>
                      
                      <div className="o-progress-course-card__content">
                        <div className="o-progress-meter o-progress-meter--large">
                          <div className="o-progress-meter__label">
                            <span>Overall Completion</span>
                            <span>{progress.completion_percentage}%</span>
                          </div>
                          <div className="o-progress-meter__bar">
                            <div 
                              className="o-progress-meter__fill" 
                              style={{ width: `${progress.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="o-progress-stats">
                          <div className="o-progress-stat">
                            <span className="o-progress-stat__label">Enrolled Date</span>
                            <span className="o-progress-stat__value">{formatDate(progress.enrollment_date)}</span>
                          </div>
                          <div className="o-progress-stat">
                            <span className="o-progress-stat__label">Last Activity</span>
                            <span className="o-progress-stat__value">{formatDate(progress.last_activity_date)}</span>
                          </div>
                          <div className="o-progress-stat">
                            <span className="o-progress-stat__label">Attendance</span>
                            <span className="o-progress-stat__value">{progress.attendance_percentage}%</span>
                          </div>
                          <div className="o-progress-stat">
                            <span className="o-progress-stat__label">Average Score</span>
                            <span className="o-progress-stat__value">{progress.average_score}/100</span>
                          </div>
                        </div>
                        
                        <div className="o-lesson-progress">
                          <h4>Lesson Progress</h4>
                          <div className="o-lesson-progress__list">
                            {progress.lessons.map(lesson => (
                              <div key={lesson.id} className="o-lesson-progress__item">
                                <span className="o-lesson-progress__title">{lesson.title}</span>
                                <div className="o-lesson-progress__bar">
                                  <div 
                                    className="o-lesson-progress__fill"
                                    style={{ width: `${lesson.completion_percentage}%` }}
                                  ></div>
                                </div>
                                <span className="o-lesson-progress__value">{lesson.completion_percentage}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="o-progress-course-card__footer">
                        <Button 
                          variant="secondary" 
                          size="small"
                          as={Link}
                          to={`/curriculum/courses/${progress.course.id}`}
                        >
                          View Course
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="o-empty-state">
                  <i className="fa fa-chart-line"></i>
                  <p>No progress data available for the selected student</p>
                </div>
              )}
            </Card>
          ) : (
            <div className="o-progress-grid">
              {progressData.length > 0 ? (
                progressData.map(student => (
                  <Card key={student.id} variant="default" className="o-progress-card">
                    <div className="o-progress-card__header">
                      <div className="o-progress-card__student">
                        <div className="o-avatar o-avatar--medium">
                          {student.name.charAt(0)}
                        </div>
                        <div className="o-progress-card__info">
                          <h3>
                            <Link to={`/students/${student.id}`}>{student.name}</Link>
                          </h3>
                          <span>{student.level}</span>
                        </div>
                      </div>
                      <Button 
                        variant="icon"
                        as={Link}
                        to={`/students/${student.id}?tab=progress`}
                        aria-label="View student"
                      >
                        <i className="fa fa-external-link-alt"></i>
                      </Button>
                    </div>
                    
                    <div className="o-progress-card__body">
                      <div className="o-progress-meter o-progress-meter--large">
                        <div className="o-progress-meter__label">
                          <span>Overall Progress</span>
                          <span>{student.overall_progress}%</span>
                        </div>
                        <div className="o-progress-meter__bar">
                          <div 
                            className="o-progress-meter__fill" 
                            style={{ width: `${student.overall_progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="o-progress-stats">
                        <div className="o-progress-stat">
                          <span className="o-progress-stat__label">Courses</span>
                          <span className="o-progress-stat__value">{student.enrolled_courses}</span>
                        </div>
                        <div className="o-progress-stat">
                          <span className="o-progress-stat__label">Completed</span>
                          <span className="o-progress-stat__value">{student.completed_courses}</span>
                        </div>
                        <div className="o-progress-stat">
                          <span className="o-progress-stat__label">Attendance</span>
                          <span className="o-progress-stat__value">{student.attendance_percentage}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="o-progress-card__footer">
                      {selectedCourse && (
                        <Button 
                          variant="primary" 
                          fullWidth
                          onClick={() => setSelectedStudent(student.id)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="o-empty-state o-empty-state--full-width">
                  <i className="fa fa-chart-line"></i>
                  <p>No progress data available for the selected filters</p>
                  <Button variant="primary" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Progress;
