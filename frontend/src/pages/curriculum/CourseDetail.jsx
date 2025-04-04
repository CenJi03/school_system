import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tab from '../../components/common/Tab';
import Modal from '../../components/common/Modal';
import curriculumService from '../../services/curriculum';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNewCourse = id === 'new' || !id;
  
  // Course state
  const [course, setCourse] = useState({
    name: '',
    description: '',
    level: '',
    status: 'draft',
    teacher_id: user?.role === 'teacher' ? user.id : '',
    image_url: '',
    start_date: '',
    end_date: '',
    max_students: 20,
    prerequisites: []
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState('details');
  const [lessons, setLessons] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(!isNewCourse);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Fetch course data and related info
  useEffect(() => {
    const fetchCourseData = async () => {
      if (isNewCourse) return;
      
      setLoading(true);
      try {
        // Get course details
        const courseData = await curriculumService.getCourse(id);
        setCourse(courseData);
        
        // Get lessons for this course
        const lessonsData = await curriculumService.getLessons(id);
        setLessons(lessonsData);
        
        // Get enrolled students (in a real app, these would be separate API calls)
        const studentsResponse = await fetch(`/api/courses/${id}/students`);
        const studentsData = await studentsResponse.json();
        setEnrolledStudents(studentsData);
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        toast.error('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchFormOptions = async () => {
      try {
        // Fetch levels and teachers for dropdowns
        const [levelsResponse, teachersResponse] = await Promise.all([
          fetch('/api/curriculum/levels'),
          fetch('/api/staff?role=teacher')
        ]);
        
        const levelsData = await levelsResponse.json();
        const teachersData = await teachersResponse.json();
        
        setLevels(levelsData);
        setTeachers(teachersData.results || teachersData);
      } catch (error) {
        console.error('Error fetching form options:', error);
        toast.error('Failed to load form options');
      }
    };
    
    fetchFormOptions();
    fetchCourseData();
  }, [id, isNewCourse]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourse({
      ...course,
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
    
    if (!course.name) newErrors.name = 'Course name is required';
    if (!course.description) newErrors.description = 'Description is required';
    if (!course.level) newErrors.level = 'Please select a level';
    if (!course.teacher_id) newErrors.teacher_id = 'Please assign a teacher';
    if (course.start_date && course.end_date && new Date(course.start_date) > new Date(course.end_date)) {
      newErrors.end_date = 'End date must be after start date';
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
      // For new courses, create, otherwise update
      let savedCourse;
      if (isNewCourse) {
        savedCourse = await curriculumService.createCourse(course);
        toast.success('Course created successfully');
      } else {
        savedCourse = await curriculumService.updateCourse(id, course);
        toast.success('Course updated successfully');
      }
      
      // Redirect to the course detail page if new course
      if (isNewCourse) {
        navigate(`/curriculum/courses/${savedCourse.id}`);
      } else {
        // Update local state with saved data
        setCourse(savedCourse);
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle course deletion
  const handleDelete = async () => {
    try {
      await curriculumService.deleteCourse(id);
      toast.success('Course deleted successfully');
      navigate('/curriculum');
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course');
    }
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In a real app, this would upload to an API and return a URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setCourse({
        ...course,
        image_url: reader.result
      });
    };
    reader.readAsDataURL(file);
  };
  
  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }
  
  return (
    <div className="o-page o-page--course-detail">
      <header className="o-page__header">
        <div className="o-page__title">
          <h1>{isNewCourse ? 'Create New Course' : course.name}</h1>
          {!isNewCourse && (
            <span className={`o-tag o-tag--${course.status.toLowerCase()}`}>
              {course.status}
            </span>
          )}
        </div>
        
        <div className="o-page__actions">
          {!isNewCourse && (
            <>
              <Button 
                variant="secondary"
                as={Link}
                to={`/curriculum/lessons/new?courseId=${id}`}
              >
                <i className="fa fa-plus"></i> Add Lesson
              </Button>
              
              <Button 
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                <i className="fa fa-trash"></i> Delete Course
              </Button>
            </>
          )}
        </div>
      </header>
      
      {!isNewCourse && (
        <div className="o-tabs">
          <Tab
            active={activeTab === 'details'}
            onClick={() => setActiveTab('details')}
          >
            <i className="fa fa-info-circle"></i> Details
          </Tab>
          <Tab
            active={activeTab === 'lessons'}
            onClick={() => setActiveTab('lessons')}
          >
            <i className="fa fa-book"></i> Lessons
          </Tab>
          <Tab
            active={activeTab === 'students'}
            onClick={() => setActiveTab('students')}
          >
            <i className="fa fa-users"></i> Students
          </Tab>
        </div>
      )}
      
      {/* Course Details Form */}
      {(isNewCourse || activeTab === 'details') && (
        <Card variant="default">
          <form onSubmit={handleSubmit} className="o-form">
            <div className="o-form__grid">
              <div className="o-form__column">
                <div className="o-form-group">
                  <label htmlFor="name" className="o-form-label">Course Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`o-form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={course.name}
                    onChange={handleChange}
                    placeholder="Enter course name"
                  />
                  {errors.name && <div className="o-form-error">{errors.name}</div>}
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="description" className="o-form-label">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    className={`o-form-control ${errors.description ? 'is-invalid' : ''}`}
                    value={course.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter course description"
                  ></textarea>
                  {errors.description && <div className="o-form-error">{errors.description}</div>}
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="level" className="o-form-label">Level</label>
                    <select
                      id="level"
                      name="level"
                      className={`o-form-control ${errors.level ? 'is-invalid' : ''}`}
                      value={course.level}
                      onChange={handleChange}
                    >
                      <option value="">Select Level</option>
                      {levels.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                    </select>
                    {errors.level && <div className="o-form-error">{errors.level}</div>}
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="status" className="o-form-label">Status</label>
                    <select
                      id="status"
                      name="status"
                      className="o-form-control"
                      value={course.status}
                      onChange={handleChange}
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="teacher_id" className="o-form-label">Teacher</label>
                  <select
                    id="teacher_id"
                    name="teacher_id"
                    className={`o-form-control ${errors.teacher_id ? 'is-invalid' : ''}`}
                    value={course.teacher_id}
                    onChange={handleChange}
                    disabled={user?.role === 'teacher'}
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                  {errors.teacher_id && <div className="o-form-error">{errors.teacher_id}</div>}
                </div>
                
                <div className="o-form-row">
                  <div className="o-form-group">
                    <label htmlFor="start_date" className="o-form-label">Start Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      className="o-form-control"
                      value={course.start_date}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="o-form-group">
                    <label htmlFor="end_date" className="o-form-label">End Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      className={`o-form-control ${errors.end_date ? 'is-invalid' : ''}`}
                      value={course.end_date}
                      onChange={handleChange}
                    />
                    {errors.end_date && <div className="o-form-error">{errors.end_date}</div>}
                  </div>
                </div>
                
                <div className="o-form-group">
                  <label htmlFor="max_students" className="o-form-label">Maximum Students</label>
                  <input
                    type="number"
                    id="max_students"
                    name="max_students"
                    className="o-form-control"
                    value={course.max_students}
                    onChange={handleChange}
                    min="1"
                  />
                </div>
              </div>
              
              <div className="o-form__column">
                <div className="o-form-group">
                  <label className="o-form-label">Course Image</label>
                  <div className="o-image-upload">
                    {course.image_url ? (
                      <div className="o-image-upload__preview">
                        <img src={course.image_url} alt="Course preview" />
                        <button 
                          type="button"
                          className="o-image-upload__remove"
                          onClick={() => setCourse({...course, image_url: ''})}
                        >
                          <i className="fa fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="o-image-upload__placeholder">
                        <i className="fa fa-image"></i>
                        <span>Upload an image</span>
                      </div>
                    )}
                    <input
                      type="file"
                      id="image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="o-image-upload__input"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="o-form-actions">
              <Button 
                variant="light"
                type="button"
                onClick={() => navigate('/curriculum')}
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
                    {isNewCourse ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isNewCourse ? 'Create Course' : 'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}
      
      {/* Lessons Tab Content */}
      {activeTab === 'lessons' && (
        <Card 
          variant="default"
          className="o-card--lessons"
          title={`Lessons (${lessons.length})`}
          actions={
            <Button 
              variant="primary" 
              size="small"
              as={Link}
              to={`/curriculum/lessons/new?courseId=${id}`}
            >
              <i className="fa fa-plus"></i> Add Lesson
            </Button>
          }
        >
          {lessons.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-book"></i>
              <p>No lessons created yet</p>
              <Button 
                variant="primary"
                as={Link}
                to={`/curriculum/lessons/new?courseId=${id}`}
              >
                Create First Lesson
              </Button>
            </div>
          ) : (
            <div className="o-lessons-list">
              {lessons.map((lesson, index) => (
                <div key={lesson.id} className="o-lesson-item">
                  <div className="o-lesson-item__order">
                    {index + 1}
                  </div>
                  <div className="o-lesson-item__content">
                    <h3 className="o-lesson-item__title">
                      <Link to={`/curriculum/lessons/${lesson.id}`}>
                        {lesson.title}
                      </Link>
                    </h3>
                    <div className="o-lesson-item__details">
                      <span>
                        <i className="fa fa-clock"></i> {lesson.duration} min
                      </span>
                      <span>
                        <i className="fa fa-file"></i> {lesson.materials_count} materials
                      </span>
                    </div>
                  </div>
                  <div className="o-lesson-item__actions">
                    <Button 
                      variant="icon" 
                      as={Link}
                      to={`/curriculum/lessons/${lesson.id}`}
                    >
                      <i className="fa fa-edit"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      
      {/* Students Tab Content */}
      {activeTab === 'students' && (
        <Card 
          variant="default"
          className="o-card--students"
          title={`Enrolled Students (${enrolledStudents.length})`}
          actions={
            <Button 
              variant="primary" 
              size="small"
              as={Link}
              to={`/students/enrollment?courseId=${id}`}
            >
              <i className="fa fa-plus"></i> Enroll Students
            </Button>
          }
        >
          {enrolledStudents.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-users"></i>
              <p>No students enrolled yet</p>
              <Button 
                variant="primary"
                as={Link}
                to={`/students/enrollment?courseId=${id}`}
              >
                Enroll Students
              </Button>
            </div>
          ) : (
            <div className="o-table-responsive">
              <table className="o-table o-table--hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Enrollment Date</th>
                    <th>Progress</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <div className="o-student-info">
                          <div className="o-avatar o-avatar--small">
                            {student.name.charAt(0)}
                          </div>
                          <span>{student.name}</span>
                        </div>
                      </td>
                      <td>{student.email}</td>
                      <td>{new Date(student.enrollment_date).toLocaleDateString()}</td>
                      <td>
                        <div className="o-progress-meter">
                          <div className="o-progress-meter__bar">
                            <div 
                              className="o-progress-meter__fill" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="o-progress-meter__value">{student.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <div className="o-table-actions">
                          <Button 
                            variant="icon" 
                            as={Link}
                            to={`/students/${student.id}`}
                          >
                            <i className="fa fa-eye"></i>
                          </Button>
                          <Button 
                            variant="icon" 
                            onClick={() => {/* Remove student from course */}}
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
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Course"
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
            Are you sure you want to delete <strong>{course.name}</strong>?
            This action cannot be undone and will remove all associated lessons and materials.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetail;
