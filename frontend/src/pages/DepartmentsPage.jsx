import React, { useState, useEffect } from 'react';
import { departmentApi } from '../api/departmentApi';

export const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Department Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const list = await departmentApi.getDepartments();
      setDepartments(list);
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError('');
      const created = await departmentApi.createDepartment({ name, description });
      setDepartments([...departments, created]);
      setName('');
      setDescription('');
      setSuccess(`Department "${created.name}" created successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (dept) => {
    setEditingId(dept._id);
    setEditName(dept.name);
    setEditDescription(dept.description || '');
    setEditIsActive(dept.isActive !== false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const updated = await departmentApi.updateDepartment(editingId, {
        name: editName,
        description: editDescription,
        isActive: editIsActive,
      });
      setDepartments(departments.map((d) => (d._id === editingId ? updated : d)));
      setEditingId(null);
      setSuccess(`Department "${updated.name}" updated`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update department');
    }
  };

  const handleDelete = async (id, deptName) => {
    if (!window.confirm(`Are you sure you want to delete department "${deptName}"?`)) {
      return;
    }

    try {
      setError('');
      await departmentApi.deleteDepartment(id);
      setDepartments(departments.filter((d) => d._id !== id));
      setSuccess(`Department "${deptName}" deleted`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete department');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Department Management</h1>
          <p>Create and maintain organizational departments for ticket assignment</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="departments-grid">
        {/* Left: Department List Table */}
        <div className="departments-list-col">
          <div className="card">
            <h3>Active Departments ({departments.length})</h3>

            {loading ? (
              <div className="table-loader">
                <div className="spinner"></div>
                <p>Loading departments...</p>
              </div>
            ) : departments.length === 0 ? (
              <p className="text-muted py-3">No departments created yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((d) => {
                      if (editingId === d._id) {
                        return (
                          <tr key={d._id} className="edit-row">
                            <td colSpan={4}>
                              <form onSubmit={handleUpdate} className="inline-edit-form">
                                <div className="form-group">
                                  <label>Department Name</label>
                                  <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                  />
                                </div>
                                <div className="form-group">
                                  <label>Description</label>
                                  <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                  />
                                </div>
                                <div className="form-group checkbox-group">
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={editIsActive}
                                      onChange={(e) => setEditIsActive(e.target.checked)}
                                    />
                                    Active for ticket assignment
                                  </label>
                                </div>
                                <div className="flex-row gap-2 mt-2">
                                  <button type="submit" className="btn btn-sm btn-primary">
                                    Save
                                  </button>
                                  <button type="button" onClick={cancelEdit} className="btn btn-sm btn-secondary">
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={d._id}>
                          <td>
                            <strong>{d.name}</strong>
                          </td>
                          <td>
                            <small className="text-muted">{d.description || 'No description'}</small>
                          </td>
                          <td>
                            <span className={`badge ${d.isActive ? 'badge-open' : 'badge-closed'}`}>
                              {d.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => startEdit(d)} className="btn-action btn-edit">
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(d._id, d.name)}
                              className="btn-action btn-delete"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Add New Department Card */}
        <div className="departments-form-col">
          <div className="card">
            <h3>Add New Department</h3>
            <p className="text-muted">Register a new department team to handle complaints.</p>

            <form onSubmit={handleCreate} className="standard-form mt-3">
              <div className="form-group">
                <label htmlFor="dept-name">Department Name *</label>
                <input
                  id="dept-name"
                  type="text"
                  required
                  placeholder="e.g. IT Security or Logistics"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dept-desc">Description</label>
                <textarea
                  id="dept-desc"
                  rows={3}
                  placeholder="Scope of issues handled by this department..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button type="submit" disabled={submitting || !name.trim()} className="btn btn-primary btn-block">
                {submitting ? 'Creating...' : '+ Create Department'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
