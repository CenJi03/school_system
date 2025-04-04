import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tab from '../../components/common/Tab';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewStudent = id === 'new' || !id;
  
  // Student state
  const [student, setStudent] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    emergency_contact: '',
    level: '',
    status: 'active',
    notes: ''
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [courses, setCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(!isNewStudent);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [errors, setErrors] = useState({});
  
  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (isNewStudent) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get student details
        const response = await apiService.get(`/students/${id}/`);
        setStudent(response.data);
        
        // Get enrolled courses
        const coursesResponse = await apiService.get(`/students/${id}/courses/`);
        setCourses(coursesResponse.data.results || coursesResponse.data);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
        toast.error('Failed to load student details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudentData();
  }, [id, isNewStudent]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent({
      ...student,
      [name]: value
    });
    
    // Clear validation error when user fixes field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!student.name) newErrors.name = 'Student name is required';
    if (!student.email) newErrors.email = 'Email is required';
    if (student.email && !/\S+@\S+\.\S+/.test(student.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }
    
    setSaving(true);
    try {
      // For new students, create, otherwise update
      let savedStudent;
      if (isNewStudent) {
        savedStudent = await apiService.post('/students/', student);
        toast.success('Student created successfully');
      } else {
        savedStudent = await apiService.put(`/students/${id}/`, student);
        toast.success('Student updated successfully');
      }
      
      // Redirect to the student detail page if new student
      if (isNewStudent) {
        navigate(`/students/${savedStudent.data.id}`);
      } else {
        // Update local state with saved data
        setStudent(savedStudent.data);
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle student deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/students/${id}/`);
      toast.success('Student deleted successfully');
      navigate('/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };
  
  // Open enrollment modal
  const openEnrollModal = async () => {
    try {
      // Get available courses for enrollment
      const response = await apiService.get('/curriculum/courses/', { 
        params: { status: 'active' } 
      });
      setAvailableCourses(response.data.results || response.data);
      setIsEnrollModalOpen(true);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      toast.error('Failed to load available courses');
    }
  };
  
  // Handle course selection for enrollment
  const handleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };
  
  // Enroll student in selected courses
  const enrollStudent = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }
    
    try {
      await apiService.post(`/students/${id}/enroll/`, {
        course_ids: selectedCourses
      });
      
      // Refresh courses
      const coursesResponse = await apiService.get(`/students/${id}/courses/`);
      setCourses(coursesResponse.data.results || coursesResponse.data);
      
      toast.success('Student enrolled successfully');
      setIsEnrollModalOpen(false);
      setSelectedCourses([]);
    } catch (error) {
      console.error('Error enrolling student:', error);
      toast.error('Failed to enroll student');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading student details...</p>
      </div>
    );
  }
  
  return (
    <div className="o-page o-page--student-detail">
      <header className="o-page__header">
        <div className="o-page__title">
          <h1>{isNewStudent ? 'Add New Student' : student.name}</h1>
          {!isNewStudent && (
            <span className={`o-tag o-tag--${student.status.toLowerCase()}`}>
              {student.status}
            </span>
          )}
        </div>
        
        <div className="o-page__actions">
          {!isNewStudent && (
            <>
              <Button 
                variant="secondary"
                onClick={openEnrollModal}
              >
                <i className="fa fa-graduation-cap"></i> Enroll in Courses
              </Button>
              
              <Button 
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                <i className="fa fa-trash"></i> Delete Student
              </Button>
            </>
          )}
        </div>
      </header>
      
      {!isNewStudent && (
        <div className="o-tabs">
          <Tab
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          >
            <i className="fa fa-user"></i> Details
          </Tab>
          <Tab
            active={activeTab === 'courses'}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fa fa-book"></i> Courses
          </Tab>
          <Tab
            active={activeTab === 'progress'}
            onClick={() => setActiveTab('progress')}
          >
            <i className="fa fa-chart-line"></i> Progress
          </Tab>
          <Tab
            active={activeTab === 'payments'}
            onClick={() => setActiveTab('payments')}
          >
            <i className="fa fa-credit-card"></i> Payments
          </Tab>
        </div>
      )}
      
      {/* Student Details Form */}
      {(isNewStudent || activeTab === 'details') && (
        <Card variant="default">
          <form onSubmit={handleSubmit} className="o-form">
            <div className="o-form__grid">
              <div className="o-form__column">
                <div className="o-form-group">
                  <label htmlFor="name" className="o-form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`o-form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={student.name}
                    onChange={handleChange}
                    placeholder="Enter student name"
                  />
                  {errors.name && <div className="o-form-error">{errors.name}</div>}
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="email" className="o-form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className={`o-form-control ${errors.email ? 'is-invalid' : ''}`}
                      value={student.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                    />
                    {errors.email && <div className="o-form-error">{errors.email}</div>}
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="phone" className="o-form-label">Phone</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="o-form-control"
                      value={student.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="address" className="o-form-label">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    className="o-form-control"
                    value={student.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows={3}
                  ></textarea>
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="date_of_birth" className="o-form-label">Date of Birth</label>
                    <input
                      type="date"
                      id="date_of_birth"
                      name="date_of_birth"
                      className="o-form-control"
                      value={student.date_of_birth}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="gender" className="o-form-label">Gender</label>
                    <select
                      id="gender"
                      name="gender"
                      className="o-form-control"
                      value={student.gender}
                      onChange={handleChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="o-form__column">
                <div className="o-form-group">
                  <label htmlFor="emergency_contact" className="o-form-label">Emergency Contact</label>
                  <input
                    type="text"
                    id="emergency_contact"
                    name="emergency_contact"
                    className="o-form-control"
                    value={student.emergency_contact}
                    onChange={handleChange}
                    placeholder="Emergency contact info"
                  />
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="level" className="o-form-label">Language Level</label>
                  <select
                    id="level"
                    name="level"
                    className="o-form-control"
                    value={student.level}
                    onChange={handleChange}
                  >
                    <option value="">Select Level</option>
                    <option value="beginner">Beginner</option>
                    <option value="elementary">Elementary</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="upper_intermediate">Upper Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="proficient">Proficient</option>
                  </select>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="status" className="o-form-label">Status</label>
                  <select
                    id="status"
                    name="status"
                    className="o-form-control"
                    value={student.status}
                    onChange={handleChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="notes" className="o-form-label">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="o-form-control"
                    value={student.notes}
                    onChange={handleChange}
                    placeholder="Additional notes about the student"
                    rows={5}
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="o-form-actions">
              <Button 
                variant="light"
                type="button"
                onClick={() => navigate('/students')}
              >
                Cancel
              </Button>
              <Button 
                variant="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="o-spinner o-spinner--small"></span>
                    {isNewStudent ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isNewStudent ? 'Create Student' : 'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Courses Tab Content */}
      {activeTab === 'courses' && (
        <Card 
          variant="default"
          className="o-card--courses"
          title={`Enrolled Courses (${courses.length})`}
          actions={
            <Button 
              variant="primary" 
              size="small"
              onClick={openEnrollModal}
            >
              <i className="fa fa-plus"></i> Enroll in Courses
            </Button>
          }
        >
          {courses.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-book"></i>
              <p>Not enrolled in any courses yet</p>
              <Button 
                variant="primary"
                onClick={openEnrollModal}
              >
                Enroll in Courses
              </Button>
            </div>
          ) : (
            <div className="o-table-responsive">
              <table className="o-table o-table--hover">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Level</th>
                    <th>Teacher</th>
                    <th>Enrollment Date</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Link to={`/curriculum/courses/${course.id}`}>
                          {course.name}
                        </Link>
                      </td>
                      <td>
                        <span className={`o-level-badge o-level-badge--${course.level.toLowerCase()}`}>
                          {course.level}
                        </span>
                      </td>
                      <td>{course.teacher.name}</td>
                      <td>{formatDate(course.enrollment_date)}</td>
                      <td>
                        <div className="o-progress-meter">
                          <div className="o-progress-meter__bar">
                            <div 
                              className="o-progress-meter__fill" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                          <span className="o-progress-meter__value">{course.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="o-table-actions">
                          <Button 
                            variant="icon" 
                            aria-label="View Course"
                            as={Link}
                            to={`/curriculum/courses/${course.id}`}
                          >
                            <i className="fa fa-eye"></i>
                          </Button>
                          <Button 
                            variant="icon" 
                            aria-label="Unenroll"
                            onClick={() => {/* Unenroll student from course */}}
                          >
                            <i className="fa fa-user-minus"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
      
      {/* Progress Tab Content */}
      {activeTab === 'progress' && (
        <Card 
          variant="default"
          className="o-card--progress"
          title="Learning Progress"
        >
          <div className="o-progress-placeholder">
            <i className="fa fa-chart-line"></i>
            <p>Student progress charts and statistics will appear here</p>
          </div>
        </Card>
      )}
      
      {/* Payments Tab Content */}
      {activeTab === 'payments' && (
        <Card 
          variant="default"
          className="o-card--payments"
          title="Payment History"
        >
          <div className="o-progress-placeholder">
            <i className="fa fa-credit-card"></i>
            <p>Student payment history will appear here</p>
          </div>
        </Card>
      )}
      
      {/* Course Enrollment Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Enroll in Courses"
        footer={
          <>
            <Button variant="light" onClick={() => setIsEnrollModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={enrollStudent}>
              Enroll
            </Button>
          </>
        }
      >
        <div className="o-enrollment-form">
          {availableCourses.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-info-circle"></i>
              <p>No available courses to enroll in</p>
            </div>
          ) : (
            <div className="o-course-selection">
              {availableCourses.map((course) => (
                <div key={course.id} className="o-course-checkbox">
                  <input
                    type="checkbox"
                    id={`course-${course.id}`}
                    checked={selectedCourses.includes(course.id)}
                    onChange={() => handleCourseSelection(course.id)}
                  />
                  <label htmlFor={`course-${course.id}`}>
                    <div className="o-course-checkbox__title">{course.name}</div>
                    <div className="o-course-checkbox__details">
                      <span className={`o-level-badge o-level-badge--${course.level.toLowerCase()}`}>
                        {course.level}
                      </span>
                      <span>Teacher: {course.teacher.name}</span>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Student"
        footer={
          <>
            <Button variant="light" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        <div className="o-confirmation-message">
          <i className="fa fa-exclamation-triangle"></i>
          <p>
            Are you sure you want to delete <strong>{student.name}</strong>?
            This action cannot be undone and will remove all enrollment records.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default StudentDetail;
