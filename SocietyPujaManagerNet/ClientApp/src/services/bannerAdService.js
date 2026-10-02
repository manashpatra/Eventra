import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { compressImageFile } from './firebase';

export const SLOT_DIMENSIONS = {
  'hero_banner': { width: 1200, height: 400 },
  'hero-top': { width: 1200, height: 300 },
  'hero-bottom': { width: 1200, height: 300 },
  'between-sections': { width: 1200, height: 250 },
  'footer': { width: 1200, height: 200 },
  'sidebar_ad': { width: 300, height: 250 },
  'footer_sponsor': { width: 728, height: 90 },
};

export const getAllBannerAds = async () => await apiGet('/banner-ads') || [];
export const getActiveBannerAds = async (slot = null) => await apiGet(`/banner-ads/active${slot ? `?slot=${slot}` : ''}`) || [];

export const saveBannerAd = async (ad) => {
  if (ad.id) {
    return await apiPut(`/banner-ads/${ad.id}`, ad);
  }
  return await apiPost('/banner-ads', ad);
};

export const createBannerAd = async (data) => await apiPost('/banner-ads', data);
export const updateBannerAd = async (id, data) => await apiPut(`/banner-ads/${id}`, data);
export const deleteBannerAd = async (id) => await apiDelete(`/banner-ads/${id}`);
export const compressBannerImage = async (file) => await compressImageFile(file, { maxWidth: 1200, maxHeight: 400, quality: 0.8, maxSizeMB: 0.5 });
