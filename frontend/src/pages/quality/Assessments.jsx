import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Assessments = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    course: '',
    type: '',
    status: '',
    date_range: ''
  });
  const [courses, setCourses] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    course_id: '',
    type: 'quiz',
    total_points: 100,
    due_date: '',
    status: 'draft'
  });
  const [gradeData, setGradeData] = useState([]);
  
  // Assessment types
  const assessmentTypes = [
    { value: 'quiz', label: 'Quiz' },
    { value: 'test', label: 'Test' },
    { value: 'exam', label: 'Exam' },
    { value: 'assignment', label: 'Assignment' },
    { value: 'project', label: 'Project' }
  ];
  
  // Assessment statuses
  const assessmentStatuses = [
    { value: 'draft', label: 'Draft' },
    { value: 'published', label: 'Published' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'graded', label: 'Graded' },
    { value: 'archived', label: 'Archived' }
  ];
  
  // Fetch assessments with pagination
  const {
    data: assessments,
    totalItems,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    goToPage,
    setItemsPerPage,
    reload
  } = usePagination(
    (params) => apiService.get('/quality/assessments/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch courses for filters
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiService.get('/curriculum/courses/', {
          params: {
            limit: 100,
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
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Apply search after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      reload();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, reload]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      course: '',
      type: '',
      status: '',
      date_range: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Open form modal to add new assessment
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      title: '',
      description: '',
      course_id: '',
      type: 'quiz',
      total_points: 100,
      due_date: '',
      status: 'draft'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing assessment
  const openEditModal = (assessment) => {
    setFormMode('edit');
    setSelectedAssessment(assessment);
    setFormData({
      title: assessment.title,
      description: assessment.description || '',
      course_id: assessment.course.id,
      type: assessment.type,
      total_points: assessment.total_points,
      due_date: assessment.due_date,
      status: assessment.status
    });
    setIsFormModalOpen(true);
  };
  
  // Open grade modal
  const openGradeModal = async (assessment) => {
    setSelectedAssessment(assessment);
    
    try {
      const response = await apiService.get(`/quality/assessments/${assessment.id}/submissions/`);
      setGradeData(response.data);
      setIsGradeModalOpen(true);
    } catch (error) {
      console.error('Error fetching assessment submissions:', error);
      toast.error('Failed to load student submissions');
    }
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/quality/assessments/', formData);
        toast.success('Assessment created successfully');
      } else {
        await apiService.put(`/quality/assessments/${selectedAssessment.id}/`, formData);
        toast.success('Assessment updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to save assessment');
    }
  };
  
  // Handle assessment deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/quality/assessments/${selectedAssessment.id}/`);
      toast.success('Assessment deleted successfully');
      setIsDeleteModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
  };
  
  // Handle grade changes
  const handleGradeChange = (studentId, value) => {
    setGradeData(prevData => 
      prevData.map(item => 
        item.student.id === studentId 
          ? { ...item, score: value }
          : item
      )
    );
  };
  
  // Submit grades
  const submitGrades = async () => {
    try {
      await apiService.post(`/quality/assessments/${selectedAssessment.id}/grade/`, {
        grades: gradeData.map(item => ({
          student_id: item.student.id,
          score: item.score
        }))
      });
      toast.success('Grades saved successfully');
      setIsGradeModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to save grades');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get status type for badge styling
  const getStatusType = (status) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'published': return 'info';
      case 'in_progress': return 'warning';
      case 'graded': return 'success';
      case 'archived': return 'light';
      default: return 'primary';
    }
  };
  
  // Table columns
  const columns = [
    {
      title: 'Title',
      field: 'title',
      className: 'o-table-column--title',
      cellClassName: 'o-table-cell--title'
    },
    {
      title: 'Course',
      field: 'course.name',
      className: 'o-table-column--course',
      cellClassName: 'o-table-cell--course'
    },
    {
      title: 'Type',
      field: 'type',
      className: 'o-table-column--type',
      cellClassName: 'o-table-cell--type',
      render: (assessment) => {
        const type = assessmentTypes.find(t => t.value === assessment.type);
        return type?.label || assessment.type;
      }
    },
    {
      title: 'Due Date',
      field: 'due_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (assessment) => formatDate(assessment.due_date)
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (assessment) => (
        <span className={`o-tag o-tag--${getStatusType(assessment.status)}`}>
          {assessment.status.replace('_', ' ')}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (assessment) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Assessment"
            onClick={() => openEditModal(assessment)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Grade Assessment"
            onClick={() => openGradeModal(assessment)}
          >
            <i className="fa fa-check-square"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Delete Assessment"
            onClick={() => {
              setSelectedAssessment(assessment);
              setIsDeleteModalOpen(true);
            }}
          >
            <i className="fa fa-trash"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--assessments">
      <header className="o-page__header">
        <h1>Assessments</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Create Assessment
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="o-filter-actions">
            <Button 
              variant="light"
              icon={<i className="fa fa-filter"></i>}
              onClick={() => setIsFilterModalOpen(true)}
            >
              Filters
              {Object.values(filters).some(Boolean) && (
                <span className="o-filter-badge"></span>
              )}
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Loading assessments...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load assessments. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : assessments.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-tasks"></i>
            <p>No assessments found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={assessments}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} assessments
          </div>
          
          <div className="o-pagination__controls">
            <Button 
              variant="icon"
              disabled={page === 1}
              onClick={() => goToPage(1)}
            >
              <i className="fa fa-angle-double-left"></i>
            </Button>
            <Button 
              variant="icon"
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
            >
              <i className="fa fa-angle-left"></i>
            </Button>
            
            <span className="o-pagination__pages">
              Page {page} of {totalPages}
            </span>
            
            <Button 
              variant="icon"
              disabled={page === totalPages}
              onClick={() => goToPage(page + 1)}
            >
              <i className="fa fa-angle-right"></i>
            </Button>
            <Button 
              variant="icon"
              disabled={page === totalPages}
              onClick={() => goToPage(totalPages)}
            >
              <i className="fa fa-angle-double-right"></i>
            </Button>
          </div>
          
          <div className="o-pagination__size">
            <span>Show</span>
            <select 
              value={pageSize}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>entries</span>
          </div>
        </div>
      </Card>
      
      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Assessments"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
          <div className="o-form-group">
            <label htmlFor="course" className="o-form-label">Course</label>
            <select
              id="course"
              name="course"
              className="o-form-control"
              value={filters.course}
              onChange={handleFilterChange}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="type" className="o-form-label">Type</label>
            <select
              id="type"
              name="type"
              className="o-form-control"
              value={filters.type}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {assessmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="status" className="o-form-label">Status</label>
            <select
              id="status"
              name="status"
              className="o-form-control"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              {assessmentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="date_range" className="o-form-label">Due Date</label>
            <select
              id="date_range"
              name="date_range"
              className="o-form-control"
              value={filters.date_range}
              onChange={handleFilterChange}
            >
              <option value="">Any Time</option>
              <option value="past_due">Past Due</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="next_week">Next Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Assessment Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Create Assessment' : 'Edit Assessment'}
        footer={
          <>
            <Button variant="light" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit}>
              {formMode === 'add' ? 'Create' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <div className="o-form">
          <div className="o-form-group">
            <label htmlFor="title" className="o-form-label">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              className="o-form-control"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Enter assessment title"
              required
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="course_id" className="o-form-label">Course</label>
            <select
              id="course_id"
              name="course_id"
              className="o-form-control"
              value={formData.course_id}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="description" className="o-form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="o-form-control"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Enter assessment description"
            ></textarea>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="type" className="o-form-label">Type</label>
              <select
                id="type"
                name="type"
                className="o-form-control"
                value={formData.type}
                onChange={handleFormChange}
                required
              >
                {assessmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="total_points" className="o-form-label">Total Points</label>
              <input
                id="total_points"
                name="total_points"
                type="number"
                min="1"
                className="o-form-control"
                value={formData.total_points}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="due_date" className="o-form-label">Due Date</label>
              <input
                id="due_date"
                name="due_date"
                type="date"
                className="o-form-control"
                value={formData.due_date}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="status" className="o-form-label">Status</label>
              <select
                id="status"
                name="status"
                className="o-form-control"
                value={formData.status}
                onChange={handleFormChange}
              >
                {assessmentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Grade Assessment Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title="Grade Assessment"
        size="large"
        footer={
          <>
            <Button variant="light" onClick={() => setIsGradeModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitGrades}>
              Save Grades
            </Button>
          </>
        }
      >
        <div className="o-grading-container">
          <div className="o-assessment-info">
            <h3>{selectedAssessment?.title}</h3>
            <div className="o-assessment-meta">
              <span>Course: {selectedAssessment?.course?.name}</span>
              <span>Total Points: {selectedAssessment?.total_points}</span>
              <span>Due Date: {formatDate(selectedAssessment?.due_date)}</span>
            </div>
          </div>
          
          {gradeData.length === 0 ? (
            <div className="o-empty-state">
              <i className="fa fa-user-graduate"></i>
              <p>No student submissions found</p>
            </div>
          ) : (
            <div className="o-table-responsive">
              <table className="o-table o-table--grading">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th width="150">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((submission) => (
                    <tr key={submission.student.id}>
                      <td>
                        <div className="o-student-info">
                          <div className="o-avatar o-avatar--small">
                            {submission.student.name.charAt(0)}
                          </div>
                          <Link to={`/students/${submission.student.id}`}>
                            {submission.student.name}
                          </Link>
                        </div>
                      </td>
                      <td>{formatDate(submission.submission_date)}</td>
                      <td>
                        <span className={`o-tag o-tag--${submission.status === 'submitted' ? 'success' : 'warning'}`}>
                          {submission.status}
                        </span>
                      </td>
                      <td>
                        {submission.score !== null ? (
                          <span>{submission.score} / {selectedAssessment?.total_points}</span>
                        ) : (
                          <span className="o-text-muted">Not graded</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="o-form-control"
                          min="0"
                          max={selectedAssessment?.total_points}
                          value={submission.score !== null ? submission.score : ''}
                          onChange={(e) => handleGradeChange(submission.student.id, e.target.value)}
                          disabled={submission.status !== 'submitted'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Assessment"
        footer={
          <>
            <Button variant="light" onClick={() => setIsDeleteModalOpen(false)}>
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
            Are you sure you want to delete the assessment <strong>{selectedAssessment?.title}</strong>?
            This action cannot be undone and will delete all associated student submissions and grades.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Assessments;
