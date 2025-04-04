import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const ResourceManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    location: ''
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: 1,
    location: '',
    status: 'available'
  });
  
  // Fetch resources with pagination
  const {
    data: resources,
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
    (params) => apiService.get('/facilities/resources/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch categories and locations for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [categoriesResponse, locationsResponse] = await Promise.all([
          apiService.get('/facilities/resource-categories/'),
          apiService.get('/facilities/buildings/')
        ]);
        
        setCategories(categoriesResponse.data);
        setLocations(locationsResponse.data);
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
      category: '',
      status: '',
      location: ''
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
      [name]: name === 'quantity' ? parseInt(value, 10) : value
    });
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/facilities/resources/', formData);
        toast.success('Resource added successfully');
      } else {
        await apiService.put(`/facilities/resources/${selectedResource.id}/`, formData);
        toast.success('Resource updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast.error('Failed to save resource');
    }
  };
  
  // Open form modal to add new resource
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      name: '',
      category: '',
      description: '',
      quantity: 1,
      location: '',
      status: 'available'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing resource
  const openEditModal = (resource) => {
    setFormMode('edit');
    setSelectedResource(resource);
    setFormData({
      name: resource.name,
      category: resource.category,
      description: resource.description,
      quantity: resource.quantity,
      location: resource.location,
      status: resource.status
    });
    setIsFormModalOpen(true);
  };
  
  // Handle resource deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/facilities/resources/${selectedResource.id}/`);
      toast.success('Resource deleted successfully');
      setIsDeleteModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete resource');
    }
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
      title: 'Category',
      field: 'category_name',
      className: 'o-table-column--category',
      cellClassName: 'o-table-cell--category'
    },
    {
      title: 'Location',
      field: 'location_name',
      className: 'o-table-column--location',
      cellClassName: 'o-table-cell--location'
    },
    {
      title: 'Quantity',
      field: 'quantity',
      className: 'o-table-column--quantity',
      cellClassName: 'o-table-cell--quantity'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (resource) => (
        <span className={`o-tag o-tag--${resource.status.toLowerCase()}`}>
          {resource.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (resource) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Resource"
            onClick={() => openEditModal(resource)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Delete Resource"
            onClick={() => {
              setSelectedResource(resource);
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
    <div className="o-page o-page--resources">
      <header className="o-page__header">
        <h1>Resource Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Add Resource
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search resources..."
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
            <p>Loading resources...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load resources. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : resources.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-boxes"></i>
            <p>No resources found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={resources}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} resources
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
        title="Filter Resources"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
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
            <label htmlFor="location" className="o-form-label">Location</label>
            <select
              id="location"
              name="location"
              className="o-form-control"
              value={filters.location}
              onChange={handleFilterChange}
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
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
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="depleted">Depleted</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Resource Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add Resource' : 'Edit Resource'}
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
            <label htmlFor="name" className="o-form-label">Resource Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="o-form-control"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter resource name"
              required
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="form-category" className="o-form-label">Category</label>
            <select
              id="form-category"
              name="category"
              className="o-form-control"
              value={formData.category}
              onChange={handleFormChange}
              required
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
            <label htmlFor="description" className="o-form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="o-form-control"
              value={formData.description}
              onChange={handleFormChange}
              rows={3}
              placeholder="Enter resource description"
            ></textarea>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="quantity" className="o-form-label">Quantity</label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                className="o-form-control"
                value={formData.quantity}
                onChange={handleFormChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="form-status" className="o-form-label">Status</label>
              <select
                id="form-status"
                name="status"
                className="o-form-control"
                value={formData.status}
                onChange={handleFormChange}
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="maintenance">Under Maintenance</option>
                <option value="depleted">Depleted</option>
              </select>
            </div>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="form-location" className="o-form-label">Location</label>
            <select
              id="form-location"
              name="location"
              className="o-form-control"
              value={formData.location}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
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
        title="Delete Resource"
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
            Are you sure you want to delete <strong>{selectedResource?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ResourceManagement;
