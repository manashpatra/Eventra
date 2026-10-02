import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const getAllSponsorships = async () => await apiGet('/sponsorships') || [];
export const getSponsorshipById = async (id) => await apiGet(`/sponsorships/${id}`);

export const createSponsorship = async (data, proofFiles = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    const res = await apiPost('/sponsorships', payload);
    if (res && res.id) {
      await apiPost(`/payment-proofs/${res.id}`, base64List);
    }
    return res;
  }
  return await apiPost('/sponsorships', payload);
};

export const updateSponsorship = async (id, data, proofFiles = [], existingProofs = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    await apiPost(`/payment-proofs/${id}`, [...existingProofs, ...base64List]);
  }
  return await apiPut(`/sponsorships/${id}`, payload);
};

export const deleteSponsorship = async (id) => await apiDelete(`/sponsorships/${id}`);

export const getSponsorshipStats = async (existingSponsorships = null) => {
  const all = existingSponsorships || (await getAllSponsorships());
  let totalAmount = 0;
  all.forEach(s => {
    totalAmount += Number(s.Amount || s.amount || 0);
  });
  return {
    totalCount: all.length,
    totalAmount
  };
};

export const searchSponsorshipsByFilters = async (filters) => await getAllSponsorships();
