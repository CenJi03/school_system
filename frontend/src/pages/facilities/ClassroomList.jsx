import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const ClassroomList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    building: '',
    capacity: '',
    status: ''
  });
  const [buildings, setBuildings] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    building: '',
    capacity: '',
    facilities: '',
    status: 'available'
  });
  
  // Fetch classrooms with pagination
  const {
    data: classrooms,
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
    (params) => apiService.get('/facilities/classrooms/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch buildings for filter options
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await apiService.get('/facilities/buildings/');
        setBuildings(response.data);
      } catch (error) {
        console.error('Error fetching buildings:', error);
        toast.error('Failed to load building options');
      }
    };
    
    fetchBuildings();
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
      building: '',
      capacity: '',
      status: ''
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
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/facilities/classrooms/', formData);
        toast.success('Classroom added successfully');
      } else {
        await apiService.put(`/facilities/classrooms/${selectedClassroom.id}/`, formData);
        toast.success('Classroom updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving classroom:', error);
      toast.error('Failed to save classroom');
    }
  };
  
  // Open form modal to add new classroom
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      name: '',
      building: '',
      capacity: '',
      facilities: '',
      status: 'available'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing classroom
  const openEditModal = (classroom) => {
    setFormMode('edit');
    setSelectedClassroom(classroom);
    setFormData({
      name: classroom.name,
      building: classroom.building,
      capacity: classroom.capacity,
      facilities: classroom.facilities,
      status: classroom.status
    });
    setIsFormModalOpen(true);
  };
  
  // Handle classroom deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/facilities/classrooms/${selectedClassroom.id}/`);
      toast.success('Classroom deleted successfully');
      setIsDeleteModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error deleting classroom:', error);
      toast.error('Failed to delete classroom');
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
      title: 'Building',
      field: 'building',
      className: 'o-table-column--building',
      cellClassName: 'o-table-cell--building'
    },
    {
      title: 'Capacity',
      field: 'capacity',
      className: 'o-table-column--capacity',
      cellClassName: 'o-table-cell--capacity'
    },
    {
      title: 'Facilities',
      field: 'facilities',
      className: 'o-table-column--facilities',
      cellClassName: 'o-table-cell--facilities'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (classroom) => (
        <span className={`o-tag o-tag--${classroom.status.toLowerCase()}`}>
          {classroom.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (classroom) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Classroom"
            onClick={() => openEditModal(classroom)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Delete Classroom"
            onClick={() => {
              setSelectedClassroom(classroom);
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
    <div className="o-page o-page--classrooms">
      <header className="o-page__header">
        <h1>Classrooms</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Add Classroom
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search classrooms..."
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
            <p>Loading classrooms...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load classrooms. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-chalkboard"></i>
            <p>No classrooms found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={classrooms}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} classrooms
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
        title="Filter Classrooms"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
          <div className="o-form-group">
            <label htmlFor="building" className="o-form-label">Building</label>
            <select
              id="building"
              name="building"
              className="o-form-control"
              value={filters.building}
              onChange={handleFilterChange}
            >
              <option value="">All Buildings</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="capacity" className="o-form-label">Minimum Capacity</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="0"
              className="o-form-control"
              value={filters.capacity}
              onChange={handleFilterChange}
              placeholder="Enter min capacity"
            />
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
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Classroom Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add Classroom' : 'Edit Classroom'}
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
            <label htmlFor="name" className="o-form-label">Classroom Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="o-form-control"
              value={formData.name}
              onChange={handleFormChange}
              placeholder="Enter classroom name"
              required
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="form-building" className="o-form-label">Building</label>
            <select
              id="form-building"
              name="building"
              className="o-form-control"
              value={formData.building}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Building</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="capacity" className="o-form-label">Capacity</label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              className="o-form-control"
              value={formData.capacity}
              onChange={handleFormChange}
              placeholder="Enter capacity"
              required
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="facilities" className="o-form-label">Facilities</label>
            <textarea
              id="facilities"
              name="facilities"
              className="o-form-control"
              value={formData.facilities}
              onChange={handleFormChange}
              rows="3"
              placeholder="Enter available facilities (e.g., Projector, Whiteboard, Computers)"
            ></textarea>
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
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Classroom"
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
            Are you sure you want to delete classroom <strong>{selectedClassroom?.name}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ClassroomList;
