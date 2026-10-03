import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

/**
 * Check if a puja day date is today or in the future.
 * Also checks masterConfig if provided.
 */
export const isFoodDayValid = (dayDate, masterConfig = null) => {
  if (masterConfig && masterConfig.foodDays) {
    const day = masterConfig.foodDays.find(d => d.date === dayDate);
    if (day && day.isActive === false) return false;
  }
  if (!dayDate) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dayDate.includes('T') ? dayDate : dayDate + 'T00:00:00');
  if (isNaN(d.getTime())) return true;
  return d >= today;
};

const normalizeDraft = (d) => {
  if (!d) return d;
  if (!d.items && d.itemsJson) {
    try {
      d.items = JSON.parse(d.itemsJson);
    } catch {
      d.items = [];
    }
  } else if (!d.items) {
    d.items = [];
  }
  return d;
};

export const getAllDraftCarts = async () => {
  const list = (await apiGet('/draft-carts')) || [];
  return list.map(normalizeDraft);
};

export const getDraftCartById = async (id) => {
  const d = await apiGet(`/draft-carts/${id}`);
  return normalizeDraft(d);
};

export const createDraftCart = async (data) => {
  const payload = { ...data };
  if (payload.items && !payload.itemsJson) {
    payload.itemsJson = JSON.stringify(payload.items);
  }
  const result = await apiPost('/draft-carts', payload);
  return normalizeDraft(result);
};

export const updateDraftCart = async (id, data) => {
  const payload = { ...data };
  if (payload.items && !payload.itemsJson) {
    payload.itemsJson = JSON.stringify(payload.items);
  }
  const result = await apiPut(`/draft-carts/${id}`, payload);
  return normalizeDraft(result);
};

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
