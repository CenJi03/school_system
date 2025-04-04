import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    student: '',
    fee: '',
    payment_method: '',
    status: '',
    date_range: ''
  });
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    student_id: '',
    fee_id: '',
    payment_method: 'cash',
    amount: '',
    payment_date: new Date().toISOString().substring(0, 10),
    notes: '',
    status: 'completed'
  });
  
  // Fetch payments with pagination
  const {
    data: payments,
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
    (params) => apiService.get('/finance/payments/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch students and fees for filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [studentsResponse, feesResponse] = await Promise.all([
          apiService.get('/students/', { params: { status: 'active', limit: 100 } }),
          apiService.get('/finance/fees/', { params: { limit: 100 } })
        ]);
        setStudents(studentsResponse.data.results || studentsResponse.data);
        setFees(feesResponse.data.results || feesResponse.data);
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
      student: '',
      fee: '',
      payment_method: '',
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
    
    // If fee is selected, auto-fill amount
    if (name === 'fee_id' && value) {
      const selectedFee = fees.find(fee => fee.id === value);
      if (selectedFee) {
        setFormData(prev => ({
          ...prev,
          amount: selectedFee.amount
        }));
      }
    }
  };
  
  // Open form modal to add new payment
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      student_id: '',
      fee_id: '',
      payment_method: 'cash',
      amount: '',
      payment_date: new Date().toISOString().substring(0, 10),
      notes: '',
      status: 'completed'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing payment
  const openEditModal = (payment) => {
    setFormMode('edit');
    setSelectedPayment(payment);
    setFormData({
      student_id: payment.student.id,
      fee_id: payment.fee?.id || '',
      payment_method: payment.payment_method,
      amount: payment.amount,
      payment_date: payment.payment_date,
      notes: payment.notes || '',
      status: payment.status
    });
    setIsFormModalOpen(true);
  };
  
  // Open receipt modal
  const openReceiptModal = (payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/finance/payments/', formData);
        toast.success('Payment recorded successfully');
      } else {
        await apiService.put(`/finance/payments/${selectedPayment.id}/`, formData);
        toast.success('Payment updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving payment:', error);
      toast.error('Failed to save payment');
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
  
  // Payment methods
  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online', label: 'Online Payment' }
  ];
  
  // Payment statuses
  const paymentStatuses = [
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];
  
  // Table columns
  const columns = [
    {
      title: 'Receipt #',
      field: 'receipt_number',
      className: 'o-table-column--id',
      cellClassName: 'o-table-cell--id'
    },
    {
      title: 'Student',
      field: 'student.name',
      className: 'o-table-column--student',
      cellClassName: 'o-table-cell--student'
    },
    {
      title: 'Description',
      field: 'description',
      className: 'o-table-column--description',
      cellClassName: 'o-table-cell--description',
      render: (payment) => payment.fee?.name || 'Manual payment'
    },
    {
      title: 'Amount',
      field: 'amount',
      className: 'o-table-column--amount',
      cellClassName: 'o-table-cell--amount',
      render: (payment) => formatCurrency(payment.amount)
    },
    {
      title: 'Payment Date',
      field: 'payment_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (payment) => formatDate(payment.payment_date)
    },
    {
      title: 'Method',
      field: 'payment_method',
      className: 'o-table-column--method',
      cellClassName: 'o-table-cell--method',
      render: (payment) => {
        const method = paymentMethods.find(m => m.value === payment.payment_method);
        return method?.label || payment.payment_method;
      }
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (payment) => (
        <span className={`o-tag o-tag--${payment.status.toLowerCase()}`}>
          {payment.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (payment) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Payment"
            onClick={() => openEditModal(payment)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="View Receipt"
            onClick={() => openReceiptModal(payment)}
          >
            <i className="fa fa-receipt"></i>
          </Button>
        </div>
      ),
      className: 'o-table-column--actions',
      cellClassName: 'o-table-cell--actions'
    }
  ];

  return (
    <div className="o-page o-page--payments">
      <header className="o-page__header">
        <h1>Payment Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Record Payment
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search payments..."
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
            <p>Loading payments...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load payments. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-receipt"></i>
            <p>No payments found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={payments}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} payments
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
        title="Filter Payments"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
          <div className="o-form-group">
            <label htmlFor="student" className="o-form-label">Student</label>
            <select
              id="student"
              name="student"
              className="o-form-control"
              value={filters.student}
              onChange={handleFilterChange}
            >
              <option value="">All Students</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="fee" className="o-form-label">Fee Type</label>
            <select
              id="fee"
              name="fee"
              className="o-form-control"
              value={filters.fee}
              onChange={handleFilterChange}
            >
              <option value="">All Fees</option>
              {fees.map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="payment_method" className="o-form-label">Payment Method</label>
            <select
              id="payment_method"
              name="payment_method"
              className="o-form-control"
              value={filters.payment_method}
              onChange={handleFilterChange}
            >
              <option value="">All Methods</option>
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
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
              {paymentStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
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
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
            </select>
          </div>
        </div>
      </Modal>
      
      {/* Add/Edit Payment Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Record Payment' : 'Edit Payment'}
        footer={
          <>
            <Button variant="light" onClick={() => setIsFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleFormSubmit}>
              {formMode === 'add' ? 'Save Payment' : 'Update Payment'}
            </Button>
          </>
        }
      >
        <div className="o-form">
          <div className="o-form-group">
            <label htmlFor="student_id" className="o-form-label">Student</label>
            <select
              id="student_id"
              name="student_id"
              className="o-form-control"
              value={formData.student_id}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="fee_id" className="o-form-label">Fee</label>
            <select
              id="fee_id"
              name="fee_id"
              className="o-form-control"
              value={formData.fee_id}
              onChange={handleFormChange}
            >
              <option value="">Select Fee (Optional)</option>
              {fees.filter(fee => 
                fee.status === 'pending' || 
                fee.status === 'overdue' || 
                (selectedPayment && selectedPayment.fee?.id === fee.id)
              ).map((fee) => (
                <option key={fee.id} value={fee.id}>
                  {fee.name} ({formatCurrency(fee.amount)})
                </option>
              ))}
            </select>
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
              <label htmlFor="payment_date" className="o-form-label">Payment Date</label>
              <input
                id="payment_date"
                name="payment_date"
                type="date"
                className="o-form-control"
                value={formData.payment_date}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>
          
          <div className="o-form-row">
            <div className="o-form-group">
              <label htmlFor="payment_method" className="o-form-label">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                className="o-form-control"
                value={formData.payment_method}
                onChange={handleFormChange}
                required
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
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
                value={formData.status}
                onChange={handleFormChange}
                required
              >
                {paymentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="notes" className="o-form-label">Notes</label>
            <textarea
              id="notes"
              name="notes"
              className="o-form-control"
              value={formData.notes}
              onChange={handleFormChange}
              rows={3}
              placeholder="Enter any additional notes"
            ></textarea>
          </div>
        </div>
      </Modal>
      
      {/* Payment Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Payment Receipt"
        footer={
          <>
            <Button variant="light" onClick={() => setIsReceiptModalOpen(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => window.print()}>
              <i className="fa fa-print"></i> Print Receipt
            </Button>
          </>
        }
      >
        {selectedPayment && (
          <div className="o-receipt">
            <div className="o-receipt__header">
              <h2>Receipt #{selectedPayment.receipt_number}</h2>
              <div className="o-receipt__date">
                Date: {formatDate(selectedPayment.payment_date)}
              </div>
            </div>
            
            <div className="o-receipt__details">
              <div className="o-receipt__item">
                <span>Student:</span> 
                <strong>{selectedPayment.student.name}</strong>
              </div>
              
              {selectedPayment.fee && (
                <div className="o-receipt__item">
                  <span>Fee:</span> 
                  <strong>{selectedPayment.fee.name}</strong>
                </div>
              )}
              
              <div className="o-receipt__item">
                <span>Payment Method:</span> 
                <strong>
                  {paymentMethods.find(m => m.value === selectedPayment.payment_method)?.label || 
                   selectedPayment.payment_method}
                </strong>
              </div>
              
              <div className="o-receipt__item">
                <span>Status:</span> 
                <span className={`o-tag o-tag--${selectedPayment.status.toLowerCase()}`}>
                  {selectedPayment.status}
                </span>
              </div>
              
              {selectedPayment.notes && (
                <div className="o-receipt__notes">
                  <span>Notes:</span>
                  <p>{selectedPayment.notes}</p>
                </div>
              )}
            </div>
            
            <div className="o-receipt__amount">
              <span>Amount Paid:</span>
              <h3>{formatCurrency(selectedPayment.amount)}</h3>
            </div>
            
            <div className="o-receipt__footer">
              <p>Thank you for your payment!</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Payments;
