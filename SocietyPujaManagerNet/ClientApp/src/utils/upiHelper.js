import { isIOSDevice } from './deviceUtils';
import { upiAppPalette } from '../theme/colorTokens';

/**
 * UPI Payment Utility
 * Builds UPI intent URIs and detects mobile devices.
 */

const UPI_CURRENCY = 'INR';

/**
 * Build a UPI deep-link URL.
 * @param {Object} opts
 * @param {number|string} [opts.amount]  – amount in INR (omit for open-amount)
 * @param {string}        opts.flatNumber – display flat number e.g. "10/4B"
 * @param {'subscription'|'donation'|'food'|'sponsor'} opts.mode
 * @param {string}        opts.pa – UPI payee address (from config)
 * @param {string}        opts.pn – UPI payee name (from config)
 * @returns {string} upi://pay?... URI
 */
export const buildUpiUrl = ({ amount, flatNumber, mode = 'donation', pa, pn, tn, mc }) => {

  const safeFlat = String(flatNumber || '').replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  const suffix = String(tn || '').replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  const finalTn = mode === 'subscription'
    ? `${safeFlat} SUBSCRIPTION ${suffix}`
    : mode === 'food'
      ? `${safeFlat} FOOD ${suffix}`
      : mode === 'sponsor'
        ? `SPONSOR ${suffix}`
        : mode === 'event'
          ? `${safeFlat} EVENT ${suffix}`
          : `${safeFlat} DONATION ${suffix}`;

  const cleanTn = finalTn.replace(/\s+/g, ' ').trim().substring(0, 40);

  const params = [];
  params.push(['pa', String(pa || '').trim()]);

  // Clean Payee Name to avoid encoding issues in GPay/PhonePe
  const cleanPn = String(pn || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  params.push(['pn', cleanPn]);

  params.push(['cu', UPI_CURRENCY]);

  if (cleanTn) {
    params.push(['tn', cleanTn]);
  }

  if (mc) {
    params.push(['mc', String(mc).trim()]);
    // Only include transaction reference (tr) if merchant code (mc) is present.
    // GPay and PhonePe will block P2P payments if 'tr' is provided.
    const finalTr = `${safeFlat.replace(/\s/g, '')}${mode.substring(0, 3)}${Date.now().toString(36)}`.replace(/[^a-z0-9]/gi, '').toLowerCase();
    params.push(['tr', String(finalTr).trim().substring(0, 35)]);
  }

  // Amount must be formatted to 2 decimal places for PhonePe and GPay to accept it reliably
  if (amount && Number(amount) > 0) {
    params.push(['am', Number(amount).toFixed(2)]);
  }

  // Build query string manually using encodeURIComponent (%20 for spaces)
  // URLSearchParams encodes spaces as '+' which some UPI apps don't handle
  const query = params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');

  const upiIntentUrl = `upi://pay?${query}`;
  //console.log('UPI Intent:', upiIntentUrl);
  return upiIntentUrl;
};

/**
 * Detect whether the current device is a mobile / touch device.
 * Uses a combination of user-agent sniffing + touch capability detection.
 * @returns {boolean}
 */
export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || navigator.vendor || '';
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;

  const hasTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  return mobileRegex.test(ua) || (hasTouch && window.innerWidth < 768);
};

export const UPI_APPS = [
  { id: 'gpay', name: 'GPay', color: upiAppPalette.gpay.color, textColor: upiAppPalette.gpay.text, androidPackage: 'com.google.android.apps.nbu.paisa.user', iosScheme: 'gpay://upi/pay', iconUrl: 'https://www.gstatic.com/devrel-devsite/prod/v544324a32f4e1e28baf5bd35dca83b6157fef32c5ffbe146b7ca395602e11426/developers/images/favicon-new.png', live: false, requiresQrFallback: true },
  { id: 'phonepe', name: 'PhonePe', color: upiAppPalette.phonepe.color, textColor: upiAppPalette.phonepe.text, androidPackage: 'com.phonepe.app', iosScheme: 'phonepe://pay', iconUrl: 'https://business.phonepe.com/website-static/favicon.png', live: false, requiresQrFallback: true },
  { id: 'paytm', name: 'Paytm', color: upiAppPalette.paytm.color, textColor: upiAppPalette.paytm.text, androidPackage: 'net.one97.paytm', iosScheme: 'paytmmp://pay', iconUrl: 'https://paytm.com/favicon.ico', live: false },
  { id: 'bhim', name: 'BHIM', color: upiAppPalette.bhim.color, textColor: upiAppPalette.bhim.text, androidPackage: 'in.org.npci.upiapp', iosScheme: 'bhim://pay', iconUrl: 'https://www.npci.org.in/favicons.ico', live: false },
  { id: 'cred', name: 'CRED', color: upiAppPalette.cred.color, textColor: upiAppPalette.cred.text, androidPackage: 'com.dreamplug.androidapp', iosScheme: 'credpay://upi/pay', iconUrl: 'https://cdn.brandfetch.io/id27bJP5LK/w/400/h/400/theme/dark/icon.jpeg?c=1dxbfHSJFAPEGdCLU4o5B', live: true },
  { id: 'amazon', name: 'Amazon', color: upiAppPalette.amazon.color, textColor: upiAppPalette.amazon.text, androidPackage: 'in.amazon.mShop.android.shopping', iosScheme: 'amazonpay://upi/pay', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg', live: false },
  { id: 'supermoney', name: 'Super', color: upiAppPalette.supermoney.color, textColor: upiAppPalette.supermoney.text, androidPackage: 'money.super.payments', iosScheme: 'supermoney://upi/pay', live: false },
];

export const getIntentUrl = (app, upiUrl, isTestPage = false) => {
  if (!upiUrl) return '';
  const query = upiUrl.split('?')[1];
  
  if (isTestPage) {
    // For test page, use direct URI schemes on both Android and iOS 
    // to bypass webview blocking
    if (app.iosScheme) {
      return `${app.iosScheme}?${query}`;
    }
    return `upi://pay?${query}`;
  }
  
  const isIOS = isIOSDevice();
  if (isIOS) {
    return `${app.iosScheme}?${query}`;
  }
  return `intent://pay?${query}#Intent;scheme=upi;package=${app.androidPackage};end`;
};
