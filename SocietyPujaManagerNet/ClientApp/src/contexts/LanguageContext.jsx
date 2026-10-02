import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getMasterConfig } from '../services/masterConfigService';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a safe fallback so components outside provider don't crash
    return {
      language: 'en',
      setLanguage: () => {},
      languageConfig: null,
      isLanguageSelected: true,
      markLanguageSelected: () => {},
      availableLanguages: [],
      isEnabled: false,
    };
  }
  return context;
};

const STORAGE_KEYS = {
  public: 'app_public_language',
  admin: 'app_admin_language',
};

const SELECTED_KEYS = {
  public: 'app_public_language_selected',
  admin: 'app_admin_language_selected',
};

// ------ Google Translate helpers ------

let googleTranslateLoaded = false;
let googleTranslateInitialized = false;

// Clear any stale reload guard from a previous session
try { sessionStorage.removeItem('_gt_reload_done'); } catch { /* no-op */ }

/**
 * Set the googtrans cookie.
 * Google Translate reads this cookie on initialisation to decide which
 * language to translate to — so we set it BEFORE loading the script.
 */
const setGoogleTranslateCookie = (langCode) => {
  const domain = window.location.hostname;
  if (!langCode || langCode === 'en') {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  } else {
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${langCode}; path=/`;
  }
};

const loadGoogleTranslateScript = () => {
  return new Promise((resolve) => {
    if (googleTranslateLoaded) {
      resolve();
      return;
    }

    // Create the hidden element Google Translate needs
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    window.googleTranslateElementInit = () => {
      if (googleTranslateInitialized) return;
      googleTranslateInitialized = true;
      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,bn,ta,te,mr,gu,kn,ml,pa,ur',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      } catch (e) {
        console.warn('Google Translate init error:', e);
      }
      resolve();
    };

    const script = document.createElement('script');
    script.src =
      '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    script.onerror = () => {
      console.warn('Google Translate script failed to load');
      resolve();
    };
    document.head.appendChild(script);
    googleTranslateLoaded = true;
  });
};

/**
 * Change Google Translate language.
 *
 * Strategy:
 *  1. Set the cookie immediately (always safe, no side-effects).
 *  2. Poll for the .goog-te-combo select element that Google Translate
 *     injects — once found, programmatically switch it (instant, no reload).
 *  3. If the combo never appears within ~4 s, do ONE reload.
 *     The cookie is already set, so after the reload GT will initialise
 *     with the correct language.  A sessionStorage flag prevents loops.
 */
const changeGoogleTranslateLanguage = (langCode) => {
  setGoogleTranslateCookie(langCode);

  let attempts = 0;
  const maxAttempts = 5; // 5 × 100 ms = 500 ms wait max

  const tryCombo = () => {
    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode === 'en' ? '' : langCode;
      selectEl.dispatchEvent(new Event('change'));
      return; // Done — no reload needed
    }

    attempts += 1;
    if (attempts < maxAttempts) {
      setTimeout(tryCombo, 100);
    } else {
      // Last resort — reload once. Cookie is already set.
      const flag = '_gt_reload_done';
      try {
        if (sessionStorage.getItem(flag)) {
          // Already reloaded once for this change — give up to avoid loop
          sessionStorage.removeItem(flag);
          return;
        }
        sessionStorage.setItem(flag, '1');
      } catch { /* no-op */ }
      window.location.reload();
    }
  };

  tryCombo();
};

// ------ React Context ------

/**
 * LanguageProvider — wraps a section of the app to provide multilingual support.
 * @param {'public'|'admin'} mode — determines which Firestore config to use
 */
export const LanguageProvider = ({ mode = 'public', children }) => {
  const storageKey = STORAGE_KEYS[mode] || STORAGE_KEYS.public;
  const selectedKey = SELECTED_KEYS[mode] || SELECTED_KEYS.public;

  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem(storageKey) || 'en';
    } catch {
      return 'en';
    }
  });

  const [languageConfig, setLanguageConfig] = useState(null);
  const [isLanguageSelected, setIsLanguageSelected] = useState(() => {
    try {
      return localStorage.getItem(selectedKey) === 'true';
    } catch {
      return false;
    }
  });

  const configLoadedRef = useRef(false);

  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;

    // Clear the one-shot reload guard on every fresh page load
    try { sessionStorage.removeItem('_gt_reload_done'); } catch { /* no-op */ }

    const loadConfig = async () => {
      try {
        const config = await getMasterConfig();
        const langConfig =
          mode === 'admin' ? config.adminLanguages : config.publicLanguages;

        if (langConfig) {
          setLanguageConfig(langConfig);

          if (langConfig.enabled) {
            // Determine which language to apply
            const savedLang = localStorage.getItem(storageKey);
            const langToApply = savedLang || langConfig.defaultLanguage || 'en';

            // Always update the cookie to match this section's language
            setGoogleTranslateCookie(langToApply);

            await loadGoogleTranslateScript();

            // Force Google Translate widget to switch to the correct language.
            // This is crucial for SPAs when navigating between Public (e.g. Hindi)
            // and Admin (e.g. English) without a full page reload.
            setTimeout(() => {
              const selectEl = document.querySelector('.goog-te-combo');
              const targetVal = langToApply === 'en' ? '' : langToApply;
              if (selectEl && selectEl.value !== targetVal) {
                selectEl.value = targetVal;
                selectEl.dispatchEvent(new Event('change'));
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.warn('Error loading language config:', error);
      }
    };

    loadConfig();
  }, [mode, storageKey]);

  // Called when user explicitly changes language (from switcher or dialog)
  const setLanguage = useCallback(
    (langCode) => {
      setLanguageState(langCode);
      try {
        localStorage.setItem(storageKey, langCode);
      } catch {
        // localStorage may be unavailable
      }
      changeGoogleTranslateLanguage(langCode);
    },
    [storageKey]
  );

  const markLanguageSelected = useCallback(() => {
    setIsLanguageSelected(true);
    try {
      localStorage.setItem(selectedKey, 'true');
    } catch {
      // localStorage may be unavailable
    }
  }, [selectedKey]);

  const availableLanguages = languageConfig?.languages || [];
  const isEnabled = languageConfig?.enabled === true && availableLanguages.length > 1;

  const value = {
    language,
    setLanguage,
    languageConfig,
    isLanguageSelected,
    markLanguageSelected,
    availableLanguages,
    isEnabled,
  };

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export default LanguageContext;
