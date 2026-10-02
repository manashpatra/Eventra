import { v4 as uuidv4 } from 'uuid';
import {
  firestoreAdd,
  firestoreUpdate,
  firestoreDelete,
  firestoreGetAll,
  firestoreGetById,
  COLLECTIONS,
} from './firebase';
import { logAudit } from './auditService';
import { queueStatsRefresh } from './dashboardStatsService';

const MEMBERS_TABLE = COLLECTIONS.CASH_MEMBERS;
const TRANSACTIONS_TABLE = COLLECTIONS.CASH_TRANSACTIONS;

/**
 * Get all members holding or eligible to hold cash.
 */
export const getAllCashMembers = async () => {
  const members = await firestoreGetAll(MEMBERS_TABLE);
  return (members || []).sort((a, b) => {
    // Sort by currentBalance descending, then by name ascending
    const balDiff = (Number(b.currentBalance) || 0) - (Number(a.currentBalance) || 0);
    if (balDiff !== 0) return balDiff;
    return (a.name || '').localeCompare(b.name || '');
  });
};

/**
 * Get a specific member by ID.
 */
export const getCashMemberById = async (id, forceRefresh = false) => {
  return firestoreGetById(MEMBERS_TABLE, id, forceRefresh);
};

/**
 * Add a new member to cash in hand.
 */
export const addCashMember = async (data, recordedBy = 'Admin') => {
  const id = uuidv4();
  const initBal = Number(data.initialBalance) || 0;
  const now = new Date().toISOString();

  const member = {
    id,
    name: (data.name || '').trim(),
    phone: (data.phone || '').trim(),
    email: (data.email || '').trim(),
    role: (data.role || 'Member').trim(),
    currentBalance: initBal,
    notes: (data.notes || '').trim(),
    status: data.status || 'Active',
    createdAt: now,
    lastTransactionAt: initBal !== 0 ? now : null,
  };

  await firestoreAdd(MEMBERS_TABLE, id, member);

  // If opening balance was provided, record an initial transaction
  if (initBal !== 0) {
    const transId = uuidv4();
    const trans = {
      id: transId,
      memberId: id,
      memberName: member.name,
      type: initBal > 0 ? 'ADD' : 'SUBTRACT',
      amount: Math.abs(initBal),
      balanceAfter: initBal,
      date: data.date || now.split('T')[0],
      reason: 'Opening Balance',
      notes: data.notes || 'Opening balance assigned on member creation',
      recordedBy: recordedBy || 'Admin',
      createdAt: now,
    };
    await firestoreAdd(TRANSACTIONS_TABLE, transId, trans);
  }

  await logAudit('CREATE', 'CashMember', id, member);
  queueStatsRefresh();
  return member;
};

/**
 * Update member profile (name, phone, role, notes, status).
 * Note: Balance adjustments should go through add/subtract transactions for full audit trail.
 */
export const updateCashMember = async (id, data) => {
  const existing = await firestoreGetById(MEMBERS_TABLE, id);
  const updateData = {
    name: (data.name !== undefined ? data.name : existing?.name || '').trim(),
    phone: (data.phone !== undefined ? data.phone : existing?.phone || '').trim(),
    email: (data.email !== undefined ? data.email : existing?.email || '').trim(),
    role: (data.role !== undefined ? data.role : existing?.role || 'Member').trim(),
    notes: (data.notes !== undefined ? data.notes : existing?.notes || '').trim(),
    status: data.status !== undefined ? data.status : existing?.status || 'Active',
    updatedAt: new Date().toISOString(),
  };

  await firestoreUpdate(MEMBERS_TABLE, id, updateData);
  await logAudit('UPDATE', 'CashMember', id, updateData);
  queueStatsRefresh();
  return { id, ...(existing || {}), ...updateData };
};

/**
 * Remove a member from cash in hand.
 */
export const deleteCashMember = async (id) => {
  const oldData = await firestoreGetById(MEMBERS_TABLE, id);
  await firestoreDelete(MEMBERS_TABLE, id);
  await logAudit('DELETE', 'CashMember', id, oldData);
  queueStatsRefresh();
  return oldData;
};

/**
 * Add cash to a member's balance.
 */
