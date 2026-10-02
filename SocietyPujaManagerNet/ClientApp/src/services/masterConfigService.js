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
