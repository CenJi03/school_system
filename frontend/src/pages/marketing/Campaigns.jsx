import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Campaigns = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    date_range: ''
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'email',
    status: 'draft',
    start_date: '',
    end_date: '',
    budget: '',
    target_audience: ''
  });

  // Fetch campaigns with pagination
  const {
    data: campaigns,
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
    (params) => apiService.get('/marketing/campaigns/', { params }),
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
      type: '',
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
      title: 'Type',
      field: 'type',
      className: 'o-table-column--type',
      cellClassName: 'o-table-cell--type'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (campaign) => (
        <span className={`o-tag o-tag--${campaign.status.toLowerCase()}`}>
          {campaign.status}
        </span>
      )
    },
    {
      title: 'Start Date',
      field: 'start_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (campaign) => formatDate(campaign.start_date)
    },
    {
      title: 'End Date',
      field: 'end_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (campaign) => formatDate(campaign.end_date)
    },
    {
      title: 'Budget',
      field: 'budget',
      className: 'o-table-column--budget',
      cellClassName: 'o-table-cell--budget',
      render: (campaign) => `$${campaign.budget}`
    },
    {
      title: 'Actions',
      render: (campaign) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Campaign"
            onClick={() => openEditModal(campaign)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="View Campaign"
            as={Link}
            to={`/marketing/campaigns/${campaign.id}`}
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
    <div className="o-page o-page--campaigns">
      <header className="o-page__header">
        <h1>Marketing Campaigns</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={() => openAddModal()}
          >
            Create Campaign
          </Button>
        </div>
      </header>

      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search campaigns..."
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
            <p>Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load campaigns. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-bullhorn"></i>
            <p>No campaigns found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={campaigns || []}
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

  function openEditModal(campaign) {
    // Implementation would go here
    console.log('Opening edit modal for', campaign.name);
  }
};

export default Campaigns;
