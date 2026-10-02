import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const generateFlatNumber = (block, floor, flatType) => {
  const floorStr = floor.toString().padStart(2, '0');
  return `${block}-${floorStr}${flatType}`;
};

export const getAllResidents = async () => await apiGet('/residents') || [];

export const getResidentById = async (id) => await apiGet(`/residents/${id}`);

export const getResidentsByBlock = async (block, existingResidents = null) => {
  const all = existingResidents || (await getAllResidents());
  return all.filter(r => (r.Block || r.block) === block);
};

export const searchResidentsByFilters = async (searchTerm, block, status, paymentMode, hasDate) => {
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.append('term', searchTerm);
  if (block) queryParams.append('block', block);
  if (status) queryParams.append('status', status);
  if (paymentMode) queryParams.append('paymentMode', paymentMode);
  return await apiGet(`/residents/search?${queryParams.toString()}`) || [];
};

export const searchResidents = async (searchTerm, existingResidents = null) => {
  const all = existingResidents || (await getAllResidents());
  if (!searchTerm) return all;
  const term = searchTerm.toLowerCase();
  return all.filter(r => 
    (r.FlatNumber || r.flatNumber || '').toLowerCase().includes(term) ||
    (r.ResidentName || r.residentName || '').toLowerCase().includes(term) ||
    (r.Phone || r.phone || '').includes(term)
  );
};

export const createResident = async (data) => await apiPost('/residents', data);
export const updateResident = async (id, data) => await apiPut(`/residents/${id}`, data);
export const deleteResident = async (id) => await apiDelete(`/residents/${id}`);

export const recordSubscription = async (id, paymentData, proofFiles = [], existingProofs = []) => {
  const payload = { ...paymentData };
  if (proofFiles && proofFiles.length > 0) {
    const compressed = [];
    for (const f of proofFiles) {
      compressed.push(await compressImageFile(f));
    }
    payload.proofImages = JSON.stringify([...existingProofs, ...compressed]);
  }
  return await apiPost(`/residents/${id}/subscription`, payload);
};

export const recordSubscriptionPayment = recordSubscription;

export const deleteSubscriptionPayment = async (id) => await apiDelete(`/residents/${id}/subscription`);

export const getSubscriptionStats = async (existingResidents = null) => {
  const all = existingResidents || (await getAllResidents());
  const totalCount = all.length;
  let collectedAmount = 0;
  let paidCount = 0;
  all.forEach(r => {
    const paid = Number(r.PaidAmount || r.paidAmount || 0);
    if (paid > 0) {
      collectedAmount += paid;
      paidCount++;
    }
  });
  return {
    totalResidents: totalCount,
    paidResidents: paidCount,
    pendingResidents: totalCount - paidCount,
    totalCollected: collectedAmount
  };
};

export const savePaymentProof = async (recordId, base64Image) => await apiPost(`/payment-proofs/${recordId}`, [base64Image]);

export const getPaymentProof = async (recordId) => {
  try {
    const images = await apiGet(`/payment-proofs/${recordId}`);
    return images && images.length > 0 ? images[0] : null;
  } catch { return null; }
};
