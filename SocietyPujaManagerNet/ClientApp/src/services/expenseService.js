import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const getAllExpenses = async () => await apiGet('/expenses') || [];
export const getExpenseById = async (id) => await apiGet(`/expenses/${id}`);

export const createExpense = async (data, proofFiles = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    const res = await apiPost('/expenses', payload);
    if (res && res.id) {
      await apiPost(`/payment-proofs/${res.id}`, base64List);
    }
    return res;
  }
  return await apiPost('/expenses', payload);
};

export const updateExpense = async (id, data, proofFiles = [], existingProofs = []) => {
  const payload = { ...data };
  if (proofFiles && proofFiles.length > 0) {
    const base64List = [];
    for (const f of proofFiles) {
      base64List.push(await compressImageFile(f));
    }
    payload.paymentProofUrl = "has_proof";
    await apiPost(`/payment-proofs/${id}`, [...existingProofs, ...base64List]);
  }
  return await apiPut(`/expenses/${id}`, payload);
};

export const deleteExpense = async (id) => await apiDelete(`/expenses/${id}`);

export const getExpenseStats = async (existingExpenses = null) => {
  const all = existingExpenses || (await getAllExpenses());
  let totalAmount = 0;
  all.forEach(e => {
    totalAmount += Number(e.Amount || e.amount || 0);
  });
  return {
    totalCount: all.length,
    totalAmount
  };
};