export const addMemberCash = async ({
  memberId,
  amount,
  date,
  reason,
  notes,
  recordedBy,
}) => {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const member = await firestoreGetById(MEMBERS_TABLE, memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  const currentBal = Number(member.currentBalance) || 0;
  const newBalance = currentBal + numAmount;
  const now = new Date().toISOString();
  const txDate = date || now.split('T')[0];

  const transId = uuidv4();
  const transaction = {
    id: transId,
    memberId,
    memberName: member.name,
    type: 'ADD',
    amount: numAmount,
    balanceAfter: newBalance,
    date: txDate,
    reason: reason || 'Cash Received',
    notes: notes || '',
    recordedBy: recordedBy || 'Admin',
    createdAt: now,
  };

  await firestoreAdd(TRANSACTIONS_TABLE, transId, transaction);
  await firestoreUpdate(MEMBERS_TABLE, memberId, {
    currentBalance: newBalance,
    lastTransactionAt: now,
  });

  await logAudit('ADD_CASH', 'CashTransaction', transId, transaction);
  queueStatsRefresh();

  return {
    member: { ...member, currentBalance: newBalance, lastTransactionAt: now },
    transaction,
  };
};

/**
 * Subtract cash from a member's balance.
 */
export const subtractMemberCash = async ({
  memberId,
  amount,
  date,
  reason,
  notes,
  recordedBy,
}) => {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const member = await firestoreGetById(MEMBERS_TABLE, memberId);
  if (!member) {
    throw new Error('Member not found');
  }

  const currentBal = Number(member.currentBalance) || 0;
  const newBalance = currentBal - numAmount;
  const now = new Date().toISOString();
  const txDate = date || now.split('T')[0];

  const transId = uuidv4();
  const transaction = {
    id: transId,
    memberId,
    memberName: member.name,
    type: 'SUBTRACT',
    amount: numAmount,
    balanceAfter: newBalance,
    date: txDate,
    reason: reason || 'Cash Disbursed',
    notes: notes || '',
    recordedBy: recordedBy || 'Admin',
    createdAt: now,
  };

  await firestoreAdd(TRANSACTIONS_TABLE, transId, transaction);
  await firestoreUpdate(MEMBERS_TABLE, memberId, {
    currentBalance: newBalance,
    lastTransactionAt: now,
  });

  await logAudit('SUBTRACT_CASH', 'CashTransaction', transId, transaction);
  queueStatsRefresh();

  return {
    member: { ...member, currentBalance: newBalance, lastTransactionAt: now },
    transaction,
  };
};

/**
 * Transfer cash between two members.
 */
export const transferCashBetweenMembers = async ({
  fromMemberId,
  toMemberId,
  amount,
  date,
  reason,
  notes,
  recordedBy,
}) => {
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }
  if (fromMemberId === toMemberId) {
    throw new Error('Sender and recipient members must be different');
  }

  const [fromMember, toMember] = await Promise.all([
    firestoreGetById(MEMBERS_TABLE, fromMemberId),
    firestoreGetById(MEMBERS_TABLE, toMemberId),
  ]);

  if (!fromMember || !toMember) {
    throw new Error('One or both members could not be found');
  }

  const fromNewBal = (Number(fromMember.currentBalance) || 0) - numAmount;
  const toNewBal = (Number(toMember.currentBalance) || 0) + numAmount;
  const now = new Date().toISOString();
  const txDate = date || now.split('T')[0];

  // Transfer Out Transaction
  const transIdOut = uuidv4();
  const transOut = {
    id: transIdOut,
    memberId: fromMemberId,
    memberName: fromMember.name,
    type: 'TRANSFER_OUT',
    toMemberId,
    toMemberName: toMember.name,
    amount: numAmount,
    balanceAfter: fromNewBal,
    date: txDate,
    reason: reason || `Transferred to ${toMember.name}`,
    notes: notes || '',
    recordedBy: recordedBy || 'Admin',
    createdAt: now,
  };

  // Transfer In Transaction
  const transIdIn = uuidv4();
  const transIn = {
    id: transIdIn,
    memberId: toMemberId,
    memberName: toMember.name,
    type: 'TRANSFER_IN',
    fromMemberId,
    fromMemberName: fromMember.name,
    amount: numAmount,
    balanceAfter: toNewBal,
    date: txDate,
    reason: reason || `Received from ${fromMember.name}`,
    notes: notes || '',
    recordedBy: recordedBy || 'Admin',
    createdAt: now,
  };

  await Promise.all([
    firestoreAdd(TRANSACTIONS_TABLE, transIdOut, transOut),
    firestoreAdd(TRANSACTIONS_TABLE, transIdIn, transIn),
    firestoreUpdate(MEMBERS_TABLE, fromMemberId, {
      currentBalance: fromNewBal,
      lastTransactionAt: now,
    }),
    firestoreUpdate(MEMBERS_TABLE, toMemberId, {
      currentBalance: toNewBal,
      lastTransactionAt: now,
    }),
  ]);

  await logAudit('TRANSFER_CASH', 'CashTransaction', transIdOut, {
    from: fromMember.name,
    to: toMember.name,
    amount: numAmount,
    reason,
  });

  queueStatsRefresh();

  return {
    fromMember: { ...fromMember, currentBalance: fromNewBal },
    toMember: { ...toMember, currentBalance: toNewBal },
    transOut,
    transIn,
  };
};

