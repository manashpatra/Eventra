import { v4 as uuidv4 } from 'uuid';
import {
  firestoreAdd,
  firestoreUpdate,
  firestoreDelete,
  firestoreGetAll,
  firestoreGetById,
  firestoreQuery,
  COLLECTIONS,
  savePaymentProof,
  deletePaymentProof,
  compressImageFile
} from './firebase';
import { logAudit } from './auditService';
import { queueStatsRefresh } from './dashboardStatsService';
import { generateMatchingFlats } from '../utils/flatHelper';

const TABLE = COLLECTIONS.SOUVENIRS;

// Create a new souvenir entry (ad/poem contribution for the Puja booklet)
export const createSouvenir = async (data, proofFiles = []) => {
  const id = uuidv4();
  const souvenir = {
    id,
    residentId: data.residentId || null,
    residentName: data.residentName || '',
    flatNumber: data.flatNumber || '',
    donorName: data.donorName || data.residentName || '',
    amount: data.amount || 0,
    paymentMode: data.paymentMode || 'Cash',
    paymentProofUrl: null,
    remarks: data.remarks || '',
    transactionDate: data.transactionDate || new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const newProofs = [];
  if (proofFiles && proofFiles.length > 0) {
    try {
      for (const file of proofFiles) {
        const compressed = await compressImageFile(file);
        newProofs.push(compressed);
      }
    } catch (error) {
      console.error('Image compression failed:', error);
    }
  }

  if (newProofs.length > 0) {
    await savePaymentProof(id, newProofs);
    souvenir.paymentProofUrl = `paymentProofs/${id}`;
  }

  await firestoreAdd(TABLE, id, souvenir);
  await logAudit('CREATE', 'Souvenir', id, souvenir);
  queueStatsRefresh();
  return souvenir;
};

export const updateSouvenir = async (id, data, proofFiles = [], existingProofs = []) => {
  const updateData = { ...data };
  
  const newProofs = [];
  if (proofFiles && proofFiles.length > 0) {
    try {
      for (const file of proofFiles) {
        const compressed = await compressImageFile(file);
        newProofs.push(compressed);
      }
    } catch (error) {
      console.error('Image compression failed:', error);
    }
  }

  const combinedProofs = [...existingProofs, ...newProofs];

  if (combinedProofs.length > 0) {
    await savePaymentProof(id, combinedProofs);
    updateData.paymentProofUrl = `paymentProofs/${id}`;
  } else {
    await deletePaymentProof(id);
    updateData.paymentProofUrl = null;
  }

  await firestoreUpdate(TABLE, id, updateData);
  await logAudit('UPDATE', 'Souvenir', id, updateData);
  queueStatsRefresh();
  return { id, ...updateData };
};

// Delete souvenir
export const deleteSouvenir = async (id) => {
  const oldData = await firestoreGetById(TABLE, id);
  await firestoreDelete(TABLE, id);
  await deletePaymentProof(id);
  await logAudit('DELETE', 'Souvenir', id, oldData);
  queueStatsRefresh();
};

// Get all souvenirs
export const getAllSouvenirs = async () => {
  return firestoreGetAll(TABLE);
};

// Get souvenir stats
export const getSouvenirStats = async (existingSouvenirs = null) => {
  const all = existingSouvenirs || await firestoreGetAll(TABLE);
  const totalAmount = all.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const cashAmount = all
    .filter((d) => d.paymentMode && d.paymentMode.toLowerCase() === 'cash')
    .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const bankAmount = totalAmount - cashAmount;
  return {
    totalSouvenirs: all.length,
    totalAmount,
    cashAmount,
    bankAmount,
  };
};

// Search souvenirs dynamically to avoid full collection reads
export const searchSouvenirsByFilters = async (searchTerm, hasDate, fetchAll) => {
  try {
    let results = [];
    const term = (searchTerm || '').trim();
    const hasSearchTerm = term.length > 0;
    const isFlatSearch = hasSearchTerm && /^[0-9]/.test(term);

    if (fetchAll || (!hasSearchTerm && hasDate)) {
      return await firestoreGetAll(TABLE);
    }

    if (!hasSearchTerm) {
      return [];
    }

    if (isFlatSearch) {
      if (term.length >= 3) {
        const permutations = generateMatchingFlats(term);
        // Firestore 'in' query supports max 30 items.
        const chunks = [];
        for (let i = 0; i < permutations.length; i += 30) {
          chunks.push(permutations.slice(i, i + 30));
        }
        
        const queryPromises = chunks.map(chunk => 
          firestoreQuery(TABLE, 'flatNumber', 'in', chunk)
        );
        
        const chunkResults = await Promise.all(queryPromises);
        
        const uniqueSouvenirs = new Map();
        chunkResults.flat().forEach(d => uniqueSouvenirs.set(d.id, d));
        results = Array.from(uniqueSouvenirs.values());
      } else {
        return [];
      }
    } else {
      // Name search
      results = await firestoreGetAll(TABLE);
    }
    
    return results;
  } catch (error) {
    console.error('Error searching souvenirs:', error);
    return [];
  }
};
