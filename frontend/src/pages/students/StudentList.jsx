// src/pages/students/StudentList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const StudentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    course: '',
    level: ''
  });
  const [courses, setCourses] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
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
      ...filters
    }
  );
  
  // Fetch courses and levels for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [coursesResponse, levelsResponse] = await Promise.all([
          apiService.get('/curriculum/courses/', { params: { limit: 100 } }),
          apiService.get('/students/levels/')
        ]);
        
        setCourses(coursesResponse.data.results || coursesResponse.data);
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
      course: '',
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
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedStudents.length === 0) {
      toast.error('No students selected');
      return;
    }
    
    const studentIds = selectedStudents.map(student => student.id);
    
    try {
      await apiService.post(`/students/bulk-actions/${action}/`, { student_ids: studentIds });
      toast.success(`${action} operation successful for ${studentIds.length} students`);
      reload();
      setSelectedStudents([]);
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error);
      toast.error(`Failed to perform ${action} operation`);
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
      render: (student) => (
        <div className="o-student-info">
          <div className="o-avatar o-avatar--small">
            {student.name.charAt(0)}
          </div>
          <div className="o-student-info__details">
            <div className="o-student-info__name">
              <Link to={`/students/${student.id}`}>{student.name}</Link>
            </div>
            <div className="o-student-info__email">{student.email}</div>
          </div>
        </div>
      )
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
      title: 'Course',
      field: 'course',
      className: 'o-table-column--course',
      cellClassName: 'o-table-cell--course'
    },
    {
      title: 'Level',
      field: 'level',
      className: 'o-table-column--level',
      cellClassName: 'o-table-cell--level'
    },
    {
      title: 'Actions',
      render: (student) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="View Student"
            as={Link}
            to={`/students/${student.id}`}
          >
            <i className="fa fa-eye"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Edit Student"
            as={Link}
            to={`/students/${student.id}/edit`}
          >
            <i className="fa fa-edit"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--students">
      <header className="o-page__header">
        <h1>Students</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            as={Link}
            to="/students/new"
          >
            Add Student
          </Button>
          <Button 
            variant="secondary"
            icon={<i className="fa fa-download"></i>}
            onClick={() => apiService.download('/students/export/', 'students.xlsx')}
          >
            Export
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
            
            <div className="o-bulk-actions">
              <Button 
                variant="light"
                disabled={selectedStudents.length === 0}
                onClick={() => handleBulkAction('enroll')}
              >
                Enroll
              </Button>
              <Button 
                variant="light"
                disabled={selectedStudents.length === 0}
                onClick={() => handleBulkAction('archive')}
              >
                Archive
              </Button>
            </div>
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
            {(searchTerm || Object.values(filters).some(Boolean)) && (
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
    </div>
  );
};

export default StudentList;