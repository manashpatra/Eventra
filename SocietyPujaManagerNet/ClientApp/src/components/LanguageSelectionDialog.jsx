import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  ButtonBase,
  Fade,
  useTheme,
} from '@mui/material';
import { Translate as TranslateIcon } from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { brand, surface, text, border, overlay, gradient, shadow, thirdParty } from '../theme/colorTokens';

const LanguageSelectionDialog = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    setLanguage,
    isLanguageSelected,
    markLanguageSelected,
    availableLanguages,
    isEnabled,
  } = useLanguage();

  // Don't show if language is already selected, or multilingual is disabled, or no languages configured
  if (isLanguageSelected || !isEnabled || availableLanguages.length === 0) {
    return null;
  }

  const handleSelect = (langCode) => {
    markLanguageSelected();
    setLanguage(langCode);
  };
  const accentColor = isDark ? brand.gold : brand.orangeDark;

  return (
    <Dialog
      className="notranslate"
      open={true}
      slotProps={{
        paper: {
          sx: {
            width: 300,
            maxWidth: '90vw',
            borderRadius: 3,
            background: isDark ? surface.loadingBg : surface.paperLight,
            boxShadow: shadow.notifCard(isDark),
            border: `1px solid ${border.light(isDark)}`,
            overflow: 'hidden',
          },
        },
        backdrop: {
          sx: {
            backgroundColor: overlay.backdrop(isDark),
            backdropFilter: 'blur(10px)',
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            pt: 2.5,
            pb: 1.5,
            px: 2,
            position: 'relative',
          }}
        >
          {/* Subtle background glow */}
          <Box
            sx={{
              position: 'absolute',
              top: '-30%',
              left: '0%',
              width: 100,
              height: 100,
              background: gradient.radialBrandGlow,
              zIndex: 0,
            }}
          />
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: gradient.goldTint(isDark),
              border: `1px solid ${border.goldSubtle(isDark)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
            }}
          >
            <TranslateIcon sx={{ fontSize: 20, color: accentColor }} />
          </Box>
          <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: isDark ? text.white : 'text.primary',
                lineHeight: 1.2,
                mb: 0.2,
              }}
            >
              Select Language
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: 'text.secondary', opacity: 0.8, display: 'block', lineHeight: 1.1 }}
            >
              Choose your preferred language
            </Typography>
          </Box>
        </Box>

        {/* Language List */}
        <Box sx={{ px: 2, pb: 3, pt: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            {availableLanguages.map((lang, index) => (
              <Fade
                in={true}
                timeout={300 + index * 100}
                key={lang.code}
              >
                <ButtonBase
                  onClick={() => handleSelect(lang.code)}
                  sx={{
                    width: '100%',
                    borderRadius: 1.5,
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    background: overlay.neutralXLight(isDark),
                    border: `1px solid ${border.light(isDark)}`,
                    '&:hover': {
                      background: overlay.goldXLight(isDark),
                      borderColor: border.goldSubtle(isDark),
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: '100%',
                      py: 1,
                      px: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    {/* Language Badge */}
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '6px',
                        background: overlay.neutralMedium(isDark),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: isDark ? text.white : 'text.primary' }}>
                        {lang.code.toUpperCase()}
                      </Typography>
                    </Box>

                    {/* Text */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: isDark ? text.white : 'text.primary',
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
                    </Box>
                  </Box>
                </ButtonBase>
              </Fade>
            ))}
          </Box>
          
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              opacity: 0.7,
              mt: 2,
              fontSize: '0.65rem',
              lineHeight: 1.4,
            }}
          >
            Optimized for English
            <br />
            <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', mt: 0.75, opacity: 0.9, fontSize: '0.65rem' }}>
              <span style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>Powered by&nbsp;</span>
              <span style={{ fontWeight: 600, letterSpacing: '0.02em' }}>
                <span style={{ color: thirdParty.googleBlue }}>G</span>
                <span style={{ color: thirdParty.googleRed }}>o</span>
                <span style={{ color: thirdParty.googleYellow }}>o</span>
                <span style={{ color: thirdParty.googleBlue }}>g</span>
                <span style={{ color: thirdParty.googleGreen }}>l</span>
                <span style={{ color: thirdParty.googleRed }}>e</span>
                <span style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}> Translate</span>
              </span>
            </Box>
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageSelectionDialog;
