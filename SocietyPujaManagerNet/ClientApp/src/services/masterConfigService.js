import { apiGet, apiPost } from './apiClient';

export const getMasterConfig = async (forceRefresh = false) => {
  return await apiGet('/master-config');
};

export const updateMasterConfig = async (data) => {
  return await apiPost('/master-config', data);
};

export const syncAdminEmails = async (userRoles) => {
  return await apiPost('/master-config/sync-roles', userRoles);
};

// Get meal price for specific combination
export const getMealPrice = async (dayName, mealType, foodType, serviceType) => {
  const config = await getMasterConfig();
  const dayConfig = config.foodDays?.find(d => d.dayName === dayName);
  if (!dayConfig) return 0;

  let mealConfig = dayConfig.mealPrices?.[mealType]?.[foodType];
  if (!mealConfig && (foodType === 'Chicken' || foodType === 'Mutton')) {
    mealConfig = dayConfig.mealPrices?.[mealType]?.['Non-Veg'];
  }
  if (!mealConfig) return 0;

  return mealConfig[serviceType] || 0;
};

// Get available food types for a given day and meal combination
export const getAvailableFoodTypes = (dayConfig, mealType) => {
  if (!dayConfig || !dayConfig.mealPrices || !dayConfig.mealPrices[mealType]) return ['Veg'];
  const mealConfig = dayConfig.mealPrices[mealType];
  if (mealConfig.enabled === false) return [];

  const types = [];

  if (mealConfig.splitVeg) {
    types.push('Khichuri', 'Lucchi');
  } else {
    types.push('Veg');
  }

  if (mealConfig.vegOnly) {
    return types;
  }

  if (mealConfig.splitNonVeg) {
    types.push('Chicken', 'Mutton');
  } else {
    types.push('Non-Veg');
  }

  return types;
};

// Print Assets (Digital Stamp & Signature) - stored in a dedicated record to keep main config lightweight
let cachedPrintAssets = null;

export const getPrintAssets = async (forceRefresh = false) => {
  if (cachedPrintAssets && !forceRefresh) {
    return cachedPrintAssets;
  }
  try {
    const assets = await apiGet('/master-config/print-assets');
    cachedPrintAssets = assets || {};
    return cachedPrintAssets;
  } catch (err) {
    console.warn('Could not read print assets:', err);
    return cachedPrintAssets || {};
  }
};

export const getCachedPrintAssets = () => cachedPrintAssets || {};

export const updatePrintAssets = async (data) => {
  try {
    await apiPost('/master-config/print-assets', data);
    cachedPrintAssets = { ...(cachedPrintAssets || {}), ...data };
  } catch (err) {
    console.error('Error updating print assets:', err);
    throw err;
  }
};

export const getEffectivePrintConfig = async (baseConfig = {}) => {
  const assets = await getPrintAssets();
  return {
    ...baseConfig,
    stampImage: assets.stampImage || baseConfig.stampImage,
    signatureImage: assets.signatureImage || baseConfig.signatureImage,
  };
};