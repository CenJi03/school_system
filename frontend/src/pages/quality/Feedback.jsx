import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Feedback = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    date_range: ''
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  
  // Fetch feedback with pagination
  const {
    data: feedbackItems,
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
    (params) => apiService.get('/quality/feedback/', { params }),
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
      type: '',
      status: '',
      date_range: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Open view modal
  const openViewModal = (feedback) => {
    setSelectedFeedback(feedback);
    setIsViewModalOpen(true);
  };
  
  // Open response modal
  const openResponseModal = (feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response || '');
    setIsResponseModalOpen(true);
  };
  
  // Handle response submission
  const handleResponseSubmit = async () => {
    try {
      await apiService.put(`/quality/feedback/${selectedFeedback.id}/respond/`, {
        response: responseText,
        status: 'responded'
      });
      
      toast.success('Response submitted successfully');
      setIsResponseModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Failed to submit response');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  // Table columns
  const columns = [
    {
      title: 'Submitted By',
      field: 'submitter.name',
      className: 'o-table-column--name',
      cellClassName: 'o-table-cell--name'
    },
    {
      title: 'Type',
      field: 'type',
      className: 'o-table-column--type',
      cellClassName: 'o-table-cell--type',
      render: (feedback) => (
        <span className={`o-tag o-tag--${feedback.type.toLowerCase()}`}>
          {feedback.type}
        </span>
      )
    },
    {
      title: 'Subject',
      field: 'subject',
      className: 'o-table-column--subject',
      cellClassName: 'o-table-cell--subject'
    },
    {
      title: 'Date',
      field: 'submitted_at',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (feedback) => formatDate(feedback.submitted_at)
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (feedback) => (
        <span className={`o-tag o-tag--${feedback.status.toLowerCase()}`}>
          {feedback.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (feedback) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="View Feedback"
            onClick={() => openViewModal(feedback)}
          >
            <i className="fa fa-eye"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Respond"
            onClick={() => openResponseModal(feedback)}
            disabled={feedback.status === 'responded'}
          >
            <i className="fa fa-reply"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--feedback">
      <header className="o-page__header">
        <h1>Feedback Management</h1>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search feedback..."
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
            <p>Loading feedback...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load feedback. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : feedbackItems.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-comment"></i>
            <p>No feedback found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={feedbackItems}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} feedback items
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
        title="Filter Feedback"
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
              <option value="suggestion">Suggestion</option>
              <option value="complaint">Complaint</option>
              <option value="praise">Praise</option>
              <option value="question">Question</option>
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
              <option value="in_progress">In Progress</option>
              <option value="responded">Responded</option>
              <option value="resolved">Resolved</option>
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
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* View Feedback Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Feedback Details"
        footer={
          <Button variant="primary" onClick={() => setIsViewModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedFeedback && (
          <div className="o-feedback-detail">
            <div className="o-feedback-detail__header">
              <div className="o-feedback-detail__submitter">
                <strong>From:</strong> {selectedFeedback.submitter?.name || 'Anonymous'}
              </div>
              <div className="o-feedback-detail__meta">
                <span className={`o-tag o-tag--${selectedFeedback.type?.toLowerCase()}`}>
                  {selectedFeedback.type}
                </span>
                <span><strong>Date:</strong> {formatDate(selectedFeedback.submitted_at)}</span>
              </div>
            </div>
            
            <div className="o-feedback-detail__subject">
              <h3>{selectedFeedback.subject}</h3>
            </div>
            
            <div className="o-feedback-detail__content">
              <p>{selectedFeedback.content}</p>
            </div>
            
            {selectedFeedback.response && (
              <div className="o-feedback-detail__response">
                <h4>Response</h4>
                <div className="o-feedback-detail__response-box">
                  <p>{selectedFeedback.response}</p>
                  <div className="o-feedback-detail__response-meta">
                    <span>Responded by: {selectedFeedback.responder?.name}</span>
                    <span>Date: {formatDate(selectedFeedback.responded_at)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {selectedFeedback.status !== 'responded' && (
              <div className="o-feedback-detail__actions">
                <Button 
                  variant="primary"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    openResponseModal(selectedFeedback);
                  }}
                >
                  Respond
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* Response Modal */}
      <Modal
        isOpen={isResponseModalOpen}
        onClose={() => setIsResponseModalOpen(false)}
        title="Respond to Feedback"
        footer={
          <>
            <Button variant="light" onClick={() => setIsResponseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleResponseSubmit}>
              Submit Response
            </Button>
          </>
        }
      >
        {selectedFeedback && (
          <div className="o-response-form">
            <div className="o-response-form__original">
              <h4>Original Feedback</h4>
              <div className="o-response-form__feedback-box">
                <h5>{selectedFeedback.subject}</h5>
                <p>{selectedFeedback.content}</p>
              </div>
            </div>
            
            <div className="o-form-group">
              <label htmlFor="response" className="o-form-label">Your Response</label>
              <textarea
                id="response"
                name="response"
                className="o-form-control"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                placeholder="Type your response here..."
                required
              ></textarea>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Feedback;
