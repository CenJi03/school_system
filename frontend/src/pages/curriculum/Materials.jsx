import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    course: '',
    lesson: ''
  });
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Fetch materials with pagination
  const {
    data: materials,
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
    (params) => apiService.get('/curriculum/materials/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const coursesResponse = await apiService.get('/curriculum/courses/', { params: { limit: 100 } });
        setCourses(coursesResponse.data.results || coursesResponse.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    
    fetchFilterOptions();
  }, []);
  
  // Fetch lessons when course filter changes
  useEffect(() => {
    const fetchLessons = async () => {
      if (!filters.course) {
        setLessons([]);
        return;
      }
      
      try {
        const lessonsResponse = await apiService.get(`/curriculum/courses/${filters.course}/lessons/`);
        setLessons(lessonsResponse.data.results || lessonsResponse.data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
        toast.error('Failed to load lessons');
      }
    };
    
    fetchLessons();
  }, [filters.course]);
  
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
    
    // If changing course, reset lesson filter
    if (name === 'course') {
      setFilters({
        ...filters,
        course: value,
        lesson: ''
      });
    } else {
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: '',
      course: '',
      lesson: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Handle material deletion
  const handleDelete = async () => {
    if (!selectedMaterial) return;
    
    try {
      await apiService.delete(`/curriculum/materials/${selectedMaterial.id}/`);
      toast.success('Material deleted successfully');
      reload();
      setIsDeleteModalOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Get icon for file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'document':
        return 'fa-file-pdf';
      case 'video':
        return 'fa-file-video';
      case 'audio':
        return 'fa-file-audio';
      case 'image':
        return 'fa-file-image';
      default:
        return 'fa-file';
    }
  };
  
  return (
    <div className="o-page o-page--materials">
      <header className="o-page__header">
        <h1>Teaching Materials</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary"
            as={Link}
            to="/curriculum/lessons"
          >
            <i className="fa fa-plus"></i> Add Materials
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search materials..."
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
            <p>Loading materials...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load materials. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : materials.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-file-alt"></i>
            <p>No materials found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="o-materials-grid">
            {materials.map((material) => (
              <div key={material.id} className="o-material-card">
                <div className="o-material-card__preview">
                  <i className={`fa ${getFileIcon(material.type)}`}></i>
                </div>
                <div className="o-material-card__body">
                  <h3 className="o-material-card__title">
                    {material.title}
                  </h3>
                  <div className="o-material-card__lesson">
                    <i className="fa fa-book"></i>
                    <Link to={`/curriculum/lessons/${material.lesson.id}`}>
                      {material.lesson.title}
                    </Link>
                  </div>
                  <div className="o-material-card__course">
                    <i className="fa fa-graduation-cap"></i>
                    <Link to={`/curriculum/courses/${material.course.id}`}>
                      {material.course.name}
                    </Link>
                  </div>
                  <div className="o-material-card__meta">
                    <span>
                      <i className="fa fa-weight"></i> {formatFileSize(material.file_size)}
                    </span>
                    <span>
                      <i className="fa fa-calendar"></i> {new Date(material.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="o-material-card__actions">
                  <Button 
                    variant="primary" 
                    size="small"
                    as="a"
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    <i className="fa fa-download"></i> Download
                  </Button>
                  <Button 
                    variant="danger" 
                    size="small"
                    onClick={() => {
                      setSelectedMaterial(material);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <i className="fa fa-trash"></i> Delete
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
                  <th>Title</th>
                  <th>Type</th>
                  <th>Course</th>
                  <th>Lesson</th>
                  <th>Size</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td>
                      <div className="o-material-title">
                        <i className={`fa ${getFileIcon(material.type)}`}></i>
                        <span>{material.title}</span>
                      </div>
                    </td>
                    <td>{material.type}</td>
                    <td>
                      <Link to={`/curriculum/courses/${material.course.id}`}>
                        {material.course.name}
                      </Link>
                    </td>
                    <td>
                      <Link to={`/curriculum/lessons/${material.lesson.id}`}>
                        {material.lesson.title}
                      </Link>
                    </td>
                    <td>{formatFileSize(material.file_size)}</td>
                    <td>{new Date(material.uploaded_at).toLocaleDateString()}</td>
                    <td>
                      <div className="o-table-actions">
                        <Button 
                          variant="icon" 
                          aria-label="Download"
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
                          aria-label="Delete"
                          onClick={() => {
                            setSelectedMaterial(material);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <i className="fa fa-trash"></i>
                        </Button>
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
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} materials
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
        title="Filter Materials"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
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
              <option value="document">Document</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="image">Image</option>
              <option value="other">Other</option>
            </select>
          </div>
          
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
            <label htmlFor="lesson" className="o-form-label">Lesson</label>
            <select
              id="lesson"
              name="lesson"
              className="o-form-control"
              value={filters.lesson}
              onChange={handleFilterChange}
              disabled={!filters.course}
            >
              <option value="">All Lessons</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Material"
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
            Are you sure you want to delete <strong>{selectedMaterial?.title}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Materials;
