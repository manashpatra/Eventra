import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Box, Typography, Paper, Slide, Snackbar, LinearProgress } from '@mui/material';
import { SystemUpdate as UpdateIcon } from '@mui/icons-material';
import { brand, text, overlay, gradient, shadow } from '../theme/colorTokens';

const TransitionUp = (props) => {
  return <Slide {...props} direction="up" />;
};

const UpdatePrompt = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [autoUpdateProgress, setAutoUpdateProgress] = useState(0);

  useEffect(() => {
    if (needRefresh) {
      setOpen(true);
      setUpdating(true);
      const duration = 4000; // 4 seconds before auto-reloading
      const interval = 50;
      let elapsed = 0;

      const timer = setInterval(() => {
        elapsed += interval;
        setAutoUpdateProgress(Math.min((elapsed / duration) * 100, 100));

        if (elapsed >= duration) {
          clearInterval(timer);
          updateServiceWorker(true);
        }
      }, interval);

      return () => clearInterval(timer);
    }
  }, [needRefresh, updateServiceWorker]);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Snackbar
      open={open}
      TransitionComponent={TransitionUp}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        bottom: { xs: 85, sm: 32 },
        zIndex: 9999,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          pointerEvents: 'auto',
          borderRadius: 2,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '90vw',
          maxWidth: 400,
          background: (theme) => overlay.glass(theme.palette.mode === 'dark'),
          backdropFilter: 'blur(10px)',
          border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? overlay.whiteLight : overlay.shadowXLight}`,
          boxShadow: (theme) => shadow.glass(theme.palette.mode === 'dark'),
        }}
      >
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: gradient.ctaGold,
                color: text.white,
                flexShrink: 0,
                boxShadow: shadow.installIcon,
              }}
            >
              <UpdateIcon fontSize="small" />
            </Box>
            
            <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
                  Updating...
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: brand.orange }}>
                  {Math.round(autoUpdateProgress)}%
                </Typography>
              </Box>
              {updating && <LinearProgress variant="determinate" value={autoUpdateProgress} sx={{ height: 4, borderRadius: 2, mt: 0.5 }} />}
            </Box>

          </Box>
        </Box>
      </Paper>
    </Snackbar>
  );
};

export default UpdatePrompt;

