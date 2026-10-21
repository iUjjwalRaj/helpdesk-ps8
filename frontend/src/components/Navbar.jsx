import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🎫</span>
          <span className="logo-text">HelpDesk <strong>PS8</strong></span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <NavLink to="/tickets" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                    My Tickets
                  </NavLink>
                  <NavLink to="/tickets/new" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                    + New Ticket
                  </NavLink>
                </>
              )}

              {user.role === 'support' && (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/admin/tickets" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                    All Tickets
                  </NavLink>
                  <NavLink to="/admin/departments" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                    Departments
                  </NavLink>
                </>
              )}

              <div className="nav-user-section">
                <span className="user-badge">
                  {user.name} <small>({user.role})</small>
                </span>
                <button onClick={handleLogout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Login
              </NavLink>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
