import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllChequeTransactions = async () => await apiGet('/cheque-transactions') || [];
export const getChequeTransactionById = async (id) => await apiGet(`/cheque-transactions/${id}`);
export const createChequeTransaction = async (data) => await apiPost('/cheque-transactions', data);
export const updateChequeTransaction = async (id, data) => await apiPut(`/cheque-transactions/${id}`, data);
export const deleteChequeTransaction = async (id) => await apiDelete(`/cheque-transactions/${id}`);

export const getChequeTransactionStats = (transactions = []) => {
  let totalAmount = 0;
  let clearedAmount = 0;
  transactions.forEach(t => {
    const amt = Number(t.Amount || t.amount || 0);
    totalAmount += amt;
    if ((t.Status || t.status) === 'cleared') {
      clearedAmount += amt;
    }
  });
  return {
    totalCount: transactions.length,
    totalAmount,
    clearedAmount,
    pendingAmount: totalAmount - clearedAmount
  };
};
