import { request } from './client';

export const dashboardApi = {
  getStats: () => request('/dashboard/stats'),
};
