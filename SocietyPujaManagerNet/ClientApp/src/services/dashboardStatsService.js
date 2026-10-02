import { apiGet } from './apiClient';

export const getDashboardStats = async (forceRefresh = false) => {
  return await apiGet('/dashboard/stats');
};

export const refreshDashboardStats = async () => {
  return await apiGet('/dashboard/stats');
};

export const queueStatsRefresh = () => {};
