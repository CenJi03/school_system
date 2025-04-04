import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import curriculumService from '../../services/curriculum';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const LessonPlanner = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get('courseId');
  const isNewLesson = id === 'new' || !id;
  const { user } = useAuth();
  
  // Lesson state
  const [lesson, setLesson] = useState({
    title: '',
    description: '',
    course_id: courseId || '',
    duration: 60,
    objectives: '',
    resources: '',
    order: 1
  });
  
  // UI state
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(!isNewLesson);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [currentUpload, setCurrentUpload] = useState({
    file: null,
    title: '',
    description: '',
    type: 'document'
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  
  // Fetch lesson data
  useEffect(() => {
    const fetchLessonData = async () => {
      if (isNewLesson) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Get lesson details
        const lessonData = await curriculumService.getLesson(id);
        setLesson(lessonData);
        
        // Get materials for this lesson
        const materialsData = await curriculumService.getMaterials(id);
        setMaterials(materialsData);
      } catch (error) {
        console.error('Error fetching lesson data:', error);
        toast.error('Failed to load lesson details');
      } finally {
        setLoading(false);
      }
    };
    
    const fetchCourses = async () => {
      try {
        // Get all courses for dropdown
        const coursesResponse = await curriculumService.getCourses({
          limit: 100,
          status: 'active',
          teacher: user.role === 'teacher' ? user.id : undefined
        });
        setCourses(coursesResponse.results || coursesResponse);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    
    fetchCourses();
    fetchLessonData();
  }, [id, isNewLesson, user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLesson({
      ...lesson,
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
    
    if (!lesson.title) newErrors.title = 'Lesson title is required';
    if (!lesson.description) newErrors.description = 'Description is required';
    if (!lesson.course_id) newErrors.course_id = 'Please select a course';
    if (lesson.duration <= 0) newErrors.duration = 'Duration must be greater than 0';
    
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
      // For new lessons, create, otherwise update
      let savedLesson;
      if (isNewLesson) {
        savedLesson = await curriculumService.createLesson(lesson.course_id, lesson);
        toast.success('Lesson created successfully');
      } else {
        savedLesson = await curriculumService.updateLesson(id, lesson);
        toast.success('Lesson updated successfully');
      }
      
      // Redirect to the lesson detail page if new lesson
      if (isNewLesson) {
        navigate(`/curriculum/lessons/${savedLesson.id}`);
      } else {
        // Update local state with saved data
        setLesson(savedLesson);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(error.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle lesson deletion
  const handleDelete = async () => {
    try {
      await curriculumService.deleteLesson(id);
      toast.success('Lesson deleted successfully');
      navigate(`/curriculum/courses/${lesson.course_id}`);
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast.error('Failed to delete lesson');
    }
  };
  
  // Handle file selection for upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setCurrentUpload({
      ...currentUpload,
      file,
      title: file.name
    });
  };
  
  // Handle upload modal form input changes
  const handleUploadChange = (e) => {
    const { name, value } = e.target;
    setCurrentUpload({
      ...currentUpload,
      [name]: value
    });
  };
  
  // Upload material
  const handleUpload = async () => {
    if (!currentUpload.file || !currentUpload.title) {
      toast.error('Please select a file and provide a title');
      return;
    }
    
    try {
      // Upload the material
      const uploadedMaterial = await curriculumService.uploadMaterial(
        id, 
        currentUpload,
        (progress) => {
          setUploadProgress(progress);
        }
      );
      
      // Add to materials list
      setMaterials([...materials, uploadedMaterial]);
      
      // Reset upload state
      setCurrentUpload({
        file: null,
        title: '',
        description: '',
        type: 'document'
      });
      setUploadProgress(0);
      setIsUploadModalOpen(false);
      
      toast.success('Material uploaded successfully');
    } catch (error) {
      console.error('Error uploading material:', error);
      toast.error('Failed to upload material');
    }
  };
  
  // Delete material
  const handleDeleteMaterial = async (materialId) => {
    try {
      await curriculumService.deleteMaterial(materialId);
      setMaterials(materials.filter(material => material.id !== materialId));
      toast.success('Material deleted successfully');
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };
  
  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading lesson details...</p>
      </div>
    );
  }
  
  return (
    <div className="o-page o-page--lesson-planner">
      <header className="o-page__header">
        <div className="o-page__title">
          <h1>{isNewLesson ? 'Create New Lesson' : lesson.title}</h1>
        </div>
        
        <div className="o-page__actions">
          {!isNewLesson && (
            <>
              <Button 
                variant="secondary"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <i className="fa fa-upload"></i> Upload Material
              </Button>
              
              <Button 
                variant="danger"
                onClick={() => setConfirmDelete(true)}
              >
                <i className="fa fa-trash"></i> Delete Lesson
              </Button>
            </>
          )}
        </div>
      </header>
      
      <div className="o-lesson-planner__layout">
        {/* Lesson Details Form */}
        <Card variant="default" className="o-lesson-planner__details">
          <form onSubmit={handleSubmit} className="o-form">
            <div className="o-form-group">
              <label htmlFor="course_id" className="o-form-label">Course</label>
              <select
                id="course_id"
                name="course_id"
                className={`o-form-control ${errors.course_id ? 'is-invalid' : ''}`}
                value={lesson.course_id}
                onChange={handleChange}
                disabled={!isNewLesson}
              >
                <option value="">Select Course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              {errors.course_id && <div className="o-form-error">{errors.course_id}</div>}
            </div>
            
            <div className="o-form-group">
              <label htmlFor="title" className="o-form-label">Lesson Title</label>
              <input
                type="text"
                id="title"
                name="title"
                className={`o-form-control ${errors.title ? 'is-invalid' : ''}`}
                value={lesson.title}
                onChange={handleChange}
                placeholder="Enter lesson title"
              />
              {errors.title && <div className="o-form-error">{errors.title}</div>}
            </div>
            
            <div className="o-form-group">
              <label htmlFor="description" className="o-form-label">Description</label>
              <textarea
                id="description"
                name="description"
                className={`o-form-control ${errors.description ? 'is-invalid' : ''}`}
                value={lesson.description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter lesson description"
              ></textarea>
              {errors.description && <div className="o-form-error">{errors.description}</div>}
            </div>
            
            <div className="o-form-row">
              <div className="o-form-group">
                <label htmlFor="duration" className="o-form-label">Duration (minutes)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  className={`o-form-control ${errors.duration ? 'is-invalid' : ''}`}
                  value={lesson.duration}
                  onChange={handleChange}
                  min="1"
                />
                {errors.duration && <div className="o-form-error">{errors.duration}</div>}
              </div>
              
              <div className="o-form-group">
                <label htmlFor="order" className="o-form-label">Lesson Order</label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  className="o-form-control"
                  value={lesson.order}
                  onChange={handleChange}
                  min="1"
                />
              </div>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="objectives" className="o-form-label">Learning Objectives</label>
              <textarea
                id="objectives"
                name="objectives"
                className="o-form-control"
                value={lesson.objectives}
                onChange={handleChange}
                rows={4}
                placeholder="Enter learning objectives"
              ></textarea>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="resources" className="o-form-label">Additional Resources</label>
              <textarea
                id="resources"
                name="resources"
                className="o-form-control"
                value={lesson.resources}
                onChange={handleChange}
                rows={4}
                placeholder="Enter additional resources"
              ></textarea>
            </div>
            
            <div className="o-form-actions">
              <Button 
                variant="light"
                type="button"
                onClick={() => navigate(`/curriculum/courses/${lesson.course_id}`)}
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
                    {isNewLesson ? 'Creating...' : 'Saving...'}
                  </>
                ) : (
                  isNewLesson ? 'Create Lesson' : 'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Card>
        
        {/* Materials List (Only show for existing lessons) */}
        {!isNewLesson && (
          <Card 
            variant="default" 
            className="o-lesson-planner__materials"
            title="Lesson Materials"
            actions={
              <Button 
                variant="primary" 
                size="small"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <i className="fa fa-plus"></i> Add Material
              </Button>
            }
          >
            {materials.length === 0 ? (
              <div className="o-empty-state">
                <i className="fa fa-file-alt"></i>
                <p>No materials added yet</p>
                <Button 
                  variant="primary"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload First Material
                </Button>
              </div>
            ) : (
              <div className="o-materials-list">
                {materials.map((material) => (
                  <div key={material.id} className="o-material-item">
                    <div className="o-material-item__icon">
                      {material.type === 'document' && <i className="fa fa-file-pdf"></i>}
                      {material.type === 'video' && <i className="fa fa-file-video"></i>}
                      {material.type === 'audio' && <i className="fa fa-file-audio"></i>}
                      {material.type === 'image' && <i className="fa fa-file-image"></i>}
                      {material.type === 'other' && <i className="fa fa-file"></i>}
                    </div>
                    <div className="o-material-item__content">
                      <h4 className="o-material-item__title">{material.title}</h4>
                      {material.description && (
                        <p className="o-material-item__description">{material.description}</p>
                      )}
                      <div className="o-material-item__meta">
                        <span>{material.file_size}</span>
                        <span>{new Date(material.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="o-material-item__actions">
                      <Button 
                        variant="icon" 
                        aria-label="Download Material"
                        as="a"
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                      >
                        <i className="fa fa-download"></i>
                      </Button>
                      <Button 
                        variant="icon" 
                        aria-label="Delete Material"
                        onClick={() => handleDeleteMaterial(material.id)}
                      >
                        <i className="fa fa-trash"></i>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
      
      {/* Upload Material Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Material"
        footer={
          <>
            <Button variant="light" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpload}
              disabled={!currentUpload.file}
            >
              Upload
            </Button>
          </>
        }
      >
        <div className="o-upload-form">
          <div className="o-form-group">
            <label className="o-form-label">File</label>
            <div className="o-file-upload">
              <input
                type="file"
                id="material-file"
                onChange={handleFileChange}
                className="o-file-upload__input"
              />
              <label htmlFor="material-file" className="o-file-upload__label">
                {currentUpload.file ? currentUpload.file.name : 'Choose a file'}
              </label>
              <Button 
                variant="secondary"
                as="label"
                htmlFor="material-file"
              >
                Browse
              </Button>
            </div>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="material-title" className="o-form-label">Title</label>
            <input
              type="text"
              id="material-title"
              name="title"
              className="o-form-control"
              value={currentUpload.title}
              onChange={handleUploadChange}
              placeholder="Enter material title"
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="material-description" className="o-form-label">Description (optional)</label>
            <textarea
              id="material-description"
              name="description"
              className="o-form-control"
              value={currentUpload.description}
              onChange={handleUploadChange}
              rows={3}
              placeholder="Enter material description"
            ></textarea>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="material-type" className="o-form-label">Type</label>
            <select
              id="material-type"
              name="type"
              className="o-form-control"
              value={currentUpload.type}
              onChange={handleUploadChange}
            >
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {uploadProgress > 0 && (
            <div className="o-upload-progress">
              <div className="o-upload-progress__bar">
                <div 
                  className="o-upload-progress__fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="o-upload-progress__value">{uploadProgress}%</div>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Lesson"
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
            Are you sure you want to delete <strong>{lesson.title}</strong>?
            This action cannot be undone and will remove all associated materials.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default LessonPlanner;
