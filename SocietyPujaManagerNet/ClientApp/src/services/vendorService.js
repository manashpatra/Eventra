import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const getAllVendors = async () => await apiGet('/vendors') || [];
export const getVendorById = async (id) => await apiGet(`/vendors/${id}`);

export const createVendor = async (data, proofFiles = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    payload.dealImageUrl = await compressImageFile(proofFiles[0]);
  }
  return await apiPost('/vendors', payload);
};

export const updateVendor = async (id, data, proofFiles = [], existingProofs = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    payload.dealImageUrl = await compressImageFile(proofFiles[0]);
  }
  return await apiPut(`/vendors/${id}`, payload);
};

export const deleteVendor = async (id) => await apiDelete(`/vendors/${id}`);

export const addVendorPayment = async (vendorId, paymentData) => {
  return await apiPost(`/vendors/${vendorId}/payments`, paymentData);
};

export const updateVendorPayment = async (vendorId, paymentId, updatedPaymentData) => {
  return await apiPut(`/vendors/${vendorId}/payments/${paymentId}`, updatedPaymentData);
};

export const deleteVendorPayment = async (vendorId, paymentId) => {
  return await apiDelete(`/vendors/${vendorId}/payments/${paymentId}`);
};
