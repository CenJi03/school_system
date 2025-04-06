import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const CoursesInfo = () => {
  // Sample course data
  const courses = [
    {
      id: 1,
      title: 'English for Beginners',
      description: 'Learn the fundamentals of English with our beginner-friendly course.',
      level: 'Beginner',
      duration: '12 weeks',
      image: '/assets/images/courses/english.jpg'
    },
    {
      id: 2,
      title: 'Intermediate Spanish',
      description: 'Take your Spanish to the next level with our intermediate course focusing on conversation.',
      level: 'Intermediate',
      duration: '16 weeks',
      image: '/assets/images/courses/spanish.jpg'
    },
    {
      id: 3,
      title: 'French Language and Culture',
      description: 'Immerse yourself in French language and culture with our comprehensive course.',
      level: 'All Levels',
      duration: '10 weeks',
      image: '/assets/images/courses/french.jpg'
    }
  ];
  
  return (
    <div className="o-page o-page--courses-info">
      <header className="o-page__header">
        <h1>Our Language Courses</h1>
        <div className="o-page__actions">
          <Button 
            variant="primary" 
            as={Link}
            to="/register"
          >
            Register Now
          </Button>
        </div>
      </header>

      <div className="o-courses-intro">
        <Card variant="default">
          <h2>Explore Our Language Programs</h2>
          <p>
            Our school offers a variety of language courses designed to meet the needs of different learners.
            Whether you're a beginner just starting your language journey or an advanced learner looking to
            perfect your skills, we have the right course for you.
          </p>
          <p>
            All courses include access to our online learning platform, weekly conversation practice,
            and cultural workshops to enhance your learning experience.
          </p>
        </Card>
      </div>

      <div className="o-courses-list">
        {courses.map(course => (
          <Card key={course.id} variant="shadowed" className="o-course-card">
            <div className="o-course-image">
              <div className="o-course-image-placeholder">
                <i className="fa fa-book-open"></i>
              </div>
            </div>
            <div className="o-course-content">
              <h3 className="o-course-title">{course.title}</h3>
              <div className="o-course-meta">
                <span className="o-course-level">
                  <i className="fa fa-signal"></i> {course.level}
                </span>
                <span className="o-course-duration">
                  <i className="fa fa-calendar"></i> {course.duration}
                </span>
              </div>
              <p className="o-course-description">{course.description}</p>
              <Button 
                variant="secondary" 
                as={Link}
                to="/login"
                className="o-course-button"
              >
                Learn More
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CoursesInfo;