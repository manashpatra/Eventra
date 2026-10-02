let deferredPrompt = null;
let isAppInstallable = false;
let listeners = [];

export const getDeferredPrompt = () => deferredPrompt;

export const getIsInstallable = () => isAppInstallable;

export const subscribeToInstallPrompt = (listener) => {
  listeners.push(listener);
  listener(isAppInstallable);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(listener => listener(isAppInstallable));
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  isAppInstallable = true;
  notifyListeners();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  isAppInstallable = false;
  notifyListeners();
});
