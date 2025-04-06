import React from 'react';
import { Link } from 'react-router-dom';
import { CONSTANTS } from '../config';
import '../assets/styles/Home.css';

const Home = () => { 
  return (
    <div className="o-page o-page--home">
      <div className="o-home-hero">
        <div className="o-home-hero__content">
          <h1 className="o-home-hero__title">Welcome to {CONSTANTS.APP_NAME}</h1>
          <p className="o-home-hero__subtitle">
            Effective language learning management platform for students and educators
          </p>
          <div className="o-home-hero__actions">
            <Link to="/login" className="o-btn o-btn--primary o-btn--large">
              Log In
            </Link>
            <Link to="/register" className="o-btn o-btn--secondary o-btn--large">
              Register
            </Link>
          </div>
        </div>
      </div>
      
      <div className="o-home-features">
        <div className="o-home-feature">
          <i className="fa fa-book-open o-home-feature__icon"></i>
          <h3 className="o-home-feature__title">Comprehensive Curriculum</h3>
          <p className="o-home-feature__description">
            Access high-quality courses designed by language experts
          </p>
        </div>
        
        <div className="o-home-feature">
          <i className="fa fa-chart-line o-home-feature__icon"></i>
          <h3 className="o-home-feature__title">Track Your Progress</h3>
          <p className="o-home-feature__description">
            Monitor learning achievements with detailed analytics
          </p>
        </div>
        
        <div className="o-home-feature">
          <i className="fa fa-users o-home-feature__icon"></i>
          <h3 className="o-home-feature__title">Interactive Learning</h3>
          <p className="o-home-feature__description">
            Learn together with peers and receive instructor feedback
          </p>
        </div>
      </div>
      
      <footer className="o-home-footer">
        <div className="o-home-footer__content">
          <div className="o-home-footer__contact">
            <h3>Contact Us</h3>
            <p>
              <i className="fa fa-envelope"></i> {CONSTANTS.SUPPORT_EMAIL}
            </p>
            <p>
              <i className="fa fa-phone"></i> {CONSTANTS.SCHOOL_PHONE}
            </p>
            <p>
              <i className="fa fa-map-marker-alt"></i> {CONSTANTS.SCHOOL_ADDRESS}
            </p>
          </div>
          
          <div className="o-home-footer__links">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/courses/browse">Browse Courses</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="o-home-footer__copyright">
          &copy; {new Date().getFullYear()} {CONSTANTS.APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;