import { request } from './client';

export const ticketApi = {
  getTickets: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.category) query.append('category', params.category);
    if (params.department) query.append('department', params.department);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/tickets${queryString}`);
  },

  getTicketById: (id) => request(`/tickets/${id}`),

  createTicket: (data) =>
    request('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTicket: (id, data) =>
    request(`/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTicket: (id) =>
    request(`/tickets/${id}`, {
      method: 'DELETE',
    }),

  updateStatus: (id, status) =>
    request(`/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  reopenTicket: (id) =>
    request(`/tickets/${id}/reopen`, {
      method: 'POST',
    }),

  assignDepartment: (id, departmentId) =>
    request(`/tickets/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ departmentId }),
    }),

  getComments: (ticketId) => request(`/tickets/${ticketId}/comments`),

  addComment: (ticketId, message) =>
    request(`/tickets/${ticketId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
