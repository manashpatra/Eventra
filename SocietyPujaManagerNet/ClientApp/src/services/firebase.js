import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';

export const isConfigured = true;

export const auth = {
  currentUser: null
};

export const signIn = async (email, password) => {
  const res = await apiPost('/auth/login', { email, password });
  if (res && res.token) {
    localStorage.setItem('jwt_token', res.token);
    localStorage.setItem('user_info', JSON.stringify({ email: res.email, roles: res.roles }));
  }
  return res;
};

export const signOut = async () => {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem('user_info');
};

export const onAuthChange = (callback) => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('user_info');
  if (token && user) {
    try {
      callback(JSON.parse(user));
    } catch {
      callback(null);
    }
  } else {
    callback(null);
  }
  return () => {}; // Unsubscribe noop
};

export const COLLECTIONS = {
  RESIDENTS: 'residents',
  DONATIONS: 'donations',
  SPONSORSHIPS: 'sponsorships',
  FOOD_COUPONS: 'food-coupons',
  DRAFT_CARTS: 'draft-carts',
  EXPENSES: 'expenses',
  CHEQUE_TRANSACTIONS: 'cheque-transactions',
  CULTURAL_EVENTS: 'cultural-events',
  CULTURAL_APPLICATIONS: 'cultural-applications',
  BANNER_ADS: 'banner-ads',
  VENDORS: 'vendors',
  LEADS: 'leads',
  NOTIFICATIONS: 'notifications',
  FEEDBACK: 'feedback',
  MASTER_CONFIG: 'master-config',
  CASH_MEMBERS: 'cashMembers',
  CASH_TRANSACTIONS: 'cashTransactions',
  SOUVENIRS: 'souvenirs',
};

export const firestoreAdd = async (collectionName, id, data) => {
  const endpoint = `/${collectionName}`;
  return await apiPost(endpoint, { id, ...data });
};

export const firestoreUpdate = async (collectionName, id, data) => {
  const endpoint = `/${collectionName}/${id}`;
  return await apiPut(endpoint, data);
};

export const firestoreDelete = async (collectionName, id) => {
  const endpoint = `/${collectionName}/${id}`;
  return await apiDelete(endpoint);
};

export const firestoreGetAll = async (collectionName) => {
  const endpoint = `/${collectionName}`;
  return await apiGet(endpoint) || [];
};

export const firestoreGetById = async (collectionName, id) => {
  const endpoint = `/${collectionName}/${id}`;
  return await apiGet(endpoint);
};

export const firestoreQuery = async (collectionName, field, operator, value) => {
  const all = await firestoreGetAll(collectionName);
  if (!field) return all;
  return all.filter(item => {
    if (operator === '==' || operator === '===') return item[field] === value;
    return true;
  });
};

export const firestoreBatchWrite = async (operations = []) => {
  for (const op of operations) {
    if (op.type === 'set' || op.type === 'add') {
      await firestoreAdd(op.collectionName, op.id, op.data);
    } else if (op.type === 'update') {
      await firestoreUpdate(op.collectionName, op.id, op.data);
    } else if (op.type === 'delete') {
      await firestoreDelete(op.collectionName, op.id);
    }
  }
};

export const firestoreListen = (collectionName, callback) => {
  firestoreGetAll(collectionName).then(data => callback(data)).catch(() => callback([]));
  return () => {};
};

export const createSecondaryAuthUser = async (email, password) => {
  return await apiPost('/auth/register', { email, password, role: 'User' });
};

export const compressImageFile = async (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    maxSizeMB = 0.5
  } = options;

  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    if (typeof file === 'string') return resolve(file); // Already base64 or url
    if (file.size <= maxSizeMB * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const uploadFile = async (path, file) => {
  if (!file) return '';
  return await compressImageFile(file);
};

export const savePaymentProof = async (recordId, base64Images) => {
  const images = Array.isArray(base64Images) ? base64Images : [base64Images];
  return await apiPost(`/payment-proofs/${recordId}`, images);
};

export const getPaymentProof = async (recordId, fallbackUrl = null) => {
  try {
    const images = await apiGet(`/payment-proofs/${recordId}`);
    if (images && images.length > 0) return images[0];
    return fallbackUrl;
  } catch {
    return fallbackUrl;
  }
};

export const deletePaymentProof = async (recordId) => {
  return await apiDelete(`/payment-proofs/${recordId}`);
};
