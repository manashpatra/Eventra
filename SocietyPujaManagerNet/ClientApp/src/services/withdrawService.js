import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllWithdrawTransactions = async () => await apiGet('/withdraw-transactions') || [];
export const getWithdrawTransactionById = async (id) => await apiGet(`/withdraw-transactions/${id}`);
export const createWithdrawTransaction = async (data) => await apiPost('/withdraw-transactions', data);
export const updateWithdrawTransaction = async (id, data) => await apiPut(`/withdraw-transactions/${id}`, data);
export const deleteWithdrawTransaction = async (id) => await apiDelete(`/withdraw-transactions/${id}`);

export const getWithdrawTransactionStats = (transactions = []) => {
  let chequeToCashAmount = 0;
  let chequeToVendorAmount = 0;

  transactions.forEach(t => {
    const type = t.TransactionType || t.transactionType;
    const amt = Number(t.Amount || t.amount || 0);
    if (type === 'To Cash') {
      chequeToCashAmount += amt;
    } else if (type === 'To Vendor') {
      chequeToVendorAmount += amt;
    }
  });

  return {
    totalTransactions: transactions.length,
    chequeToCashAmount,
    chequeToVendorAmount,
  };
};
