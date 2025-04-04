import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    date_range: '',
    payment_method: ''
  });
  const [categories, setCategories] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category_id: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().substring(0, 10),
    status: 'completed'
  });
  
  // Fetch expenses with pagination
  const {
    data: expenses,
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
    (params) => apiService.get('/finance/expenses/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch categories for filter options
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.get('/finance/expense-categories/');
        setCategories(response.data.results || response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load expense categories');
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
      category: '',
      date_range: '',
      payment_method: ''
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
  
  // Open form modal to add new expense
  const openAddModal = () => {
    setFormMode('add');
    setFormData({
      title: '',
      description: '',
      amount: '',
      category_id: '',
      payment_method: 'cash',
      payment_date: new Date().toISOString().substring(0, 10),
      status: 'completed'
    });
    setIsFormModalOpen(true);
  };
  
  // Open form modal to edit existing expense
  const openEditModal = (expense) => {
    setFormMode('edit');
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount,
      category_id: expense.category?.id || '',
      payment_method: expense.payment_method,
      payment_date: expense.payment_date,
      status: expense.status
    });
    setIsFormModalOpen(true);
  };
  
  // Open delete confirmation modal
  const openDeleteModal = (expense) => {
    setSelectedExpense(expense);
    setIsDeleteModalOpen(true);
  };
  
  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      if (formMode === 'add') {
        await apiService.post('/finance/expenses/', formData);
        toast.success('Expense added successfully');
      } else {
        await apiService.put(`/finance/expenses/${selectedExpense.id}/`, formData);
        toast.success('Expense updated successfully');
      }
      
      setIsFormModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Failed to save expense');
    }
  };
  
  // Handle expense deletion
  const handleDelete = async () => {
    try {
      await apiService.delete(`/finance/expenses/${selectedExpense.id}/`);
      toast.success('Expense deleted successfully');
      setIsDeleteModalOpen(false);
      reload();
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
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
    { value: 'cheque', label: 'Cheque' }
  ];
  
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
      field: 'category.name',
      className: 'o-table-column--category',
      cellClassName: 'o-table-cell--category'
    },
    {
      title: 'Amount',
      field: 'amount',
      className: 'o-table-column--amount',
      cellClassName: 'o-table-cell--amount',
      render: (expense) => formatCurrency(expense.amount)
    },
    {
      title: 'Payment Date',
      field: 'payment_date',
      className: 'o-table-column--date',
      cellClassName: 'o-table-cell--date',
      render: (expense) => formatDate(expense.payment_date)
    },
    {
      title: 'Method',
      field: 'payment_method',
      className: 'o-table-column--method',
      cellClassName: 'o-table-cell--method',
      render: (expense) => {
        const method = paymentMethods.find(m => m.value === expense.payment_method);
        return method?.label || expense.payment_method;
      }
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (expense) => (
        <span className={`o-tag o-tag--${expense.status.toLowerCase()}`}>
          {expense.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (expense) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="Edit Expense"
            onClick={() => openEditModal(expense)}
          >
            <i className="fa fa-edit"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Delete Expense"
            onClick={() => openDeleteModal(expense)}
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
    <div className="o-page o-page--expenses">
      <header className="o-page__header">
        <h1>Expense Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            onClick={openAddModal}
          >
            Add Expense
          </Button>
        </div>
      </header>
      
      <Card variant="default">
        <div className="o-list-controls">
          <div className="o-search-box">
            <i className="fa fa-search"></i>
            <input
              type="text"
              placeholder="Search expenses..."
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
            <p>Loading expenses...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load expenses. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : expenses.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-dollar-sign"></i>
            <p>No expenses found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={expenses}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} expenses
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
        title="Filter Expenses"
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
      
      {/* Add/Edit Expense Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={formMode === 'add' ? 'Add Expense' : 'Edit Expense'}
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
              placeholder="Enter expense title"
              required
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="category_id" className="o-form-label">Category</label>
            <select
              id="category_id"
              name="category_id"
              className="o-form-control"
              value={formData.category_id}
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
              placeholder="Enter expense description"
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
              <label htmlFor="payment_date" className="o-form-label">Date</label>
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
              >
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Expense"
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
            Are you sure you want to delete this expense: <strong>{selectedExpense?.title}</strong>?
            This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;
