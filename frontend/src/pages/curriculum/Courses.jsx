// src/pages/curriculum/Courses.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const Courses = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    level: '',
    status: '',
    teacher: ''
  });
  const [levels, setLevels] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Fetch courses with pagination
  const {
    data: courses,
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
    (params) => apiService.get('/curriculum/courses/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [levelsResponse, teachersResponse] = await Promise.all([
          apiService.get('/curriculum/levels/'),
          apiService.get('/staff/', { params: { role: 'teacher', limit: 100 } })
        ]);
        
        setLevels(levelsResponse.data);
        setTeachers(teachersResponse.data.results || teachersResponse.data);
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
      level: '',
      status: '',
      teacher: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Handle course actions (archive, duplicate, etc.)
  const handleCourseAction = async (courseId, action) => {
    try {
      await apiService.post(`/curriculum/courses/${courseId}/${action}/`);
      toast.success(`Course ${action} successful`);
      reload();
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast.error(`Failed to ${action} course`);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <div className="o-page o-page--courses">
      <header className="o-page__header">
        <h1>Courses</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            as={Link}
            to="/curriculum/courses/new"
          >
            Create Course
          </Button>
          
          <Button 
            variant="secondary"
            icon={<i className="fa fa-download"></i>}
            onClick={() => apiService.download('/curriculum/courses/export/', 'courses.xlsx')}
          >
            Export
          </Button>
        </div>
      </header>
      
      <Card variant="default" className="o-course-list">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search courses..."
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
            
            <div className="o-view-toggle">
              <Button 
                variant={viewMode === 'grid' ? 'secondary' : 'light'}
                aria-label="Grid View"
                onClick={() => setViewMode('grid')}
              >
                <i className="fa fa-th"></i>
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'secondary' : 'light'}
                aria-label="List View"
                onClick={() => setViewMode('list')}
              >
                <i className="fa fa-list"></i>
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load courses. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : courses.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-book"></i>
            <p>No courses found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="o-courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="o-course-card">
                <div 
                  className="o-course-card__header"
                  style={{ backgroundImage: `url(${course.image_url || '/assets/images/course-default.jpg'})` }}
                >
                  <div className="o-course-card__actions">
                    <div className="o-dropdown">
                      <Button variant="icon" aria-label="Course Actions">
                        <i className="fa fa-ellipsis-v"></i>
                      </Button>
                      <div className="o-dropdown__menu">
                        <Link to={`/curriculum/courses/${course.id}`}>
                          <i className="fa fa-eye"></i> View Details
                        </Link>
                        <Link to={`/curriculum/courses/${course.id}/edit`}>
                          <i className="fa fa-edit"></i> Edit
                        </Link>
                        <button onClick={() => handleCourseAction(course.id, 'duplicate')}>
                          <i className="fa fa-copy"></i> Duplicate
                        </button>
                        <button onClick={() => handleCourseAction(course.id, 'archive')}>
                          <i className="fa fa-archive"></i> Archive
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className={`o-course-level o-course-level--${course.level.toLowerCase()}`}>
                    {course.level}
                  </span>
                </div>
                <div className="o-course-card__body">
                  <h3 className="o-course-card__title">
                    <Link to={`/curriculum/courses/${course.id}`}>{course.name}</Link>
                  </h3>
                  <div className="o-course-card__info">
                    <div className="o-course-card__teacher">
                      <i className="fa fa-user-tie"></i>
                      <span>{course.teacher.name}</span>
                    </div>
                    <div className="o-course-card__students">
                      <i className="fa fa-users"></i>
                      <span>{course.student_count} Students</span>
                    </div>
                  </div>
                  <div className="o-course-card__status">
                    <span className={`o-tag o-tag--${course.status.toLowerCase()}`}>
                      {course.status}
                    </span>
                  </div>
                </div>
                <div className="o-course-card__footer">
                  <Button 
                    variant="primary" 
                    fullWidth
                    as={Link}
                    to={`/curriculum/courses/${course.id}`}
                  >
                    View Course
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Teacher</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Created</th>
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
                    <td className="o-table-cell--center">{course.student_count}</td>
                    <td>
                      <span className={`o-tag o-tag--${course.status.toLowerCase()}`}>
                        {course.status}
                      </span>
                    </td>
                    <td>{formatDate(course.created_at)}</td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="icon" 
                          aria-label="View Details"
                          as={Link}
                          to={`/curriculum/courses/${course.id}`}
                        >
                          <i className="fa fa-eye"></i>
                        </Button>
                        <Button 
                          variant="icon" 
                          aria-label="Edit Course"
                          as={Link}
                          to={`/curriculum/courses/${course.id}/edit`}
                        >
                          <i className="fa fa-edit"></i>
                        </Button>
                        <div className="o-dropdown">
                          <Button variant="icon" aria-label="More Actions">
                            <i className="fa fa-ellipsis-v"></i>
                          </Button>
                          <div className="o-dropdown__menu">
                            <button onClick={() => handleCourseAction(course.id, 'duplicate')}>
                              <i className="fa fa-copy"></i> Duplicate
                            </button>
                            <button onClick={() => handleCourseAction(course.id, 'archive')}>
                              <i className="fa fa-archive"></i> Archive
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} courses
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
        title="Filter Courses"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
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
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="teacher" className="o-form-label">Teacher</label>
            <select
              id="teacher"
              name="teacher"
              className="o-form-control"
              value={filters.teacher}
              onChange={handleFilterChange}
            >
              <option value="">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Courses;