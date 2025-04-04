import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import apiService from '../../services/api';
import toast from 'react-hot-toast';

const StudentPayments = () => {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch payment data
  useEffect(() => {
    const fetchPaymentData = async () => {
      setLoading(true);
      try {
        // Get student payments
        const paymentsResponse = await apiService.get('/student/payments');
        setPayments(paymentsResponse.data);
        
        // Get student invoices
        const invoicesResponse = await apiService.get('/student/invoices');
        setInvoices(invoicesResponse.data);
      } catch (error) {
        console.error('Failed to load payment data:', error);
        toast.error('Failed to load payment information');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Open receipt modal
  const openReceiptModal = (payment) => {
    setSelectedPayment(payment);
    setIsReceiptModalOpen(true);
  };

  if (loading) {
    return (
      <div className="o-loading-container">
        <div className="o-loading__spinner"></div>
        <p>Loading payment information...</p>
      </div>
    );
  }

  return (
    <div className="o-page o-page--student-payments">
      <header className="o-page__header">
        <h1>Payments & Invoices</h1>
      </header>

      {/* Payment History */}
      <Card
        variant="default"
        title="Payment History"
        className="o-payment-history"
      >
        {payments.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id}>
                    <td>{payment.receipt_number}</td>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>{payment.description}</td>
                    <td>{formatCurrency(payment.amount)}</td>
                    <td>{payment.payment_method}</td>
                    <td>
                      <span className={`o-tag o-tag--${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="icon"
                        aria-label="View Receipt"
                        onClick={() => openReceiptModal(payment)}
                      >
                        <i className="fa fa-receipt"></i>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-receipt"></i>
            <p>No payment history found</p>
          </div>
        )}
      </Card>

      {/* Pending Invoices */}
      <Card
        variant="default"
        title="Pending Invoices"
        className="o-pending-invoices"
      >
        {invoices.length > 0 ? (
          <div className="o-table-responsive">
            <table className="o-table o-table--hover">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Due Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => (
                  <tr key={invoice.id}>
                    <td>{invoice.invoice_number}</td>
                    <td>{formatDate(invoice.due_date)}</td>
                    <td>{invoice.description}</td>
                    <td>{formatCurrency(invoice.amount)}</td>
                    <td>
                      <span className={`o-tag o-tag--${invoice.status.toLowerCase()}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="secondary"
                        size="small"
                        disabled={invoice.status !== 'pending'}
                      >
                        Pay Now
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="o-empty-state">
            <i className="fa fa-file-invoice-dollar"></i>
            <p>No pending invoices</p>
          </div>
        )}
      </Card>

      {/* Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        title="Payment Receipt"
        footer={
          <Button variant="secondary" onClick={() => setIsReceiptModalOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedPayment && (
          <div className="o-receipt">
            <div className="o-receipt__header">
              <div className="o-receipt__logo">
                <img src="/assets/images/logo.png" alt="School Logo" />
                <h2>Language School</h2>
              </div>
              <div className="o-receipt__details">
                <h3>Receipt #{selectedPayment.receipt_number}</h3>
                <p>Date: {formatDate(selectedPayment.payment_date)}</p>
              </div>
            </div>
            
            <div className="o-receipt__body">
              <div className="o-receipt__item">
                <span>Description:</span>
                <span>{selectedPayment.description}</span>
              </div>
              <div className="o-receipt__item">
                <span>Amount:</span>
                <span>{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="o-receipt__item">
                <span>Payment Method:</span>
                <span>{selectedPayment.payment_method}</span>
              </div>
              <div className="o-receipt__item">
                <span>Status:</span>
                <span className={`o-tag o-tag--${selectedPayment.status.toLowerCase()}`}>
                  {selectedPayment.status}
                </span>
              </div>
            </div>
            
            <div className="o-receipt__footer">
              <p>Thank you for your payment!</p>
              <Button 
                variant="primary" 
                onClick={() => window.print()}
              >
                <i className="fa fa-print"></i> Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentPayments;
