import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getNotifications = async () => {
  const all = await apiGet('/notifications') || [];
  return all.filter(n => n.Active !== false && n.active !== false);
};

export const getAllNotifications = async () => await apiGet('/notifications') || [];
export const getActiveNotifications = getNotifications;

export const saveNotification = async (item) => {
  if (item.id) {
    return await apiPut(`/notifications/${item.id}`, item);
  }
  return await apiPost('/notifications', item);
};

export const createNotification = async (data) => await apiPost('/notifications', data);
export const updateNotification = async (id, data) => await apiPut(`/notifications/${id}`, data);
export const deleteNotification = async (id) => await apiDelete(`/notifications/${id}`);

export const DEFAULT_DPC_MEMBERS = [
  { name: 'President', role: 'President', phone: '' },
  { name: 'Secretary', role: 'Secretary', phone: '' },
  { name: 'Treasurer', role: 'Treasurer', phone: '' }
];

export const getDPCCommittee = async () => {
  const config = await apiGet('/master-config');
  return (config && config.dpcMembers) || DEFAULT_DPC_MEMBERS;
};

export const getFeedbacks = async () => await apiGet('/feedback') || [];
export const getAllFeedback = getFeedbacks;

export const submitFeedback = async (data) => {
  const sanitized = {
    ...data,
    name: (data.name || '').trim().substring(0, 100),
    phoneNumber: (data.phoneNumber || '').trim().substring(0, 20),
    flatNumber: (data.flatNumber || '').trim().toUpperCase().substring(0, 50),
    message: (data.message || '').trim().substring(0, 2000),
    category: (data.category || 'General').substring(0, 50),
  };
  return await apiPost('/feedback', sanitized);
};

export const replyToFeedback = async (id, replyMessage, repliedBy = '') => {
  return await apiPost(`/feedback/${id}/reply`, { replyMessage, repliedBy });
};

export const deleteFeedback = async (id) => await apiDelete(`/feedback/${id}`);

export const getPublicSubscriptionReport = async () => await apiGet('/public/subscription-report');
export const getSubscriptionReport = getPublicSubscriptionReport;

export const getFlatDetails = async (flatNumber) => await apiGet(`/public/flat/${flatNumber}`);
export const getFlatData = getFlatDetails;

export const getSocietyContacts = async () => {
  const config = await apiGet('/master-config');
  return (config && config.contacts) || [];
};

export const saveSocietyContacts = async (contacts) => {
  return await apiPost('/master-config', { contacts });
};
