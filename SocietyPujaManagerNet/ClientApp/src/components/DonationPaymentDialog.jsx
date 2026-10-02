import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  IconButton,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  Clear as ClearIcon,
  VolunteerActivism as DonationIcon,
} from '@mui/icons-material';
import UpiPaymentCard from './UpiPaymentCard';
import { brand, cultural, border } from '../theme/colorTokens';

const DonationPaymentDialog = ({ open, onClose, config }) => {
  const [flatNumber, setFlatNumber] = useState('');

  const handleClose = () => {
    setFlatNumber('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          pt: 2,
          px: 2.5,
          borderBottom: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(236, 72, 153, 0.12)',
              color: cultural.pink || '#ec4899',
            }}
          >
            <DonationIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Donation QR
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.75rem' }}>
              {config?.societyName ? `${config.societyName} ` : ''}
              {config?.committeeName || 'Puja'} {config?.year || ''}
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Optional Flat Number Input */}
        <Box sx={{ mb: 1.5, mt: 0.5 }}>
          <TextField
            label="Flat Number (Optional)"
            placeholder="Leave empty for general/guest donation or enter e.g. 10/4B"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value)}
            size="small"
            fullWidth
            helperText={
              flatNumber.trim()
                ? `QR will be generated for Flat: ${flatNumber.trim()}`
                : 'Showing general donation QR without any flat number'
            }
            slotProps={{
              input: {
                endAdornment: flatNumber ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setFlatNumber('')} edge="end">
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '10px',
              },
            }}
          />
        </Box>

        {/* Live UpiPaymentCard */}
        <UpiPaymentCard
          flatNumber={flatNumber.trim()}
          mode="donation"
          showIntentButtons={false}
          showImportantNotice={false}
          pa={config?.upiPayeeAddress}
          pn={config?.upiPayeeName}
          societyName={config?.societyName}
          committeeName={config?.committeeName}
          year={config?.year}
          tn={config?.upiPayeeDescription}
          mc={config?.upiMerchantCode}
          bankName={config?.bankName}
          bankAccountNumber={config?.bankAccountNumber}
          bankIfscCode={config?.bankIfscCode}
          chequeFavourName={config?.chequeFavourName}
          enabledUpiApps={config?.enabledUpiApps}
          whatsappGroupLink={config?.whatsappGroupLink}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DonationPaymentDialog;
