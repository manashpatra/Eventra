import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import { Warning as WarningIcon, Close as CloseIcon } from '@mui/icons-material';
import { errorRed, errorRedDark, surface, overlay, border, gradient } from '../theme/colorTokens';

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmText = 'Delete', cancelText = 'Cancel', isDestructive = true }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      slotProps={{ paper: {
        sx: {
          borderRadius: 3,
          boxShadow: isDark ? `0 8px 32px ${overlay.shadowDark}` : `0 10px 30px ${overlay.shadowLight}`,
          backgroundColor: surface.paper(isDark),
          backgroundImage: isDark ? gradient.surfaceDarkAlt : 'none',
          border: `1px solid ${border.divider(isDark)}`,
          minWidth: 400
        }
      } }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {isDestructive && <WarningIcon sx={{ color: errorRed }} />}
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
        </Box>
        <IconButton size="small" onClick={onCancel}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {cancelText}
        </Button>
        <Button 
          variant="contained" 
          onClick={onConfirm}
          sx={{ 
            fontWeight: 600,
            backgroundColor: isDestructive ? errorRed : 'primary.main',
            '&:hover': {
              backgroundColor: isDestructive ? errorRedDark : 'primary.dark',
            }
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
