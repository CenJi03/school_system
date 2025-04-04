import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import usePagination from '../../hooks/usePagination';
import toast from 'react-hot-toast';

const StaffList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    department: ''
  });
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState([]);
  
  // Fetch staff data with pagination
  const {
    data: staff,
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
    (params) => apiService.get('/staff/', { params }),
    {
      search: searchTerm,
      ...filters
    }
  );
  
  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [rolesResponse, departmentsResponse] = await Promise.all([
          apiService.get('/staff/roles/'),
          apiService.get('/staff/departments/')
        ]);
        
        setRoles(rolesResponse.data);
        setDepartments(departmentsResponse.data);
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
      role: '',
      status: '',
      department: ''
    });
    setSearchTerm('');
    reload();
    setIsFilterModalOpen(false);
  };
  
  // Handle staff selection
  const handleStaffSelection = (staff) => {
    if (selectedStaff.some(s => s.id === staff.id)) {
      setSelectedStaff(selectedStaff.filter(s => s.id !== staff.id));
    } else {
      setSelectedStaff([...selectedStaff, staff]);
    }
  };
  
  // Toggle select all staff
  const toggleSelectAll = () => {
    if (selectedStaff.length === staff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff([...staff]);
    }
  };
  
  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedStaff.length === 0) {
      toast.error('No staff selected');
      return;
    }
    
    const staffIds = selectedStaff.map(staff => staff.id);
    
    try {
      await apiService.post(`/staff/bulk-actions/${action}/`, { staff_ids: staffIds });
      toast.success(`${action} operation successful for ${staffIds.length} staff members`);
      reload();
      setSelectedStaff([]);
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
          checked={staff.length > 0 && selectedStaff.length === staff.length}
          onChange={toggleSelectAll}
        />
      ),
      render: (staffMember) => (
        <input 
          type="checkbox" 
          checked={selectedStaff.some(s => s.id === staffMember.id)} 
          onChange={() => handleStaffSelection(staffMember)}
        />
      ),
      className: 'o-table-column--checkbox',
      cellClassName: 'o-table-cell--checkbox'
    },
    {
      title: 'ID',
      field: 'staff_id',
      className: 'o-table-column--id',
      cellClassName: 'o-table-cell--id'
    },
    {
      title: 'Name',
      render: (staffMember) => (
        <div className="o-staff-info">
          <div className="o-avatar o-avatar--small">
            {staffMember.name.charAt(0)}
          </div>
          <div className="o-staff-info__details">
            <div className="o-staff-info__name">
              <Link to={`/staff/${staffMember.id}`}>{staffMember.name}</Link>
            </div>
            <div className="o-staff-info__email">{staffMember.email}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Role',
      field: 'role',
      className: 'o-table-column--role',
      cellClassName: 'o-table-cell--role',
      render: (staffMember) => (
        <span className={`o-tag o-tag--${staffMember.role.toLowerCase()}`}>
          {staffMember.role}
        </span>
      )
    },
    {
      title: 'Department',
      field: 'department',
      className: 'o-table-column--department',
      cellClassName: 'o-table-cell--department'
    },
    {
      title: 'Status',
      field: 'status',
      className: 'o-table-column--status',
      cellClassName: 'o-table-cell--status',
      render: (staffMember) => (
        <span className={`o-tag o-tag--${staffMember.status.toLowerCase()}`}>
          {staffMember.status}
        </span>
      )
    },
    {
      title: 'Actions',
      render: (staffMember) => (
        <div className="o-table-actions">
          <Button 
            variant="icon" 
            aria-label="View Staff"
            as={Link}
            to={`/staff/${staffMember.id}`}
          >
            <i className="fa fa-eye"></i>
          </Button>
          <Button 
            variant="icon" 
            aria-label="Edit Staff"
            as={Link}
            to={`/staff/${staffMember.id}/edit`}
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
    <div className="o-page o-page--staff">
      <header className="o-page__header">
        <h1>Staff Management</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            icon={<i className="fa fa-plus"></i>}
            as={Link}
            to="/staff/new"
          >
            Add Staff Member
          </Button>
          <Button 
            variant="secondary"
            icon={<i className="fa fa-download"></i>}
            onClick={() => apiService.download('/staff/export/', 'staff.xlsx')}
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
              placeholder="Search staff..."
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
                disabled={selectedStaff.length === 0}
                onClick={() => handleBulkAction('activate')}
              >
                Activate
              </Button>
              <Button 
                variant="light"
                disabled={selectedStaff.length === 0}
                onClick={() => handleBulkAction('deactivate')}
              >
                Deactivate
              </Button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="o-loading-container">
            <div className="o-loading__spinner"></div>
            <p>Loading staff members...</p>
          </div>
        ) : error ? (
          <div className="o-error-message">
            <i className="fa fa-exclamation-triangle"></i>
            <p>Failed to load staff. Please try again.</p>
            <Button variant="primary" onClick={reload}>Retry</Button>
          </div>
        ) : staff.length === 0 ? (
          <div className="o-empty-state">
            <i className="fa fa-users"></i>
            <p>No staff members found</p>
            {(searchTerm || Object.values(filters).some(Boolean)) && (
              <Button variant="primary" onClick={resetFilters}>Clear Filters</Button>
            )}
          </div>
        ) : (
          <Table
            columns={columns}
            data={staff}
            keyField="id"
            hoverable
            striped
          />
        )}
        
        <div className="o-pagination">
          <div className="o-pagination__info">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} staff members
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
        title="Filter Staff"
        footer={
          <>
            <Button variant="light" onClick={resetFilters}>Reset</Button>
            <Button variant="primary" onClick={applyFilters}>Apply Filters</Button>
          </>
        }
      >
        <div className="o-filter-form">
          <div className="o-form-group">
            <label htmlFor="role" className="o-form-label">Role</label>
            <select
              id="role"
              name="role"
              className="o-form-control"
              value={filters.role}
              onChange={handleFilterChange}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="o-form-group">
            <label htmlFor="department" className="o-form-label">Department</label>
            <select
              id="department"
              name="department"
              className="o-form-control"
              value={filters.department}
              onChange={handleFilterChange}
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffList;
