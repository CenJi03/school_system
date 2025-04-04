import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Leads = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    date_range: ''
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedLead, setSelectedLead] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    status: 'new',
    notes: ''
  });

  // Fetch leads with pagination
  const {
    data: leads,
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
    (params) => apiService.get('/marketing/leads/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );

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
      source: '',
      date_range: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
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
      title: 'Email',
      field: 'email',
      className: 'o-table-column--email',
      cellClassName: 'o-table-cell--email'
    },
    {
      title: 'Phone',
      field: 'phone',
      className: 'o-table-column--phone',
      cellClassName: 'o-table-cell--phone'
    },
    {
      title: 'Source',
      field: 'source',
      className: 'o-table-column--source',
      cellClassName: 'o-table-cell--source'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (lead) => (
        <span className={`o-tag o-tag--${lead.status.toLowerCase()}`}>
          {lead.status}
        </span>
      )
    },
    {
      title: 'Created Date',
      field: 'created_at',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (lead) => formatDate(lead.created_at)
    },
    {
      title: 'Actions',
      render: (lead) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Lead"
            onClick={() => openEditModal(lead)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Convert to Student"
            onClick={() => convertToStudent(lead)}
          >
            <i className="fa fa-user-graduate"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--leads">
      <header className="o-page__header">
        <h1>Lead Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={() => openAddModal()}
          >
            Add Lead
          </Button>
        </div>
      </header>

      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search leads..."
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
            <p>Loading leads...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load leads. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : leads?.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-user-plus"></i>
            <p>No leads found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={leads || []}
            keyField="id"
            hoverable
            striped
          />
        )}
      </Card>
    </div>
  );

  // These functions would be implemented to handle the modal operations
  function openAddModal() {
    // Implementation would go here
    console.log('Opening add modal');
  }

  function openEditModal(lead) {
    // Implementation would go here
    console.log('Opening edit modal for', lead.name);
  }

  function convertToStudent(lead) {
    // Implementation would go here
    console.log('Converting lead to student:', lead.name);
  }
};

export default Leads;
