import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketApi } from '../api/ticketApi';
import { departmentApi } from '../api/departmentApi';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

export const StaffTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ticketApi.getTickets({
        status: status || undefined,
        priority: priority || undefined,
        category: category || undefined,
        department: department || undefined,
      });
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentApi.getDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [status, priority, category, department]);

  const handleResetFilters = () => {
    setStatus('');
    setPriority('');
    setCategory('');
    setDepartment('');
    setSearchTerm('');
  };

  const filteredTickets = tickets.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(term) ||
      t.title.toLowerCase().includes(term) ||
      (t.customer?.name && t.customer.name.toLowerCase().includes(term)) ||
      (t.customer?.email && t.customer.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Support Ticket Management</h1>
          <p>Filter, assign departments, and track resolution workflows</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          📊 View Dashboard Metrics
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* PS8 Requirement 5: Filters for status, priority, category, department */}
      <div className="filter-card staff-filter-card">
        <div className="filter-grid">
          <div className="filter-item">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search ID, title, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label>Status:</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Priority:</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Category:</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Technical">Technical</option>
              <option value="Billing">Billing</option>
              <option value="Account">Account</option>
              <option value="Hardware">Hardware</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Department:</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions-row">
          <span>
            Showing <strong>{filteredTickets.length}</strong> tickets
          </span>
          <button onClick={handleResetFilters} className="btn-text">
            Reset Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <p>Filtering tickets from database...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">🔍</div>
          <h3>No matching tickets</h3>
          <p>No tickets found matching the selected filter criteria.</p>
          <button onClick={handleResetFilters} className="btn btn-secondary">
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t._id}>
                  <td>
                    <Link to={`/tickets/${t._id}`} className="ticket-id-link">
                      {t.ticketId}
                    </Link>
                  </td>
                  <td>
                    <div className="customer-cell">
                      <strong>{t.customer?.name || 'Unknown'}</strong>
                      <small className="text-muted">{t.customer?.email}</small>
                    </div>
                  </td>
                  <td className="ticket-title-cell">
                    <Link to={`/tickets/${t._id}`}>{t.title}</Link>
                  </td>
                  <td>{t.category}</td>
                  <td>
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td>{t.department ? t.department.name : <span className="text-muted">Unassigned</span>}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link to={`/tickets/${t._id}`} className="btn-action btn-manage">
                      Manage ➔
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
