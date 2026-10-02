import React from 'react';
import { IconButton, Tooltip, Typography, Box, MenuItem } from '@mui/material';
import {
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeModeContext';
import { brand, border, overlay } from '../theme/colorTokens';

const ThemeToggle = ({ variant = 'button', onClick, sx = {} }) => {
  const { mode, isDark, toggleTheme } = useThemeMode();

  const handleToggle = (e) => {
    toggleTheme();
    if (onClick) onClick(e);
  };

  const tooltipTitle = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  const accentColor = isDark ? brand.gold : brand.orangeDark;

  if (variant === 'menuitem') {
    return (
      <MenuItem
        onClick={handleToggle}
        sx={{
          py: 0.45,
          px: 1.25,
          borderRadius: '6px',
          minHeight: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          transition: 'all 0.15s ease-in-out',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
          ...sx,
        }}
      >
        {isDark ? (
          <LightModeIcon sx={{ fontSize: 18, color: brand.orange }} />
        ) : (
          <DarkModeIcon sx={{ fontSize: 18, color: brand.gold }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.primary' }}>
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </Typography>
      </MenuItem>
    );
  }

  return (
    <Tooltip title={tooltipTitle} enterTouchDelay={50} arrow>
      <IconButton
        onClick={handleToggle}
        size="small"
        aria-label={tooltipTitle}
        sx={{
          ml: 0.5,
          color: accentColor,
          border: `1px solid ${border.goldSubtle(isDark)}`,
          borderRadius: '6px',
          px: 0.9,
          py: 0.5,
          gap: 0.5,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: overlay.goldLight(isDark),
            borderColor: border.goldStrong(isDark),
            transform: 'scale(1.04)',
          },
          '&:active': {
            transform: 'scale(0.96)',
          },
          ...sx,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)',
          }}
        >
          {isDark ? (
            <LightModeIcon sx={{ fontSize: 16 }} />
          ) : (
            <DarkModeIcon sx={{ fontSize: 16 }} />
          )}
        </Box>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 700,
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: accentColor,
            display: { xs: 'none', md: 'block' },
            userSelect: 'none',
          }}
        >
          {isDark ? 'Light' : 'Dark'}
        </Typography>
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
