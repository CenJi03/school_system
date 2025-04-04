import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    leadMetrics: {
      totalLeads: 0,
      conversionRate: 0,
      averageResponseTime: 0,
      leadsBySource: []
    },
    campaignMetrics: {
      totalCampaigns: 0,
      activeProspects: 0,
      conversionRate: 0,
      roi: 0,
      campaignPerformance: []
    },
    enrollmentTrends: {
      monthlyCounts: [],
      coursePopularity: []
    }
  });

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      try {
        const response = await apiService.get('/marketing/analytics/', {
          params: {
            start_date: dateRange.startDate,
            end_date: dateRange.endDate
          }
        });
        setAnalyticsData(response.data);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  // Handle date range changes
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="o-page o-page--analytics">
      <header className="o-page__header">
        <h1>Marketing Analytics</h1>
        <div className="o-page__actions">
          <div className="o-date-range-picker">
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="o-date-input"
            />
            <span className="o-date-separator">to</span>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="o-date-input"
            />
          </div>
          <Button 
            variant="secondary"
            icon={<i className="fa fa-download"></i>}
            onClick={() => console.log('Download report')}
          >
            Export Report
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="o-loading-container">
          <div className="o-loading__spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          {/* Lead Metrics Summary */}
          <div className="o-analytics-section">
            <h2 className="o-section-title">Lead Metrics</h2>
            <div className="o-stat-cards">
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-users"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">Total Leads</h3>
                  <div className="o-stat-card__value">{analyticsData.leadMetrics.totalLeads}</div>
                </div>
              </Card>
              
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-exchange-alt"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">Conversion Rate</h3>
                  <div className="o-stat-card__value">{formatPercentage(analyticsData.leadMetrics.conversionRate)}</div>
                </div>
              </Card>
              
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-clock"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">Avg. Response Time</h3>
                  <div className="o-stat-card__value">{analyticsData.leadMetrics.averageResponseTime} hrs</div>
                </div>
              </Card>
            </div>

            <Card variant="default">
              <h3 className="o-card-title">Leads by Source</h3>
              <div className="o-chart-placeholder">
                <p>Chart visualization would appear here</p>
                <p className="o-chart-note">Showing lead distribution across different marketing channels</p>
              </div>
            </Card>
          </div>

          {/* Campaign Metrics */}
          <div className="o-analytics-section">
            <h2 className="o-section-title">Campaign Performance</h2>
            <div className="o-stat-cards">
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-bullhorn"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">Active Campaigns</h3>
                  <div className="o-stat-card__value">{analyticsData.campaignMetrics.totalCampaigns}</div>
                </div>
              </Card>
              
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-user-plus"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">Active Prospects</h3>
                  <div className="o-stat-card__value">{analyticsData.campaignMetrics.activeProspects}</div>
                </div>
              </Card>
              
              <Card variant="shadowed" className="o-stat-card">
                <div className="o-stat-card__icon">
                  <i className="fa fa-dollar-sign"></i>
                </div>
                <div className="o-stat-card__content">
                  <h3 className="o-stat-card__title">ROI</h3>
                  <div className="o-stat-card__value">{formatPercentage(analyticsData.campaignMetrics.roi)}</div>
                </div>
              </Card>
            </div>

            <Card variant="default">
              <h3 className="o-card-title">Campaign Performance</h3>
              <div className="o-chart-placeholder">
                <p>Chart visualization would appear here</p>
                <p className="o-chart-note">Comparing performance metrics across different campaigns</p>
              </div>
            </Card>
          </div>

          {/* Enrollment Trends */}
          <div className="o-analytics-section">
            <h2 className="o-section-title">Enrollment Trends</h2>
            <Card variant="default">
              <h3 className="o-card-title">Monthly Enrollment</h3>
              <div className="o-chart-placeholder">
                <p>Chart visualization would appear here</p>
                <p className="o-chart-note">Showing enrollment trends over time</p>
              </div>
            </Card>

            <Card variant="default">
              <h3 className="o-card-title">Course Popularity</h3>
              <div className="o-chart-placeholder">
                <p>Chart visualization would appear here</p>
                <p className="o-chart-note">Showing most popular courses by enrollment</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
