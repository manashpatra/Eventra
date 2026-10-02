import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const getAllDonations = async () => await apiGet('/donations') || [];
export const getDonationById = async (id) => await apiGet(`/donations/${id}`);

export const createDonation = async (data, proofFiles = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    const res = await apiPost('/donations', payload);
    if (res && res.id) {
      await apiPost(`/payment-proofs/${res.id}`, base64List);
    }
    return res;
  }
  return await apiPost('/donations', payload);
};

export const updateDonation = async (id, data, proofFiles = [], existingProofs = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    await apiPost(`/payment-proofs/${id}`, [...existingProofs, ...base64List]);
  }
  return await apiPut(`/donations/${id}`, payload);
};

export const deleteDonation = async (id) => await apiDelete(`/donations/${id}`);

export const getDonationStats = async (existingDonations = null) => {
  const all = existingDonations || (await getAllDonations());
  let totalAmount = 0;
  all.forEach(d => {
    totalAmount += Number(d.Amount || d.amount || 0);
  });
  return {
    totalCount: all.length,
    totalAmount
  };
};

export const searchDonationsByFilters = async (searchTerm, hasDate, fetchAll) => {
  const all = await getAllDonations();
  if (!searchTerm) return all;
  const term = searchTerm.toLowerCase();
  return all.filter(d => 
    (d.DonorName || d.donorName || '').toLowerCase().includes(term) ||
    (d.FlatNumber || d.flatNumber || '').toLowerCase().includes(term) ||
    (d.Phone || d.phone || '').includes(term)
  );
};
