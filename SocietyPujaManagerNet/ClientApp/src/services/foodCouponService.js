import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const getAllFoodCoupons = async () => await apiGet('/food-coupons') || [];
export const getFoodCouponById = async (id) => await apiGet(`/food-coupons/${id}`);

export const getAllFoodCouponDocs = async () => await apiGet('/food-coupons/flat-docs') || [];
export const getFoodCouponDocById = async (id) => await apiGet(`/food-coupons/doc/${id}`);
export const getFoodCouponsDocByFlat = async (flatNumber) => await apiGet(`/food-coupons/by-flat/${flatNumber}`);

export const getFoodCouponEntry = async (flatDocId, couponId) => {
  return await apiGet(`/food-coupons/entry/${flatDocId}/${couponId}`);
};

export const createFoodCoupon = async (data) => await apiPost('/food-coupons', data);

export const issueOnlineFoodCoupon = async (payload) => {
  return await apiPost('/food-coupons/issue-online', payload);
};

export const validateAccessCode = async (flatNumber, accessCode) => {
  try {
    return await apiPost('/food-coupons/validate-access-code', { flatNumber, accessCode });
  } catch {
    return null;
  }
};

export const updateAccessCode = async (flatDocId, newAccessCode, flatNumber = '') => {
  return await apiPost('/food-coupons/update-access-code', { flatDocId, accessCode: newAccessCode, flatNumber });
};

export const updateFoodCoupon = async (flatDocIdOrId, couponIdOrData, updateData = null) => {
  if (updateData !== null) {
    // Called as updateFoodCoupon(flatDocId, couponId, updateData)
    return await apiPut(`/food-coupons/${flatDocIdOrId}/${couponIdOrData}`, updateData);
  }
  // Called as updateFoodCoupon(id, data)
  return await apiPut(`/food-coupons/${flatDocIdOrId}`, couponIdOrData);
};

export const deleteFoodCoupon = async (flatDocIdOrId, couponId = null) => {
  if (couponId) {
    return await apiDelete(`/food-coupons/${flatDocIdOrId}/${couponId}`);
  }
  return await apiDelete(`/food-coupons/${flatDocIdOrId}`);
};

export const redeemOnlineCoupon = async (flatDocId, couponEntryId, redeemedBy = '') => {
  return await apiPost(`/food-coupons/${couponEntryId}/redeem`, { redeemedBy });
};

export const serveFoodCoupon = async (couponId, field, count = 1, servedBy = 'Admin') => {
  return await apiPost(`/food-coupons/${couponId}/serve`, { field, count, servedBy });
};

export const calculateCouponTotal = (normalDineOut = 0, normalParcel = 0, additionalDineOut = 0, additionalParcel = 0, normalPrice = 0, additionalPrice = 0, packingCharge = 0) => {
  if (typeof normalDineOut === 'object' && normalDineOut !== null) {
    const selections = normalDineOut;
    const masterConfig = normalParcel;
    let total = 0;
    if (!masterConfig || !masterConfig.foodDays) return 0;
    for (const [day, types] of Object.entries(selections)) {
      const dayConfig = masterConfig.foodDays.find(d => d.date === day);
      if (!dayConfig) continue;
      for (const [type, quantity] of Object.entries(types)) {
        const price = type === 'veg' ? dayConfig.vegPrice : dayConfig.nonVegPrice;
        total += (price || 0) * (quantity || 0);
      }
    }
    return total;
  }
  const normalTotal = (Number(normalDineOut || 0) + Number(normalParcel || 0)) * Number(normalPrice || 0);
  const additionalTotal = (Number(additionalDineOut || 0) + Number(additionalParcel || 0)) * Number(additionalPrice || 0);
  const parcelCount = Number(normalParcel || 0) + Number(additionalParcel || 0);
  const packingTotal = parcelCount * Number(packingCharge || 0);
  return normalTotal + additionalTotal + packingTotal;
};

export const getFoodCouponsByResident = async (residentId, existingCoupons = null) => {
  const all = existingCoupons || (await getAllFoodCoupons());
  return all.filter(c => (c.ResidentId || c.residentId) === residentId);
};

export const getFoodCouponStats = async (existingCoupons = null) => {
  const all = existingCoupons || (await getAllFoodCoupons());
  let totalAmount = 0;
  let cashAmount = 0;
  all.forEach(c => {
    const amt = Number(c.TotalAmount || c.totalAmount || 0);
    totalAmount += amt;
    const mode = (c.PaymentMode || c.paymentMode || '');
    if (mode.toLowerCase() === 'cash') {
      cashAmount += amt;
    } else if (mode === 'Cash + UPI') {
      cashAmount += Number(c.MixedCashAmount || c.mixedCashAmount || 0);
    }
  });
  return {
    totalCount: all.length,
    totalAmount,
    cashAmount,
    bankAmount: Math.max(0, totalAmount - cashAmount)
  };
};