/**
 * Get all cash transactions (optionally filtered by memberId).
 * Sorted by transaction date descending, with createdAt descending as secondary tie-breaker.
 */
export const getAllCashTransactions = async (memberId = null) => {
  const all = await firestoreGetAll(TRANSACTIONS_TABLE);
  let list = all || [];
  if (memberId) {
    list = list.filter((t) => t.memberId === memberId);
  }
  return list.sort((a, b) => {
    const dateA = a?.date ? a.date.slice(0, 10) : (a?.transactionDate ? a.transactionDate.slice(0, 10) : '');
    const dateB = b?.date ? b.date.slice(0, 10) : (b?.transactionDate ? b.transactionDate.slice(0, 10) : '');
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    const timeA = new Date(a?.createdAt || 0).getTime();
    const timeB = new Date(b?.createdAt || 0).getTime();
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    return (b?.id || '').localeCompare(a?.id || '');
  });
};

/**
 * Update an existing cash transaction.
 * Adjusts member currentBalance if amount is modified, and keeps transfer counterpart in sync.
 */
export const updateCashTransaction = async (transactionId, updates, recordedBy = 'Admin') => {
  const trans = await firestoreGetById(TRANSACTIONS_TABLE, transactionId);
  if (!trans) throw new Error('Transaction not found');

  const oldAmount = Number(trans.amount) || 0;
  const newAmount = updates.amount !== undefined ? Number(updates.amount) : oldAmount;
  if (isNaN(newAmount) || newAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const diff = newAmount - oldAmount;
  const now = new Date().toISOString();

  // If amount changed, adjust the primary member's current balance
  if (diff !== 0) {
    const member = await firestoreGetById(MEMBERS_TABLE, trans.memberId);
    if (member) {
      const curBal = Number(member.currentBalance) || 0;
      let newBal = curBal;
      if (trans.type === 'ADD' || trans.type === 'TRANSFER_IN') {
        newBal = curBal + diff;
      } else if (trans.type === 'SUBTRACT' || trans.type === 'TRANSFER_OUT') {
        newBal = curBal - diff;
      }
      await firestoreUpdate(MEMBERS_TABLE, trans.memberId, {
        currentBalance: newBal,
        lastTransactionAt: now,
      });
    }
  }

  // Check if this is a transfer and sync the counterpart if found
  if (trans.type === 'TRANSFER_OUT' || trans.type === 'TRANSFER_IN') {
    const all = await firestoreGetAll(TRANSACTIONS_TABLE);
    const counterpart = all.find((t) =>
      t.id !== transactionId &&
      (
        (trans.type === 'TRANSFER_OUT' && t.type === 'TRANSFER_IN' && t.memberId === trans.toMemberId && t.fromMemberId === trans.memberId) ||
        (trans.type === 'TRANSFER_IN' && t.type === 'TRANSFER_OUT' && t.memberId === trans.fromMemberId && t.toMemberId === trans.memberId)
      ) &&
      Math.abs(new Date(t.createdAt).getTime() - new Date(trans.createdAt).getTime()) < 10000
    );

    if (counterpart) {
      if (diff !== 0) {
        const cpMember = await firestoreGetById(MEMBERS_TABLE, counterpart.memberId);
        if (cpMember) {
          const cpCurBal = Number(cpMember.currentBalance) || 0;
          let cpNewBal = cpCurBal;
          if (counterpart.type === 'TRANSFER_IN') {
            cpNewBal = cpCurBal + diff;
          } else if (counterpart.type === 'TRANSFER_OUT') {
            cpNewBal = cpCurBal - diff;
          }
          await firestoreUpdate(MEMBERS_TABLE, counterpart.memberId, {
            currentBalance: cpNewBal,
            lastTransactionAt: now,
          });
        }
      }

      const cpUpdates = {
        amount: newAmount,
        date: updates.date !== undefined ? updates.date : counterpart.date,
        reason: updates.reason !== undefined ? updates.reason : counterpart.reason,
        notes: updates.notes !== undefined ? updates.notes : counterpart.notes,
        balanceAfter: (counterpart.balanceAfter || 0) + (counterpart.type === 'TRANSFER_IN' ? diff : -diff),
        updatedAt: now,
        updatedBy: recordedBy,
      };
      await firestoreUpdate(TRANSACTIONS_TABLE, counterpart.id, cpUpdates);
    }
  }

  const updatedRecord = {
    ...trans,
    amount: newAmount,
    date: updates.date !== undefined ? updates.date : trans.date,
    reason: updates.reason !== undefined ? updates.reason : trans.reason,
    notes: updates.notes !== undefined ? updates.notes : trans.notes,
    balanceAfter: (trans.balanceAfter || 0) + ((trans.type === 'ADD' || trans.type === 'TRANSFER_IN') ? diff : -diff),
    updatedAt: now,
    updatedBy: recordedBy,
  };

  await firestoreUpdate(TRANSACTIONS_TABLE, transactionId, updatedRecord);
  await logAudit('UPDATE', 'CashTransaction', transactionId, { before: trans, after: updatedRecord });
  queueStatsRefresh();

  return updatedRecord;
};

/**
 * Delete / Reverse a transaction (Super Admin emergency correction).
 */
export const deleteCashTransaction = async (transactionId) => {
  const trans = await firestoreGetById(TRANSACTIONS_TABLE, transactionId);
  if (!trans) throw new Error('Transaction not found');

  // Reverse the balance impact on the member
  const member = await firestoreGetById(MEMBERS_TABLE, trans.memberId);
  if (member) {
    const curBal = Number(member.currentBalance) || 0;
    let revertedBal = curBal;
    if (trans.type === 'ADD' || trans.type === 'TRANSFER_IN') {
      revertedBal = curBal - (Number(trans.amount) || 0);
    } else if (trans.type === 'SUBTRACT' || trans.type === 'TRANSFER_OUT') {
      revertedBal = curBal + (Number(trans.amount) || 0);
    }
    await firestoreUpdate(MEMBERS_TABLE, trans.memberId, {
      currentBalance: revertedBal,
      lastTransactionAt: new Date().toISOString(),
    });
  }

  await firestoreDelete(TRANSACTIONS_TABLE, transactionId);
  await logAudit('DELETE', 'CashTransaction', transactionId, trans);
  queueStatsRefresh();
  return trans;
};

/**
 * Compute summary statistics for cash in hand.
 */
export const getCashStats = (members = [], transactions = []) => {
  let totalCashInHand = 0;
  let activeHoldersCount = 0;
  let zeroBalanceCount = 0;
  let negativeBalanceCount = 0;
  let maxBalance = -Infinity;
  let topHolder = null;

  (members || []).forEach((m) => {
    const bal = Number(m.currentBalance) || 0;
    totalCashInHand += bal;
    if (bal > 0) {
      activeHoldersCount++;
      if (bal > maxBalance) {
        maxBalance = bal;
        topHolder = m;
      }
    } else if (bal === 0) {
      zeroBalanceCount++;
    } else {
      negativeBalanceCount++;
    }
  });

  let totalAdded = 0;
  let totalSubtracted = 0;

  (transactions || []).forEach((t) => {
    const amt = Number(t.amount) || 0;
    if (t.type === 'ADD') {
      totalAdded += amt;
    } else if (t.type === 'SUBTRACT') {
      totalSubtracted += amt;
    }
  });

  return {
    totalCashInHand,
    totalMembers: (members || []).length,
    activeHoldersCount,
    zeroBalanceCount,
    negativeBalanceCount,
    totalAdded,
    totalSubtracted,
    topHolder,
  };
};
