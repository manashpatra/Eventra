export const isIOSDevice = () => {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  
  // Standard iOS check
  if (/iPad|iPhone|iPod/i.test(userAgent) && !window.MSStream) {
    return true;
  }
  
  // iPadOS 13+ check (disguises as Mac OS)
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) {
    return true;
  }
  
  return false;
};

export const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

