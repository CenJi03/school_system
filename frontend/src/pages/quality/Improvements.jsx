import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/dates';

const Improvements = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    date_range: ''
  });
  const [categories, setCategories] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedImprovement, setSelectedImprovement] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    category: '',
    due_date: '',
    owner: '',
    implementation_plan: ''
  });
  
  // Fetch improvements with pagination
  const {
    data: improvements,
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
    (params) => apiService.get('/quality/improvements/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch categories for filter options
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.get('/quality/improvement-categories/');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };
    
    fetchCategories();
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
      priority: '',
      category: '',
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
  
  // Open form modal to add new improvement
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      category: '',
      due_date: '',
      owner: '',
      implementation_plan: ''
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing improvement
  const openEditModal = (improvement) => {
    setFormMode('edit');
    setSelectedImprovement(improvement);
    setFormData({
      title: improvement.title,
      description: improvement.description || '',
      status: improvement.status,
      priority: improvement.priority,
      category: improvement.category || '',
      due_date: improvement.due_date || '',
      owner: improvement.owner || '',
      implementation_plan: improvement.implementation_plan || ''
    });
    setIsFormModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (improvement) => {
    setSelectedImprovement(improvement);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/quality/improvements/', formData);
        toast.success('Improvement initiative added successfully');
      } else {
        await apiService.put(`/quality/improvements/${selectedImprovement.id}/`, formData);
        toast.success('Improvement initiative updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving improvement:', error);
      toast.error('Failed to save improvement initiative');
    }
  };
  
  // Handle improvement deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/quality/improvements/${selectedImprovement.id}/`);
      toast.success('Improvement initiative deleted successfully');
      setIsDeleteModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error deleting improvement:', error);
      toast.error('Failed to delete improvement initiative');
    }
  };
  
  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_progress': return 'primary';
      case 'implemented': return 'success';
      case 'cancelled': return 'danger';
      default: return 'light';
    }
  };
  
  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'secondary';
    }
  };
  
  // Format status for display
  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
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
      title: 'Category',
      field: 'category_name',
      className: 'o-table-column--category',
      cellClassName: 'o-table-cell--category'
    },
    {
      title: 'Priority',
      field: 'priority',
      className: 'o-table-column--priority',
      cellClassName: 'o-table-cell--priority',
      render: (improvement) => (
        <span className={`o-tag o-tag--${getPriorityClass(improvement.priority)}`}>
          {improvement.priority.toUpperCase()}
        </span>
      )
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (improvement) => (
        <span className={`o-tag o-tag--${getStatusClass(improvement.status)}`}>
          {formatStatus(improvement.status)}
        </span>
      )
    },
    {
      title: 'Due Date',
      field: 'due_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (improvement) => improvement.due_date ? formatDate(improvement.due_date) : '-'
    },
    {
      title: 'Owner',
      field: 'owner',
      className: 'o-table-column--owner',
      cellClassName: 'o-table-cell--owner'
    },
    {
      title: 'Actions',
      render: (improvement) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit"
            onClick={() => openEditModal(improvement)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Delete"
            onClick={() => openDeleteModal(improvement)}
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
    <div className="o-page o-page--improvements">
      <header className="o-page__header">
        <h1>Quality Improvements</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Add Improvement
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search improvements..."
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
            <p>Loading improvements...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load improvements. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : improvements.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-chart-line"></i>
            <p>No improvement initiatives found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={improvements}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} improvements
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
        title="Filter Improvements"
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
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="implemented">Implemented</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="priority" className="o-form-label">Priority</label>
            <select
              id="priority"
              name="priority"
              className="o-form-control"
              value={filters.priority}
              onChange={handleFilterChange}
            >
              <option value="">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="category" className="o-form-label">Category</label>
            <select
              id="category"
              name="category"
              className="o-form-control"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
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
              <option value="upcoming">Upcoming</option>
              <option value="overdue">Overdue</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="next_month">Next Month</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Improvement Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add Improvement Initiative' : 'Edit Improvement Initiative'}
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
            <label htmlFor="title" className="o-form-label">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              className="o-form-control"
              value={formData.title}
              onChange={handleFormChange}
              placeholder="Enter improvement title"
              required
            />
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
              placeholder="Enter improvement description"
            ></textarea>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="priority" className="o-form-label">Priority</label>
              <select
                id="priority"
                name="priority"
                className="o-form-control"
                value={formData.priority}
                onChange={handleFormChange}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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
                <option value="in_progress">In Progress</option>
                <option value="implemented">Implemented</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="category" className="o-form-label">Category</label>
              <select
                id="category"
                name="category"
                className="o-form-control"
                value={formData.category}
                onChange={handleFormChange}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
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
              />
            </div>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="owner" className="o-form-label">Responsible Person</label>
            <input
              id="owner"
              name="owner"
              type="text"
              className="o-form-control"
              value={formData.owner}
              onChange={handleFormChange}
              placeholder="Enter name of responsible person"
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="implementation_plan" className="o-form-label">Implementation Plan</label>
            <textarea
              id="implementation_plan"
              name="implementation_plan"
              className="o-form-control"
              value={formData.implementation_plan}
              onChange={handleFormChange}
              rows={4}
              placeholder="Enter implementation plan details"
            ></textarea>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Improvement Initiative"
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
            Are you sure you want to delete this improvement initiative: <strong>{selectedImprovement?.title}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Improvements;
