import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <div className="page-container text-center py-5">
      <div className="empty-card">
        <h1 className="notfound-code">404</h1>
        <h2>Page Not Found</h2>
        <p className="text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link to="/" className="btn btn-primary mt-3">
          Return to Home
        </Link>
      </div>
    </div>
  );
};
