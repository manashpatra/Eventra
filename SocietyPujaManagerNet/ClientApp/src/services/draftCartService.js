import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const isFoodDayValid = (dayDate, masterConfig) => {
  if (!masterConfig || !masterConfig.foodDays) return true;
  const day = masterConfig.foodDays.find(d => d.date === dayDate);
  return !day || day.isActive !== false;
};

export const getAllDraftCarts = async () => await apiGet('/draft-carts') || [];
export const getDraftCartById = async (id) => await apiGet(`/draft-carts/${id}`);

export const createDraftCart = async (data) => await apiPost('/draft-carts', data);
export const updateDraftCart = async (id, data) => await apiPut(`/draft-carts/${id}`, data);
export const deleteDraftCart = async (id) => await apiDelete(`/draft-carts/${id}`);

export const getPendingDraftCartsByResidentId = async (residentId) => {
  const all = await getAllDraftCarts();
  return all.filter(c => (c.ResidentId || c.residentId) === residentId && (c.Status || c.status) !== 'completed');
};

export const getDraftCartsByResident = getPendingDraftCartsByResidentId;

export const getDraftCartsByFlat = async (flatNumber, existingDrafts = null) => {
  const all = existingDrafts || (await getAllDraftCarts());
  return all.filter(c => (c.FlatNumber || c.flatNumber) === flatNumber);
};

export const confirmDraftCart = async (id, couponNumbers, confirmedBy, paymentMode) => {
  return await apiPost(`/draft-carts/${id}/confirm`, { couponNumbers, confirmedBy, paymentMode });
};
