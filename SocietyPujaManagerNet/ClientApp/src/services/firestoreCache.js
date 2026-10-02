// Memory cache helper for SPA
const memoryCache = new Map();

export const dedupePromise = (key, fetcher) => fetcher();
export const getCachedAll = (collectionName) => memoryCache.get(`all_${collectionName}`) || null;
export const getCachedById = (collectionName, docId) => memoryCache.get(`${collectionName}_${docId}`) || null;
export const setCachedAll = (collectionName, data) => memoryCache.set(`all_${collectionName}`, data);
export const setCachedById = (collectionName, docId, data) => memoryCache.set(`${collectionName}_${docId}`, data);
export const invalidateCache = (collectionName) => {
  for (const key of memoryCache.keys()) {
    if (key.startsWith(collectionName) || key.startsWith(`all_${collectionName}`)) {
      memoryCache.delete(key);
    }
  }
};
export const invalidateAll = () => memoryCache.clear();
