import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboardApi';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Calculating live database metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error || 'Unable to load metrics'}</div>
        <button onClick={loadStats} className="btn btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  const {
    totalTickets,
    statusBreakdown,
    categoryBreakdown,
    priorityBreakdown,
    averageResolutionHours,
    resolvedTicketsCount,
    totalDepartments,
    totalCustomers,
  } = stats;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Helpdesk Analytics Dashboard</h1>
          <p>Real-time overview of ticket volume, resolution times, and team breakdowns</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/tickets" className="btn btn-primary">
            View All Tickets
          </Link>
          <button onClick={loadStats} className="btn btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* PS8 Requirement 12: Top Stat Cards (Open vs Resolved, Total, Avg Resolution Time) */}
      <div className="stats-cards-grid">
        <div className="stat-card">
          <div className="stat-icon icon-blue">📋</div>
          <div className="stat-content">
            <span className="stat-label">Total Tickets</span>
            <span className="stat-value">{totalTickets}</span>
            <small className="stat-desc">From {totalCustomers} registered customers</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Active / Open</span>
            <span className="stat-value">{statusBreakdown.activeTotal}</span>
            <small className="stat-desc">
              {statusBreakdown.open} Open, {statusBreakdown.inProgress} In Progress
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green">✅</div>
          <div className="stat-content">
            <span className="stat-label">Resolved / Closed</span>
            <span className="stat-value">{statusBreakdown.resolvedTotal}</span>
            <small className="stat-desc">
              {statusBreakdown.resolved} Resolved, {statusBreakdown.closed} Closed
            </small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-purple">⚡</div>
          <div className="stat-content">
            <span className="stat-label">Avg Resolution Time</span>
            <span className="stat-value">{averageResolutionHours} hrs</span>
            <small className="stat-desc">Calculated from {resolvedTicketsCount} resolved tickets</small>
          </div>
        </div>
      </div>

      <div className="dashboard-charts-grid">
        {/* Priority-wise Breakdown Card */}
        <div className="card">
          <div className="card-header-simple">
            <h3>Priority Breakdown</h3>
            <span className="text-muted">Tickets by urgency level</span>
          </div>

          <div className="breakdown-list">
            {Object.entries(priorityBreakdown).map(([prio, count]) => {
              const percent = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={prio} className="breakdown-item">
                  <div className="breakdown-label-row">
                    <span className="breakdown-name">{prio}</span>
                    <span className="breakdown-count">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className={`progress-fill progress-${prio.toLowerCase()}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category-wise Breakdown Card */}
        <div className="card">
          <div className="card-header-simple">
            <h3>Category Breakdown</h3>
            <span className="text-muted">Tickets by problem classification</span>
          </div>

          <div className="breakdown-list">
            {Object.entries(categoryBreakdown).map(([cat, count]) => {
              const percent = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0;
              return (
                <div key={cat} className="breakdown-item">
                  <div className="breakdown-label-row">
                    <span className="breakdown-name">{cat}</span>
                    <span className="breakdown-count">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-fill progress-category"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Status Workflow Distribution Overview */}
      <div className="card mt-4">
        <h3>Status Workflow Pipeline</h3>
        <p className="text-muted mb-3">Tickets currently at each step of the resolution lifecycle:</p>

        <div className="pipeline-steps-grid">
          <div className="pipeline-step step-open">
            <span className="step-count">{statusBreakdown.open}</span>
            <span className="step-name">1. Open</span>
            <small>Customer editable</small>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-step step-progress">
            <span className="step-count">{statusBreakdown.inProgress}</span>
            <span className="step-name">2. In Progress</span>
            <small>Assigned & investigating</small>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-step step-resolved">
            <span className="step-count">{statusBreakdown.resolved}</span>
            <span className="step-name">3. Resolved</span>
            <small>Can reopen once</small>
          </div>

          <div className="pipeline-arrow">➔</div>

          <div className="pipeline-step step-closed">
            <span className="step-count">{statusBreakdown.closed}</span>
            <span className="step-name">4. Closed</span>
            <small>Read-only archive</small>
          </div>
        </div>
      </div>
    </div>
  );
};
