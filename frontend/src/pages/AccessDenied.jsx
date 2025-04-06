import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/common/Card';

const AccessDenied = () => {
  return (
    <div className="o-page o-page--centered">
      <Card variant="default">
        <div className="o-access-denied">
          <i className="fa fa-lock o-access-denied__icon"></i>
          <h1>Access Denied</h1>
          <p>
            Your account doesn't have permission to access this feature.
            Only administrator-created accounts can access the system functionality.
          </p>
          <p>
            Please contact your system administrator if you require access.
          </p>
          <div className="o-access-denied__actions">
            <Link to="/" className="o-btn o-btn--primary">
              Go to Homepage
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AccessDenied;