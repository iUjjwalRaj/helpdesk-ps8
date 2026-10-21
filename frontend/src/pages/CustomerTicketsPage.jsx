import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ticketApi } from '../api/ticketApi';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

export const CustomerTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ticketApi.getTickets();
      setTickets(data);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDelete = async (id, ticketId, status) => {
    if (status !== 'Open') {
      alert('Tickets can only be deleted while status is Open.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ticket ${ticketId}?`)) {
      return;
    }

    try {
      await ticketApi.deleteTicket(id);
      setTickets(tickets.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete ticket');
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>My Helpdesk Tickets</h1>
          <p>Track your submitted support issues and ongoing resolutions</p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          + Submit New Ticket
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-card">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by Ticket ID, Title, or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Status Filter:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="table-loader">
          <div className="spinner"></div>
          <p>Loading your tickets...</p>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="empty-card">
          <div className="empty-icon">📂</div>
          <h3>No tickets found</h3>
          <p>You haven't submitted any tickets matching this criteria.</p>
          <Link to="/tickets/new" className="btn btn-secondary">
            Create Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => {
                const isOpen = t.status === 'Open';
                return (
                  <tr key={t._id}>
                    <td>
                      <Link to={`/tickets/${t._id}`} className="ticket-id-link">
                        {t.ticketId}
                      </Link>
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
                    <td className="actions-cell">
                      <Link to={`/tickets/${t._id}`} className="btn-action btn-view" title="View details and comments">
                        View
                      </Link>

                      {isOpen ? (
                        <>
                          <Link to={`/tickets/edit/${t._id}`} className="btn-action btn-edit" title="Edit ticket (Open only)">
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(t._id, t.ticketId, t.status)}
                            className="btn-action btn-delete"
                            title="Delete ticket (Open only)"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="badge-locked" title="Locked: Edits only permitted when Open">
                          Locked
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
