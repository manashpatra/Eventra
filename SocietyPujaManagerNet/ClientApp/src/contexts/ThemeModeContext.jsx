import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getAppTheme } from '../theme/theme';
import { surface } from '../theme/colorTokens';

const THEME_STORAGE_KEY = 'app_theme_mode';

const ThemeModeContext = createContext(null);

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    return {
      mode: 'dark',
      isDark: true,
      toggleTheme: () => {},
      setMode: () => {},
    };
  }
  return context;
};

const getInitialMode = () => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Check system preference with dark fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch (e) {
    console.warn('Error reading theme from localStorage:', e);
  }
  return 'dark';
};

export const ThemeModeProvider = ({ children }) => {
  const [mode, setModeState] = useState(getInitialMode);

  const setMode = useCallback((newMode) => {
    if (newMode === 'light' || newMode === 'dark') {
      setModeState(newMode);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newMode);
      } catch (e) {
        console.warn('Error saving theme to localStorage:', e);
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {
        console.warn('Error saving theme to localStorage:', e);
      }
      return next;
    });
  }, []);

  // Sync with other browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === THEME_STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
        setModeState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Update HTML data attributes and meta theme-color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.style.colorScheme = mode;

    if (mode === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', mode === 'dark' ? surface.bgDark : surface.bgLight);
    }
  }, [mode]);

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleTheme,
      setMode,
    }),
    [mode, toggleTheme, setMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export default ThemeModeContext;
