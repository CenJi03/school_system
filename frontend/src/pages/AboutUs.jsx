import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';
import { CONSTANTS } from '../config';

const AboutUs = () => {
  return (
    <div className="o-page o-page--about-us">
      <header className="o-page__header">
        <h1>About Us</h1>
      </header>

      <Card variant="default">
        <div className="o-about-content">
          <h2>Welcome to {CONSTANTS.APP_NAME}</h2>
          <p>
            Founded in 2010, our language school has been dedicated to providing high-quality
            language education to students of all ages and backgrounds. Our mission is to empower
            individuals through language learning and cultural understanding.
          </p>
          
          <h3>Our Philosophy</h3>