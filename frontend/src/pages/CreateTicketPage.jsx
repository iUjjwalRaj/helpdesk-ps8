import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ticketApi } from '../api/ticketApi';
import { departmentApi } from '../api/departmentApi';

export const CreateTicketPage = () => {
  const { id } = useParams(); // If present, edit mode
  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technical');
  const [priority, setPriority] = useState('Medium');
  const [department, setDepartment] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [departments, setDepartments] = useState([]);

  const [ticketStatus, setTicketStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const list = await departmentApi.getDepartments();
        setDepartments(list);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };

    const loadTicketForEdit = async () => {
      if (!isEditMode) return;
      try {
        setFetching(true);
        const ticket = await ticketApi.getTicketById(id);
        setTicketStatus(ticket.status);

        if (ticket.status !== 'Open') {
          setError(`This ticket cannot be edited because its status is '${ticket.status}'. Edits are only permitted when status is 'Open'.`);
        }

        setTitle(ticket.title || '');
        setCategory(ticket.category || 'Technical');
        setPriority(ticket.priority || 'Medium');
        setDepartment(ticket.department?._id || ticket.department || '');
        setDescription(ticket.description || '');
        setScreenshotUrl(ticket.screenshotUrl || '');
      } catch (err) {
        setError(err.message || 'Failed to load ticket for editing');
      } finally {
        setFetching(false);
      }
    };

    loadDepartments();
    if (isEditMode) {
      loadTicketForEdit();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isEditMode && ticketStatus !== 'Open') {
      setError('Tickets can only be edited while status is Open.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        category,
        priority,
        department: department || null,
        description,
        screenshotUrl,
      };

      if (isEditMode) {
        await ticketApi.updateTicket(id, payload);
        navigate(`/tickets/${id}`);
      } else {
        const created = await ticketApi.createTicket(payload);
        navigate(`/tickets/${created._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to save ticket');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading ticket details...</p>
      </div>
    );
  }

  const isLocked = isEditMode && ticketStatus !== 'Open';

  return (
    <div className="page-container form-container-narrow">
      <div className="form-card">
        <div className="form-card-header">
          <Link to="/tickets" className="back-link">
            ← Back to Tickets
          </Link>
          <h2>{isEditMode ? 'Edit Support Ticket' : 'Create New Support Ticket'}</h2>
          <p>
            {isEditMode
              ? 'Update ticket information (permitted while status is Open)'
              : 'Submit a new complaint or issue to the helpdesk system'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {isLocked ? (
          <div className="locked-message-card">
            <h3>🔒 Editing Restricted</h3>
            <p>
              According to helpdesk rules, tickets can only be edited or deleted while their status is{' '}
              <strong>Open</strong>. This ticket is currently <strong>{ticketStatus}</strong>.
            </p>
            <Link to={`/tickets/${id}`} className="btn btn-secondary">
              Return to Ticket Details
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="standard-form">
            <div className="form-group">
              <label htmlFor="ticket-title">Ticket Subject / Title *</label>
              <input
                id="ticket-title"
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Cannot connect to company VPN"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="ticket-category">Category *</label>
                <select
                  id="ticket-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing</option>
                  <option value="Account">Account</option>
                  <option value="Hardware">Hardware</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="ticket-priority">Priority *</label>
                <select
                  id="ticket-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ticket-department">Department (Optional)</label>
              <select
                id="ticket-department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">-- Unassigned / Let Support Assign --</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ticket-description">Detailed Description *</label>
              <textarea
                id="ticket-description"
                rows={5}
                required
                placeholder="Describe the issue, error messages observed, and steps to reproduce..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ticket-screenshot">Optional Screenshot Image URL</label>
              <input
                id="ticket-screenshot"
                type="url"
                placeholder="https://example.com/screenshot.png"
                value={screenshotUrl}
                onChange={(e) => setScreenshotUrl(e.target.value)}
              />
              <small className="form-help">
                Paste an image URL (e.g. from Imgur, Cloudinary, or Unsplash)
              </small>
            </div>

            <div className="form-actions">
              <Link to="/tickets" className="btn btn-secondary">
                Cancel
              </Link>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Submitting...' : isEditMode ? 'Save Changes' : 'Create Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
