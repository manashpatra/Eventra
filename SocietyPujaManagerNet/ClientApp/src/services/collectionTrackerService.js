import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllLeads = async () => await apiGet('/leads') || [];
export const getAllCollectionTrackers = getAllLeads;

export const getLeadById = async (id) => await apiGet(`/leads/${id}`);
export const getCollectionTrackerById = getLeadById;

export const createLead = async (data) => await apiPost('/leads', data);
export const createCollectionTracker = createLead;

export const updateLead = async (id, data) => await apiPut(`/leads/${id}`, data);
export const updateCollectionTracker = updateLead;

export const deleteLead = async (id) => await apiDelete(`/leads/${id}`);
export const deleteCollectionTracker = deleteLead;

export const getLeadStats = async (existingLeads = null) => {
  const all = existingLeads || (await getAllLeads());
  let targetAmount = 0;
  let collectedAmount = 0;
  all.forEach(l => {
    targetAmount += Number(l.TargetAmount || l.targetAmount || 0);
    collectedAmount += Number(l.CollectedAmount || l.collectedAmount || 0);
  });
  return {
    totalCount: all.length,
    targetAmount,
    collectedAmount
  };
};
