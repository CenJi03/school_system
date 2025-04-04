import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import curriculumService from '../../services/curriculum';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Enrollment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const courseId = queryParams.get('courseId');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    level: ''
  });
  const [levels, setLevels] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [courseToEnroll, setCourseToEnroll] = useState(courseId || '');
  const [courses, setCourses] = useState([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  
  // Fetch student data with pagination
  const {
    data: students,
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
    (params) => apiService.get('/students/', { params }),
    {
      search: searchTerm,
      not_enrolled: courseToEnroll || undefined,
      ...filters
    }
  );
  
  // Fetch courses and levels for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [coursesResponse, levelsResponse] = await Promise.all([
          curriculumService.getCourses({ status: 'active', limit: 100 }),
          apiService.get('/students/levels/')
        ]);
        
        setCourses(coursesResponse.results || coursesResponse);
        setLevels(levelsResponse.data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast.error('Failed to load filter options');
      }
    };
    
    fetchFilterOptions();
  }, []);
  
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
      status: '',
      level: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Handle student selection
  const handleStudentSelection = (student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };
  
  // Toggle select all students
  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents([...students]);
    }
  };
  
  // Handle course selection for enrollment
  const handleCourseChange = (e) => {
    setCourseToEnroll(e.target.value);
  };
  
  // Open enrollment modal
  const openEnrollModal = () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student to enroll');
      return;
    }
    setIsEnrollModalOpen(true);
  };
  
  // Enroll students
  const enrollStudents = async () => {
    if (!courseToEnroll) {
      toast.error('Please select a course');
      return;
    }
    
    try {
      const studentIds = selectedStudents.map(student => student.id);
      await apiService.post(`/curriculum/courses/${courseToEnroll}/enroll/`, {
        student_ids: studentIds
      });
      
      toast.success(`Successfully enrolled ${studentIds.length} student(s)`);
      setSelectedStudents([]);
      setIsEnrollModalOpen(false);
      reload();
      
      // Redirect to course detail if we came from there
      if (courseId) {
        navigate(`/curriculum/courses/${courseId}`);
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      toast.error('Failed to enroll students');
    }
  };
  
  // Table columns
  const columns = [
    {
      title: (
        <input 
          type="checkbox" 
          checked={students.length > 0 && selectedStudents.length === students.length}
          onChange={toggleSelectAll}
        />
      ),
      render: (student) => (
        <input 
          type="checkbox" 
          checked={selectedStudents.some(s => s.id === student.id)} 
          onChange={() => handleStudentSelection(student)}
        />
      ),
      className: 'o-table-column--checkbox',
      cellClassName: 'o-table-cell--checkbox'
    },
    {
      title: 'ID',
      field: 'student_id',
      className: 'o-table-column--id',
      cellClassName: 'o-table-cell--id'
    },
    {
      title: 'Name',
      field: 'name'
    },
    {
      title: 'Email',
      field: 'email',
      className: 'o-table-column--email',
      cellClassName: 'o-table-cell--email'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (student) => (
        <span className={`o-tag o-tag--${student.status.toLowerCase()}`}>
          {student.status}
        </span>
      )
    },
    {
      title: 'Level',
      field: 'level',
      className: 'o-table-column--level',
      cellClassName: 'o-table-cell--level'
    }
  ];

  return (
    <div className="o-page o-page--enrollment">
      <header className="o-page__header">
        <h1>Student Enrollment</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-user-plus"></i>}
            onClick={openEnrollModal}
            disabled={selectedStudents.length === 0}
          >
            Enroll Selected Students
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search students..."
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
            
            {courseToEnroll && (
              <div className="o-active-filter">
                <span>Course: {courses.find(c => c.id === courseToEnroll)?.name}</span>
                <button 
                  className="o-active-filter__remove" 
                  onClick={() => setCourseToEnroll('')}
                >
                  <i className="fa fa-times"></i>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load students. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : students.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-users"></i>
            <p>No students found</p>
            {(searchTerm || Object.values(filters).some(Boolean) || courseToEnroll) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={students}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} students
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
        title="Filter Students"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="level" className="o-form-label">Level</label>
            <select
              id="level"
              name="level"
              className="o-form-control"
              value={filters.level}
              onChange={handleFilterChange}
            >
              <option value="">All Levels</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Enrollment Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Enroll ${selectedStudents.length} Student(s)`}
        footer={
          <>
            <Button variant="light" onClick={() => setIsEnrollModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={enrollStudents}
              disabled={!courseToEnroll}
            >
              Enroll
            </Button>
          </>
        }
      >
        <div className="o-enrollment-form">
          <div className="o-form-group">
            <label htmlFor="course" className="o-form-label">Select Course</label>
            <select
              id="course"
              name="course"
              className="o-form-control"
              value={courseToEnroll}
              onChange={handleCourseChange}
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.level})
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-enrollment-summary">
            <h4>Selected Students ({selectedStudents.length})</h4>
            <ul className="o-enrollment-summary__list">
              {selectedStudents.slice(0, 5).map(student => (
                <li key={student.id}>{student.name}</li>
              ))}
              {selectedStudents.length > 5 && (
                <li>...and {selectedStudents.length - 5} more</li>
              )}
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Enrollment;
