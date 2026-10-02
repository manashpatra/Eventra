import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { createDonation } from './donationService';
import { standardizeFlat } from '../utils/flatHelper';

export const getAllCulturalEvents = async () => await apiGet('/cultural-events') || [];
export const getActiveCulturalEvents = async () => {
  const all = await getAllCulturalEvents();
  return all.filter(e => e.Active !== false && e.active !== false);
};
export const getCulturalEventStats = async (id) => await apiGet(`/cultural-events/${id}/stats`);
export const createCulturalEvent = async (data) => await apiPost('/cultural-events', data);
export const updateCulturalEvent = async (id, data) => await apiPut(`/cultural-events/${id}`, data);
export const deleteCulturalEvent = async (id) => await apiDelete(`/cultural-events/${id}`);

export const getAllCulturalApplications = async () => await apiGet('/cultural-applications') || [];
export const getApplicationsByEvent = async (eventId) => await apiGet(`/cultural-applications/by-event/${eventId}`) || [];
export const getApplicationsForEvent = getApplicationsByEvent;

export const getApplicationsByFlat = async (flatNumber) => await apiGet(`/cultural-applications/by-flat/${flatNumber}`) || [];
export const getCulturalApplicationsByFlat = getApplicationsByFlat;

export const submitCulturalApplication = async (data) => await apiPost('/cultural-applications', data);
export const createCulturalApplication = submitCulturalApplication;
export const deleteCulturalApplication = async (id) => await apiDelete(`/cultural-applications/${id}`);
export const updateCulturalApplication = async (id, data) => await apiPut(`/cultural-applications/${id}`, data);
export const updateApplicationComment = async (id, comment) => await apiPut(`/cultural-applications/${id}`, { comment });

export const verifyEventPayment = async (appId, appData, eventData, paymentMode = 'UPI', paymentReference = '', verifiedBy = '') => {
  const standardFlatNumber = standardizeFlat(appData.flatNumber);
  const remarks = `Event Payment: ${eventData.title || ''} (Ref: ${eventData.paymentPrefix || 'Event_'}${standardFlatNumber})${paymentReference ? ` - ${paymentReference}` : ''}`;
  
  // 1. Create a donation record
  const donationData = {
    flatNumber: standardFlatNumber,
    residentName: appData.participantName || '',
    amount: appData.amountPaid || 0,
    paymentMode: paymentMode,
    remarks: remarks,
  };
  await createDonation(donationData, []);

  // 2. Mark application as admin verified
  const updateData = { adminPaymentConfirmed: true, paymentMode, paymentReference, paymentVerifiedBy: verifiedBy };
  await updateCulturalApplication(appId, updateData);
  
  return updateData;
};

export const batchUpdateApplications = async (operations) => {
  for (const op of operations) {
    if (op.id && op.data) {
      await updateCulturalApplication(op.id, op.data);
    }
  }
};
