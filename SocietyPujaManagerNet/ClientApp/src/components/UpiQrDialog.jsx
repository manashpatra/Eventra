import React from 'react';
import { Dialog, DialogTitle, DialogContent, Typography, IconButton, Box, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUrl } from '../utils/upiHelper';
import { brand, text, surface, overlay } from '../theme/colorTokens';

const UpiQrDialog = ({ open, onClose, amount, flatNumber = '', config, mode = 'food' }) => {
  const formatCurrency = (val) => {
    if (typeof val !== 'number') return val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
          Amount Due: <span style={{ color: brand.orange, fontSize: '1.4rem' }}>{formatCurrency(amount)}</span>
        </Typography>
        
        {flatNumber && (
          <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ backgroundColor: 'rgba(124, 77, 255, 0.1)', padding: '4px 12px', borderRadius: '16px' }}>
              Flat: {flatNumber}
            </span>
          </Typography>
        )}
        
        <Box sx={{ p: 2, borderRadius: '24px', backgroundColor: surface.paperLight, display: 'inline-flex', boxShadow: `0 12px 48px rgba(255,143,0,0.25)`, mb: 3 }}>
          <QRCodeSVG
            value={buildUpiUrl({
              amount,
              flatNumber,
              mode,
              pa: config?.upiPayeeAddress || '',
              pn: config?.upiPayeeName || '',
              tn: config?.upiPayeeDescription || '',
            })}
            size={260}
            level="M"
            includeMargin={false}
            bgColor={text.white}
            fgColor={text.dark}
          />
        </Box>

        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '1.1rem' }}>
          {config?.upiPayeeAddress || 'UPI ID not configured'}
        </Typography>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button onClick={onClose} variant="contained" color="primary" sx={{ px: 4, borderRadius: 8 }}>
            Done
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UpiQrDialog;
