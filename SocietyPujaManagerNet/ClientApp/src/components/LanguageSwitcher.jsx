import React, { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Translate as TranslateIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { brand, surface, text, border, overlay, gradient, shadow } from '../theme/colorTokens';

// Removed LANG_FLAGS as Windows doesn't render country flags natively

const LanguageSwitcher = () => {
  const {
    language,
    setLanguage,
    availableLanguages,
    isEnabled,
  } = useLanguage();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Don't render if disabled or only one language
  if (!isEnabled || availableLanguages.length <= 1) {
    return null;
  }

  const currentLang = availableLanguages.find((l) => l.code === language) ||
    availableLanguages[0];
  const accentColor = isDark ? brand.gold : brand.orangeDark;

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (langCode) => {
    handleClose();
    if (langCode !== language) {
      setLanguage(langCode);
    }
  };

  return (
    <>
      <Tooltip title="Change Language" enterTouchDelay={50}>
        <IconButton
          className="notranslate"
          onClick={handleOpen}
          size="small"
          sx={{
            ml: 0.5,
            color: accentColor,
            border: `1px solid ${border.goldSubtle(isDark)}`,
            borderRadius: '6px',
            px: 1,
            py: 0.5,
            gap: 0.5,
            transition: 'all 0.2s ease',
            '&:hover': {
              background: overlay.goldLight(isDark),
              borderColor: isDark ? 'rgba(255,179,0,0.4)' : 'rgba(230,81,0,0.4)',
            },
          }}
        >
          <TranslateIcon sx={{ fontSize: 16 }} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              color: accentColor,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {currentLang?.nativeLabel || 'EN'}
          </Typography>
        </IconButton>
      </Tooltip>

      <Menu
        className="notranslate"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 1.5,
              background: isDark ? gradient.menuDark : surface.paperLight,
              border: `1px solid ${border.divider(isDark)}`,
              boxShadow: shadow.menu(isDark),
              minWidth: 150,
              overflow: 'visible',
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 24,
                width: 10,
                height: 10,
                bgcolor: surface.menu(isDark),
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderTop: `1px solid ${border.divider(isDark)}`,
                borderLeft: `1px solid ${border.divider(isDark)}`,
              },
            },
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.6rem',
            }}
          >
            Language
          </Typography>
        </Box>
        <Divider sx={{ borderColor: border.subtle(isDark), mx: 1, mb: 0.5 }} />

        {availableLanguages.map((lang) => {
          const isSelected = lang.code === language;
          return (
            <MenuItem
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              sx={{
                mx: 0.5,
                my: 0.2,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                transition: 'all 0.2s ease',
                background: isSelected
                  ? 'rgba(255,143,0,0.1)'
                  : 'transparent',
                '&:hover': {
                  background: isSelected
                    ? 'rgba(255,143,0,0.15)'
                    : overlay.neutralLight(isDark),
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 1,
                    background: isSelected
                      ? overlay.goldStrong(isDark)
                      : overlay.neutralLight(isDark),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid',
                    borderColor: isSelected
                      ? border.goldMedium(isDark)
                      : border.medium(isDark),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      color: isSelected ? accentColor : 'text.primary',
                    }}
                  >
                    {lang.code.toUpperCase()}
                  </Typography>
                </Box>
              </ListItemIcon>
              <ListItemText sx={{ m: 0, ml: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? accentColor : 'text.primary',
                    fontSize: '0.8rem',
                    lineHeight: 1.2,
                  }}
                >
                  {lang.nativeLabel}
                </Typography>
                {lang.nativeLabel !== lang.label && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.65rem',
                      display: 'block',
                      lineHeight: 1,
                      mt: 0.2,
                    }}
                  >
                    {lang.label}
                  </Typography>
                )}
              </ListItemText>
              {isSelected && (
                <CheckIcon
                  sx={{ fontSize: 16, color: accentColor, ml: 1 }}
                />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
