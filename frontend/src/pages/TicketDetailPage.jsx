import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ticketApi } from '../api/ticketApi';
import { departmentApi } from '../api/departmentApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

export const TicketDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [newComment, setNewComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [assigningDept, setAssigningDept] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isSupport = user?.role === 'support';

  const loadTicketData = async () => {
    try {
      setLoading(true);
      setError('');
      const [ticketData, commentList] = await Promise.all([
        ticketApi.getTicketById(id),
        ticketApi.getComments(id),
      ]);
      setTicket(ticketData);
      setSelectedStatus(ticketData.status);
      setSelectedDept(ticketData.department?._id || ticketData.department || '');
      setComments(commentList);
    } catch (err) {
      setError(err.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
    if (isSupport) {
      departmentApi.getDepartments().then(setDepartments).catch(console.error);
    }
  }, [id, isSupport]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      setError('');
      const added = await ticketApi.addComment(id, newComment);
      setComments([...comments, added]);
      setNewComment('');
      setSuccessMsg('Comment added successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === ticket.status) return;

    try {
      setUpdatingStatus(true);
      setError('');
      const updated = await ticketApi.updateStatus(id, selectedStatus);
      setTicket(updated);
      setSuccessMsg(`Status updated to ${updated.status}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignDept = async () => {
    try {
      setAssigningDept(true);
      setError('');
      const updated = await ticketApi.assignDepartment(id, selectedDept);
      setTicket(updated);
      setSuccessMsg('Department assigned successfully');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to assign department');
    } finally {
      setAssigningDept(false);
    }
  };

  const handleReopen = async () => {
    if (!window.confirm('Do you want to reopen this ticket? (Note: A resolved ticket can only be reopened once)')) {
      return;
    }

    try {
      setReopening(true);
      setError('');
      const updated = await ticketApi.reopenTicket(id);
      setTicket(updated);
      setSelectedStatus(updated.status);
      setSuccessMsg('Ticket successfully reopened!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to reopen ticket');
    } finally {
      setReopening(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading ticket #{id}...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error || 'Ticket not found'}</div>
        <Link to="/tickets" className="btn btn-secondary">
          ← Back to Tickets
        </Link>
      </div>
    );
  }

  const isClosed = ticket.status === 'Closed';
  const isResolved = ticket.status === 'Resolved';
  const canReopen = isResolved && ticket.reopenCount === 0;
  const alreadyReopenedOnce = ticket.reopenCount >= 1;

  return (
    <div className="page-container">
      <div className="ticket-detail-header">
        <div>
          <Link to={isSupport ? '/admin/tickets' : '/tickets'} className="back-link">
            ← Back to {isSupport ? 'All Tickets' : 'My Tickets'}
          </Link>
          <div className="ticket-title-row">
            <span className="ticket-id-tag">{ticket.ticketId}</span>
            <h1>{ticket.title}</h1>
          </div>
        </div>

        <div className="ticket-status-badges">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      {/* PS8 Business Rule 11 Notification */}
      {isClosed && (
        <div className="alert alert-info">
          🔒 <strong>Closed Ticket:</strong> This ticket has been marked as Closed and is read-only.
          No further edits, status modifications, or comments are permitted.
        </div>
      )}

      {/* PS8 Business Rule 10 Reopen Action for Customer */}
      {isResolved && (
        <div className="reopen-banner">
          <div>
            <strong>Issue Resolved:</strong> If this issue is not fully resolved, you may reopen it.
            {alreadyReopenedOnce ? (
              <p className="text-warning">
                ⚠️ This ticket has already been reopened once. Per system policy, it cannot be reopened again.
              </p>
            ) : (
              <p className="text-muted">You are permitted to reopen this ticket once.</p>
            )}
          </div>
          {canReopen && (
            <button onClick={handleReopen} disabled={reopening} className="btn btn-warning">
              {reopening ? 'Reopening...' : '🔄 Reopen Ticket'}
            </button>
          )}
        </div>
      )}

      <div className="ticket-detail-grid">
        {/* Left Column: Description & Screenshot */}
        <div className="ticket-main-col">
          <div className="card">
            <h3>Issue Description</h3>
            <p className="ticket-description-text">{ticket.description}</p>

            {ticket.screenshotUrl && (
              <div className="screenshot-section">
                <h4>Attached Screenshot / Reference:</h4>
                <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={ticket.screenshotUrl}
                    alt="Ticket attachment"
                    className="screenshot-preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </a>
                <p>
                  <a href={ticket.screenshotUrl} target="_blank" rel="noopener noreferrer">
                    Open image in full window ↗
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* Comment Thread (PS8 Requirement 8) */}
          <div className="card comment-card">
            <h3>Conversation Thread ({comments.length})</h3>

            {comments.length === 0 ? (
              <p className="text-muted empty-comments">No comments yet. Start the conversation below.</p>
            ) : (
              <div className="comment-list">
                {comments.map((c) => {
                  const isStaff = c.authorRole === 'support';
                  return (
                    <div key={c._id} className={`comment-bubble ${isStaff ? 'comment-staff' : 'comment-customer'}`}>
                      <div className="comment-header">
                        <span className="comment-author">
                          <strong>{c.author?.name || 'User'}</strong>
                          <span className={`role-pill ${isStaff ? 'pill-staff' : 'pill-customer'}`}>
                            {isStaff ? 'Support Staff' : 'Customer'}
                          </span>
                        </span>
                        <span className="comment-time">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="comment-message">{c.message}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Comment Form */}
            {!isClosed ? (
              <form onSubmit={handleAddComment} className="comment-form">
                <textarea
                  rows={3}
                  required
                  placeholder="Type a response or question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={submittingComment || !newComment.trim()} className="btn btn-primary">
                  {submittingComment ? 'Sending...' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <p className="text-muted text-center py-2">
                <em>Comments are disabled on closed tickets.</em>
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Staff Controls */}
        <div className="ticket-sidebar-col">
          <div className="card">
            <h3>Ticket Details</h3>
            <div className="meta-list">
              <div className="meta-item">
                <span className="meta-label">Customer:</span>
                <span className="meta-value">
                  {ticket.customer?.name} <small>({ticket.customer?.email})</small>
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Category:</span>
                <span className="meta-value">{ticket.category}</span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Assigned Dept:</span>
                <span className="meta-value">
                  {ticket.department ? ticket.department.name : 'Unassigned'}
                </span>
              </div>

              <div className="meta-item">
                <span className="meta-label">Created At:</span>
                <span className="meta-value">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>

              {ticket.resolvedAt && (
                <div className="meta-item">
                  <span className="meta-label">Resolved At:</span>
                  <span className="meta-value">{new Date(ticket.resolvedAt).toLocaleString()}</span>
                </div>
              )}

              {ticket.closedAt && (
                <div className="meta-item">
                  <span className="meta-label">Closed At:</span>
                  <span className="meta-value">{new Date(ticket.closedAt).toLocaleString()}</span>
                </div>
              )}

              <div className="meta-item">
                <span className="meta-label">Reopen Count:</span>
                <span className="meta-value">{ticket.reopenCount} / 1</span>
              </div>
            </div>
          </div>

          {/* Support Staff Controls (PS8 Requirement 6 & 7) */}
          {isSupport && (
            <div className="card staff-control-card">
              <h3>Support Actions</h3>

              <div className="control-group">
                <label>Update Status Workflow:</label>
                <div className="flex-row">
                  <select
                    value={selectedStatus}
                    disabled={isClosed || updatingStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button
                    onClick={handleStatusChange}
                    disabled={isClosed || updatingStatus || selectedStatus === ticket.status}
                    className="btn btn-sm btn-primary"
                  >
                    {updatingStatus ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              <div className="control-group">
                <label>Assign Department:</label>
                <div className="flex-row">
                  <select
                    value={selectedDept}
                    disabled={isClosed || assigningDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                  >
                    <option value="">-- Unassigned --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignDept}
                    disabled={isClosed || assigningDept}
                    className="btn btn-sm btn-primary"
                  >
                    {assigningDept ? 'Saving...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
