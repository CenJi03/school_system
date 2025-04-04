import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const Reports = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Financial metrics summary
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstandingPayments: 0,
    enrollmentRevenue: 0,
    revenueByMonth: []
  });
  
  // Fetch report data based on filters
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      try {
        const response = await apiService.get(`/finance/reports/${reportType}/`, { 
          params: { 
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
          } 
        });
        
        setReportData(response.data);
        setSummary({
          totalRevenue: response.data.total_revenue || 0,
          totalExpenses: response.data.total_expenses || 0,
          netProfit: response.data.net_profit || 0,
          outstandingPayments: response.data.outstanding_payments || 0,
          enrollmentRevenue: response.data.enrollment_revenue || 0,
          revenueByMonth: response.data.revenue_by_month || []
        });
      } catch (error) {
        console.error('Error fetching report data:', error);
        toast.error('Failed to load financial reports');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [reportType, dateRange]);
  
  // Handle date range filter changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };
  
  // Handle report type change
  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };
  
  // Apply filters
  const applyFilters = () => {
    setIsFilterModalOpen(false);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Export report data
  const exportReport = async (format = 'xlsx') => {
    try {
      await apiService.download(`/finance/reports/${reportType}/export/`, 
        `financial_report_${reportType}_${dateRange.startDate}_${dateRange.endDate}.${format}`,
        { 
          params: { 
            start_date: dateRange.startDate,
            end_date: dateRange.endDate,
            format
          } 
        }
      );
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="o-page o-page--reports">
      <header className="o-page__header">
        <h1>Financial Reports</h1>
        <div className="o-page__actions">
          <div className="o-dropdown">
            <Button 
              variant="secondary"
              icon={<i className="fa fa-download"></i>}
            >
              Export Report
            </Button>
            <div className="o-dropdown__menu">
              <button onClick={() => exportReport('xlsx')}>
                <i className="fa fa-file-excel"></i> Export as Excel
              </button>
              <button onClick={() => exportReport('pdf')}>
                <i className="fa fa-file-pdf"></i> Export as PDF
              </button>
              <button onClick={() => exportReport('csv')}>
                <i className="fa fa-file-csv"></i> Export as CSV
              </button>
            </div>
          </div>
          
          <Button 
            variant="light"
            icon={<i className="fa fa-filter"></i>}
            onClick={() => setIsFilterModalOpen(true)}
          >
            Filters
          </Button>
        </div>
      </header>
      
      {/* Report Type Selector */}
      <div className="o-report-type-selector">
        <Button 
          variant={reportType === 'summary' ? 'primary' : 'light'}
          onClick={() => setReportType('summary')}
        >
          Summary
        </Button>
        <Button 
          variant={reportType === 'revenue' ? 'primary' : 'light'}
          onClick={() => setReportType('revenue')}
        >
          Revenue
        </Button>
        <Button 
          variant={reportType === 'expenses' ? 'primary' : 'light'}
          onClick={() => setReportType('expenses')}
        >
          Expenses
        </Button>
        <Button 
          variant={reportType === 'enrollment' ? 'primary' : 'light'}
          onClick={() => setReportType('enrollment')}
        >
          Enrollment
        </Button>
      </div>
      
      {/* Date Range Display */}
      <div className="o-date-range-display">
        <span>
          <i className="fa fa-calendar"></i> 
          {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
        </span>
      </div>
      
      {loading ? (
        <div className="o-loading-container">
          <div className="o-loading__spinner"></div>
          <p>Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <div className="o-financial-summary">
            <Card variant="shadowed" className="o-financial-card">
              <div className="o-financial-card__icon">
                <i className="fa fa-dollar-sign"></i>
              </div>
              <div className="o-financial-card__content">
                <h3 className="o-financial-card__title">Total Revenue</h3>
                <div className="o-financial-card__value">{formatCurrency(summary.totalRevenue)}</div>
                <Link to="/finance/payments" className="o-financial-card__link">
                  View Details
                </Link>
              </div>
            </Card>
            
            <Card variant="shadowed" className="o-financial-card">
              <div className="o-financial-card__icon">
                <i className="fa fa-receipt"></i>
              </div>
              <div className="o-financial-card__content">
                <h3 className="o-financial-card__title">Total Expenses</h3>
                <div className="o-financial-card__value">{formatCurrency(summary.totalExpenses)}</div>
                <Link to="/finance/expenses" className="o-financial-card__link">
                  View Details
                </Link>
              </div>
            </Card>
            
            <Card variant="shadowed" className="o-financial-card">
              <div className="o-financial-card__icon">
                <i className="fa fa-chart-line"></i>
              </div>
              <div className="o-financial-card__content">
                <h3 className="o-financial-card__title">Net Profit</h3>
                <div className="o-financial-card__value">{formatCurrency(summary.netProfit)}</div>
              </div>
            </Card>
            
            <Card variant="shadowed" className="o-financial-card">
              <div className="o-financial-card__icon">
                <i className="fa fa-exclamation-circle"></i>
              </div>
              <div className="o-financial-card__content">
                <h3 className="o-financial-card__title">Outstanding Payments</h3>
                <div className="o-financial-card__value">{formatCurrency(summary.outstandingPayments)}</div>
                <Link to="/finance/payments?status=pending" className="o-financial-card__link">
                  View Details
                </Link>
              </div>
            </Card>
          </div>
          
          {/* Report Content */}
          <div className="o-report-content">
            {reportType === 'summary' && (
              <Card 
                variant="default" 
                title="Financial Overview" 
                className="o-report-card"
              >
                <div className="o-report-section">
                  <h4>Revenue Breakdown</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Revenue Source</th>
                          <th>Amount</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Course Enrollment</td>
                          <td>{formatCurrency(summary.enrollmentRevenue)}</td>
                          <td>
                            {summary.totalRevenue ? ((summary.enrollmentRevenue / summary.totalRevenue) * 100).toFixed(2) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td>Learning Materials</td>
                          <td>{formatCurrency(reportData?.learning_materials_revenue || 0)}</td>
                          <td>
                            {summary.totalRevenue ? (((reportData?.learning_materials_revenue || 0) / summary.totalRevenue) * 100).toFixed(2) : 0}%
                          </td>
                        </tr>
                        <tr>
                          <td>Other Services</td>
                          <td>{formatCurrency(reportData?.other_services_revenue || 0)}</td>
                          <td>
                            {summary.totalRevenue ? (((reportData?.other_services_revenue || 0) / summary.totalRevenue) * 100).toFixed(2) : 0}%
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr>
                          <th>Total</th>
                          <th>{formatCurrency(summary.totalRevenue)}</th>
                          <th>100%</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                <div className="o-report-section">
                  <h4>Monthly Revenue Trend</h4>
                  <div className="o-chart-container">
                    {/* Chart would be rendered here in a real app */}
                    <div className="o-chart-placeholder">
                      <i className="fa fa-chart-bar"></i>
                      <p>Chart visualization would appear here</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {reportType === 'revenue' && (
              <Card 
                variant="default" 
                title="Revenue Analysis" 
                className="o-report-card"
              >
                <div className="o-report-section">
                  <h4>Revenue by Payment Method</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Payment Method</th>
                          <th>Amount</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.revenue_by_payment_method?.map((item) => (
                          <tr key={item.method}>
                            <td>{item.method}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.percentage}%</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="3" className="o-table-cell--empty">No data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="o-report-section">
                  <h4>Revenue by Course Level</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Course Level</th>
                          <th>Amount</th>
                          <th>Students</th>
                          <th>Avg. per Student</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.revenue_by_level?.map((item) => (
                          <tr key={item.level}>
                            <td>{item.level}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.student_count}</td>
                            <td>{formatCurrency(item.amount / (item.student_count || 1))}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="4" className="o-table-cell--empty">No data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
            
            {reportType === 'expenses' && (
              <Card 
                variant="default" 
                title="Expense Analysis" 
                className="o-report-card"
              >
                <div className="o-report-section">
                  <h4>Expenses by Category</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Amount</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.expenses_by_category?.map((item) => (
                          <tr key={item.category}>
                            <td>{item.category}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{item.percentage}%</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="3" className="o-table-cell--empty">No data available</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th>Total</th>
                          <th>{formatCurrency(summary.totalExpenses)}</th>
                          <th>100%</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
                
                <div className="o-report-section">
                  <h4>Monthly Expense Trend</h4>
                  <div className="o-chart-container">
                    {/* Chart would be rendered here in a real app */}
                    <div className="o-chart-placeholder">
                      <i className="fa fa-chart-line"></i>
                      <p>Chart visualization would appear here</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {reportType === 'enrollment' && (
              <Card 
                variant="default" 
                title="Enrollment Financial Analysis" 
                className="o-report-card"
              >
                <div className="o-report-section">
                  <h4>Revenue by Course</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Course Name</th>
                          <th>Enrolled Students</th>
                          <th>Revenue</th>
                          <th>Avg. per Student</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.revenue_by_course?.map((item) => (
                          <tr key={item.course_id}>
                            <td>{item.course_name}</td>
                            <td>{item.student_count}</td>
                            <td>{formatCurrency(item.revenue)}</td>
                            <td>{formatCurrency(item.revenue / item.student_count)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="4" className="o-table-cell--empty">No data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="o-report-section">
                  <h4>Enrollment Trends</h4>
                  <div className="o-table-responsive">
                    <table className="o-table">
                      <thead>
                        <tr>
                          <th>Month</th>
                          <th>New Enrollments</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData?.enrollment_by_month?.map((item) => (
                          <tr key={item.month}>
                            <td>{item.month}</td>
                            <td>{item.enrollment_count}</td>
                            <td>{formatCurrency(item.revenue)}</td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan="3" className="o-table-cell--empty">No data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
      
      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filter Report"
        footer={
          <>
            <Button 
              variant="primary" 
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </>
        }
      >
        <div className="o-filter-form">
          <div className="o-form-group">
            <label htmlFor="startDate" className="o-form-label">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              className="o-form-control"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="endDate" className="o-form-label">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              className="o-form-control"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          
          <div className="o-form-group">
            <label htmlFor="reportType" className="o-form-label">Report Type</label>
            <select
              id="reportType"
              name="reportType"
              className="o-form-control"
              value={reportType}
              onChange={handleReportTypeChange}
            >
              <option value="summary">Summary Report</option>
              <option value="revenue">Revenue Report</option>
              <option value="expenses">Expense Report</option>
              <option value="enrollment">Enrollment Report</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reports;
