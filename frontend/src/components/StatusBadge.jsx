import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeClass = (s) => {
    switch (s) {
      case 'Open':
        return 'badge-open';
      case 'In Progress':
        return 'badge-progress';
      case 'Resolved':
        return 'badge-resolved';
      case 'Closed':
        return 'badge-closed';
      default:
        return 'badge-default';
    }
  };

  return <span className={`badge ${getBadgeClass(status)}`}>{status}</span>;
};

export const PriorityBadge = ({ priority }) => {
  const getPriorityClass = (p) => {
    switch (p) {
      case 'Low':
        return 'priority-low';
      case 'Medium':
        return 'priority-medium';
      case 'High':
        return 'priority-high';
      case 'Urgent':
        return 'priority-urgent';
      default:
        return 'priority-default';
    }
  };

  return <span className={`priority-tag ${getPriorityClass(priority)}`}>{priority}</span>;
};
