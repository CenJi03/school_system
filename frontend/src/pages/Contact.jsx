import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { CONSTANTS } from '../config';
import toast from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [sending, setSending] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      setSending(false);
    }, 1000);
  };
  
  return (
    <div className="o-page o-page--contact">
      <header className="o-page__header">
        <h1>Contact Us</h1>
      </header>

      <div className="o-contact-layout">
        <Card variant="default">
          <form onSubmit={handleSubmit} className="o-form">
            <div className="o-form-group">
              <label htmlFor="name" className="o-form-label">Your Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="o-form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="email" className="o-form-label">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                className="o-form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="subject" className="o-form-label">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                className="o-form-control"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="o-form-group">
              <label htmlFor="message" className="o-form-label">Message</label>
              <textarea
                id="message"
                name="message"
                className="o-form-control"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>
            
            <Button 
              type="submit"
              variant="primary"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </Button>
          </form>
        </Card>
        
        <Card variant="default" className="o-contact-info">
          <h2>Contact Information</h2>
          <div className="o-contact-details">
            <div className="o-contact-item">
              <i className="fa fa-map-marker-alt"></i>
              <span>{CONSTANTS.SCHOOL_ADDRESS}</span>
            </div>
            
            <div className="o-contact-item">
              <i className="fa fa-phone"></i>
              <span>{CONSTANTS.SCHOOL_PHONE || '+1 (555) 123-4567'}</span>
            </div>
            
            <div className="o-contact-item">
              <i className="fa fa-envelope"></i>
              <span>{CONSTANTS.SUPPORT_EMAIL || 'support@languageschool.com'}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Contact;