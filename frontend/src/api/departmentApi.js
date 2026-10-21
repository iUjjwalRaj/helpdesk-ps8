import { request } from './client';

export const departmentApi = {
  getDepartments: () => request('/departments'),

  createDepartment: (departmentData) =>
    request('/departments', {
      method: 'POST',
      body: JSON.stringify(departmentData),
    }),

  updateDepartment: (id, departmentData) =>
    request(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(departmentData),
    }),

  deleteDepartment: (id) =>
    request(`/departments/${id}`, {
      method: 'DELETE',
    }),
};
