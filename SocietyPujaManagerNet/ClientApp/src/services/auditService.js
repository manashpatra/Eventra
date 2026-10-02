import { apiGet, apiPost } from './apiClient';

export const logAudit = async (action, entityType, entityId, details = null) => {
  try {
    const user = JSON.parse(localStorage.getItem('user_info') || '{}');
    await apiPost('/audit-logs', {
      action,
      entityType,
      entityId,
      performedByEmail: user.email || 'system',
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
    });
  } catch (e) {
    console.error('Audit logging failed', e);
  }
};

export const getAuditLogs = async (filters = {}) => {
  const queryParams = new URLSearchParams();
  if (filters.action) queryParams.append('action', filters.action);
  if (filters.entityType) queryParams.append('entityType', filters.entityType);
  if (filters.userEmail) queryParams.append('userEmail', filters.userEmail);
  if (filters.limit) queryParams.append('limit', filters.limit);
  return await apiGet(`/audit-logs?${queryParams.toString()}`) || [];
};

export const getFilteredAuditLogs = async (filters = {}) => {
  const { action, entityType, userEmail, startDate, endDate } = filters;
  const hasFilters = action || entityType || userEmail || startDate || endDate;
  if (!hasFilters) return [];

  const logs = await apiGet('/audit-logs') || [];
  let result = logs;

  if (action && action !== 'all') {
    result = result.filter((l) => (l.Action || l.action) === action);
  }
  if (entityType && entityType !== 'all') {
    result = result.filter((l) => (l.EntityType || l.entityType) === entityType);
  }
  if (userEmail && userEmail !== 'all') {
    result = result.filter((l) => (l.PerformedByEmail || l.performedByEmail) === userEmail);
  }
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    result = result.filter((l) => new Date(l.Timestamp || l.timestamp) >= start);
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    result = result.filter((l) => new Date(l.Timestamp || l.timestamp) <= end);
  }

  return result.sort((a, b) => new Date(b.Timestamp || b.timestamp) - new Date(a.Timestamp || a.timestamp));
};
