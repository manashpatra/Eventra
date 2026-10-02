import React, { useState, useEffect } from 'react';
import { Button, Tooltip, IconButton, MenuItem, ListItemIcon, ListItemText, Box, Typography, Paper, Slide, Dialog } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import IosShareIcon from '@mui/icons-material/IosShare';
import { getDeferredPrompt, subscribeToInstallPrompt } from '../utils/pwaUtils';
import { isIOSDevice, isStandaloneMode } from '../utils/deviceUtils';
import { brand, text, overlay, gradient, shadow, border, thirdParty } from '../theme/colorTokens';

const InstallPrompt = ({ variant = 'button', onClick = () => {} }) => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    if (variant === 'notification') {
      const hasDismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (hasDismissed) {
        setDismissed(true);
      }
    }

    const checkIos = isIOSDevice() && !isStandaloneMode();

    const unsubscribe = subscribeToInstallPrompt((installable) => {
      const shouldBeInstallable = installable || checkIos;
      setIsInstallable(shouldBeInstallable);
      if (variant === 'notification' && shouldBeInstallable && !sessionStorage.getItem('pwa_install_dismissed')) {
        setDismissed(false);
      }
    });

    if (checkIos) {
      setIsInstallable(true);
      if (variant === 'notification' && !sessionStorage.getItem('pwa_install_dismissed')) {
        setDismissed(false);
      }
    }

    return unsubscribe;
  }, [variant]);

  const handleInstallClick = async (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    onClick();
    
    if (isIOSDevice() && !isStandaloneMode()) {
      setShowIosInstructions(true);
      if (variant === 'notification') {
        setDismissed(true);
        sessionStorage.setItem('pwa_install_dismissed', 'true');
      }
      return;
    }

    const deferredPrompt = getDeferredPrompt();
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      if (variant === 'notification') {
        setDismissed(true);
        sessionStorage.setItem('pwa_install_dismissed', 'true');
      }
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  const renderIosDialog = () => (
    <Dialog 
      open={showIosInstructions} 
      onClose={() => setShowIosInstructions(false)}
      slotProps={{ paper: {
        sx: { borderRadius: 4, p: 3, textAlign: 'center', maxWidth: 320 }
      } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <IosShareIcon sx={{ fontSize: 48, color: thirdParty.iosBlue }} />
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
        Install App on iOS
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
        Apple requires manual installation. Tap the <strong>Share</strong> button at the bottom of your screen, then select <strong>Add to Home Screen</strong>.
      </Typography>
      <Button 
        fullWidth 
        variant="contained" 
        onClick={() => setShowIosInstructions(false)}
        sx={{ 
          borderRadius: 2, 
          textTransform: 'none', 
          fontWeight: 700,
          bgcolor: thirdParty.iosBlue,
          py: 1,
          boxShadow: `0 4px 12px rgba(0,122,255,0.3)`,
          '&:hover': { bgcolor: thirdParty.iosBlueHover }
        }}
      >
        Got it
      </Button>
    </Dialog>
  );

  // If it's not installable, render nothing
  if (!isInstallable) return null;

  const renderContent = () => {
    if (variant === 'floating') {
      return (
        <Slide direction="right" in={true} mountOnEnter unmountOnExit>
          <Tooltip title="Install App" placement="right">
            <IconButton
              onClick={handleInstallClick}
              sx={{
                position: 'fixed',
                bottom: { xs: 24, md: 32 },
                left: 16,
                zIndex: 9998,
                backgroundColor: 'background.paper',
                boxShadow: `0 4px 12px ${overlay.shadowLight}`,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                color: brand.orange,
                border: `1px solid ${border.brandSubtle(true)}`
              }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Slide>
      );
    }

    if (variant === 'notification') {
      return (
        <Box 
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 24, md: 32 }, 
            left: 0, 
            right: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            zIndex: 9999,
            pointerEvents: 'none' // allow clicking through empty space
          }}
        >
          <Slide direction="up" in={!dismissed} mountOnEnter unmountOnExit>
            <Paper
              elevation={8}
              sx={{
                pointerEvents: 'auto', // re-enable clicks for the card
                borderRadius: 4,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: '90%',
                maxWidth: 400,
                background: (theme) => overlay.glass(theme.palette.mode === 'dark'),
                backdropFilter: 'blur(10px)',
                border: (theme) => `1px solid ${border.light(theme.palette.mode === 'dark')}`,
                p: 1.5,
                gap: 1.5,
                boxShadow: (theme) => shadow.glass(theme.palette.mode === 'dark'),
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: gradient.ctaGold,
                  color: text.white,
                  flexShrink: 0,
                  boxShadow: shadow.installIcon,
                }}
              >
                <SystemUpdateIcon />
              </Box>
              
              <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  Install App
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }} noWrap>
                  Add to home screen
                </Typography>
              </Box>

              <Button
                variant="contained"
                onClick={handleInstallClick}
                size="small"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  background: gradient.ctaGold,
                  color: text.black,
                  borderRadius: 2,
                  px: 2,
                  flexShrink: 0,
                  boxShadow: 'none',
                  '&:hover': {
                    background: gradient.ctaGoldHover,
                    boxShadow: `0 2px 8px ${overlay.brandGlowStrong}`,
                  },
                }}
              >
                Install
              </Button>

              <IconButton 
                onClick={handleDismiss} 
                size="small" 
                sx={{ 
                  color: 'text.secondary',
                  flexShrink: 0,
                  p: 0.5,
                  '&:hover': { background: overlay.shadowCard }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Paper>
          </Slide>
        </Box>
      );
    }

    if (variant === 'menuitem') {
      return (
        <MenuItem
          onClick={handleInstallClick}
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
          }}
        >
          <DownloadIcon sx={{ fontSize: 18, color: brand.orange }} />
          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.primary' }}>
            Install App
          </Typography>
        </MenuItem>
      );
    }

    if (variant === 'icon') {
      return (
        <Tooltip title="Install App">
          <IconButton
            onClick={handleInstallClick}
            sx={{
              color: brand.orange,
              backgroundColor: overlay.brandLight(true),
              '&:hover': {
                backgroundColor: overlay.brandStrong(true),
              },
              mr: 1
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      );
    }

    return (
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        onClick={handleInstallClick}
        sx={{
          borderRadius: '8px',
          fontWeight: 600,
          textTransform: 'none',
          background: gradient.ctaGold,
          color: text.black,
          '&:hover': {
            background: gradient.ctaGoldHover,
          }
        }}
      >
        Install App
      </Button>
    );
  };

  return (
    <>
      {renderContent()}
      {renderIosDialog()}
    </>
  );
};

export default InstallPrompt;
