import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Fees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    course: '',
    status: '',
    date_range: ''
  });
  const [courses, setCourses] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    course_id: '',
    due_date: '',
    status: 'pending'
  });
  
  // Fetch fees with pagination
  const {
    data: fees,
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
    (params) => apiService.get('/finance/fees/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch courses for filter options
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiService.get('/curriculum/courses/', {
          params: { limit: 100 }
        });
        setCourses(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to load courses');
      }
    };
    
    fetchCourses();
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
      course: '',
      status: '',
      date_range: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Open form modal to add new fee
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      name: '',
      description: '',
      amount: '',
      course_id: '',
      due_date: '',
      status: 'pending'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing fee
  const openEditModal = (fee) => {
    setFormMode('edit');
    setSelectedFee(fee);
    setFormData({
      name: fee.name,
      description: fee.description,
      amount: fee.amount,
      course_id: fee.course_id,
      due_date: fee.due_date,
      status: fee.status
    });
    setIsFormModalOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/finance/fees/', formData);
        toast.success('Fee added successfully');
      } else {
        await apiService.put(`/finance/fees/${selectedFee.id}/`, formData);
        toast.success('Fee updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving fee:', error);
      toast.error('Failed to save fee');
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Table columns
  const columns = [
    {
      title: 'Name',
      field: 'name',
      className: 'o-table-column--name',
      cellClassName: 'o-table-cell--name'
    },
    {
      title: 'Course',
      field: 'course_name',
      className: 'o-table-column--course',
      cellClassName: 'o-table-cell--course'
    },
    {
      title: 'Amount',
      field: 'amount',
      className: 'o-table-column--amount',
      cellClassName: 'o-table-cell--amount',
      render: (fee) => formatCurrency(fee.amount)
    },
    {
      title: 'Due Date',
      field: 'due_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (fee) => formatDate(fee.due_date)
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (fee) => (
        <span className={`o-tag o-tag--${fee.status.toLowerCase()}`}>
          {fee.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (fee) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Fee"
            onClick={() => openEditModal(fee)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="View Details"
            as={Link}
            to={`/finance/fees/${fee.id}`}
          >
            <i className="fa fa-eye"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--fees">
      <header className="o-page__header">
        <h1>Fee Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Add Fee
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search fees..."
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
            <p>Loading fees...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load fees. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : fees.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-dollar-sign"></i>
            <p>No fees found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={fees}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} fees
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
        title="Filter Fees"
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
            <label htmlFor="status" className="o-form-label">Status</label>
            <select
              id="status"
              name="status"
              className="o-form-control"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="date_range" className="o-form-label">Date Range</label>
            <select
              id="date_range"
              name="date_range"
              className="o-form-control"
              value={filters.date_range}
              onChange={handleFilterChange}
            >
              <option value="">All Time</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Fee Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add Fee' : 'Edit Fee'}
        footer={
          <>
            <Button variant="light" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit}>
              {formMode === 'add' ? 'Add' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="o-form">
          <div className="o-form-group">
            <label htmlFor="name" className="o-form-label">Fee Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="o-form-control"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter fee name"
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
              placeholder="Enter fee description"
            ></textarea>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="amount" className="o-form-label">Amount</label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                className="o-form-control"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="Enter amount"
                required
              />
            </div>
            
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
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Fees;
