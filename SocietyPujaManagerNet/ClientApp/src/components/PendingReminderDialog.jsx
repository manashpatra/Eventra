import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  WhatsApp as WhatsAppIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  RestartAlt as ResetIcon,
  Event as EventIcon,
  People as PeopleIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { getDaysRemaining, getPujaStartDate, formatDate } from '../utils/dateUtils';
import { isMobileDevice } from '../utils/deviceUtils';
import { thirdParty, brand, statusBadge, status } from '../theme/colorTokens';

const generateBaseMessage = (block, daysToGo, societyName, pujaName = 'Durga Puja') => {
  const blockGreeting = (block && block !== 'all')
    ? `Dear Block ${block} Neighbors,`
    : `Dear ${societyName ? `${societyName} ` : ''}Neighbors,`;

  let daysPhrase = 'a few days to go';
  if (daysToGo !== null && daysToGo !== undefined) {
    if (daysToGo > 1) {
      daysPhrase = `${daysToGo} days to go`;
    } else if (daysToGo === 1) {
      daysPhrase = '1 day to go';
    } else if (daysToGo === 0) {
      daysPhrase = '0 days to go (starts today)';
    } else {
      daysPhrase = 'the festival is underway';
    }
  }

  const effectivePuja = pujaName || 'Durga Puja';

  return `${blockGreeting}
Just a gentle reminder to please pay the ${effectivePuja} subscriptions at your earliest convenience as we are just ${daysPhrase}. 
Thank you for your continued support!`;
};

const PendingReminderDialog = ({
  open,
  onClose,
  initialBlock = 'all',
  config = {},
  allPendingResidents = [],
  onPrintPending,
}) => {
  const [selectedBlock, setSelectedBlock] = useState(initialBlock || 'all');
  const [includeFlats, setIncludeFlats] = useState(false);
  const [includeUpi, setIncludeUpi] = useState(false);
  const [includeSignature, setIncludeSignature] = useState(false);
  const [message, setMessage] = useState('');
  const [isCustomEdited, setIsCustomEdited] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Sync selected block when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBlock(initialBlock || 'all');
      setIsCustomEdited(false);
      setIncludeFlats(false);
      setIncludeUpi(false);
      setIncludeSignature(false);
    }
  }, [open, initialBlock]);

  // Dynamic Puja dates & days countdown from config
  const effectivePujaStartDate = useMemo(() => getPujaStartDate(config), [config]);
  const daysToGo = useMemo(() => getDaysRemaining(effectivePujaStartDate), [effectivePujaStartDate]);

  // Filter pending residents for the currently selected block
  const blockPendingResidents = useMemo(() => {
    if (selectedBlock === 'all') {
      return allPendingResidents;
    }
    return allPendingResidents.filter((r) => String(r.block) === String(selectedBlock));
  }, [allPendingResidents, selectedBlock]);

  // Flat numbers list string
  const flatNumbersStr = useMemo(() => {
    const flats = blockPendingResidents
      .map((r) => r.flatNumber || (r.block && r.floor && r.flatType ? `${r.block}-${r.floor}-${r.flatType}` : null))
      .filter(Boolean);
    return flats.join(', ');
  }, [blockPendingResidents]);

  // Rebuild message when block, toggles, or dates change (unless manually custom-edited)
  useEffect(() => {
    if (isCustomEdited) return;

    let text = generateBaseMessage(selectedBlock, daysToGo, config?.societyName, config?.pujaName);

    if (includeFlats && blockPendingResidents.length > 0) {
      text += `\n\n📋 Pending Flats (${blockPendingResidents.length}):\n${flatNumbersStr}`;
    }

    if (includeUpi && (config?.upiPayeeAddress || config?.subscriptionAmount)) {
      text += `\n\n💳 Payment Details:\nUPI ID: ${config?.upiPayeeAddress || ''}\nAmount: ₹${config?.subscriptionAmount || 1500}`;
      if (config?.upiPayeeName) {
        text += `\nPayee: ${config.upiPayeeName}`;
      }
    }

    if (includeSignature) {
      text += `\n\n— ${config?.committeeName || 'Puja Committee'} ${config?.year || ''}`;
      if (config?.societyName) {
        text += `\n${config.societyName}`;
      }
    }

    setMessage(text);
  }, [selectedBlock, daysToGo, includeFlats, includeUpi, includeSignature, isCustomEdited, config, blockPendingResidents, flatNumbersStr]);

  const handleResetMessage = () => {
    setIsCustomEdited(false);
    setIncludeFlats(false);
    setIncludeUpi(false);
    setIncludeSignature(false);
    const text = generateBaseMessage(selectedBlock, daysToGo, config?.societyName, config?.pujaName);
    setMessage(text);
    setSnackbar({ open: true, message: 'Message reset to default format.', severity: 'info' });
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setSnackbar({ open: true, message: 'Message copied to clipboard!', severity: 'success' });
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      setSnackbar({ open: true, message: 'Failed to copy to clipboard.', severity: 'error' });
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      // Always write to clipboard for smooth paste fallback
      try {
        await navigator.clipboard.writeText(message);
      } catch (err) {
        console.warn('Clipboard write failed:', err);
      }

      const isMobile = isMobileDevice();
      if (isMobile && navigator.share) {
        await navigator.share({
          text: message,
          title: `Durga Puja Subscription Reminder - ${selectedBlock === 'all' ? 'All Blocks' : `Block ${selectedBlock}`}`,
        });
      } else {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      // If user cancelled share sheet, don't show error
      if (error.name !== 'AbortError') {
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    }
  };

  const handlePrint = () => {
    if (onPrintPending) {
      onPrintPending(selectedBlock);
    }
  };

  const blocksList = config?.blocks || Array.from({ length: 13 }, (_, i) => i + 1);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WhatsAppIcon sx={{ color: thirdParty.whatsapp, fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Pending Payment Reminder
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2, pb: 2 }}>
          {/* Controls: Block Selector & Status Chips */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Select Block</InputLabel>
              <Select
                value={selectedBlock}
                label="Select Block"
                onChange={(e) => {
                  setSelectedBlock(e.target.value);
                  setIsCustomEdited(false);
                }}
              >
                <MenuItem value="all">
                  <em>All Blocks</em>
                </MenuItem>
                {blocksList.map((b) => (
                  <MenuItem key={b} value={String(b)}>
                    Block {b}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Chip
              icon={<PeopleIcon sx={{ fontSize: 16 }} />}
              label={`${blockPendingResidents.length} Pending Flats`}
              size="small"
              sx={{
                fontWeight: 600,
                backgroundColor: statusBadge.warning.bg,
                color: statusBadge.warning.text,
              }}
            />

            {daysToGo !== null && (
              <Chip
                icon={<EventIcon sx={{ fontSize: 16 }} />}
                label={
                  daysToGo > 1
                    ? `${daysToGo} days to Puja`
                    : daysToGo === 1
                    ? '1 day to Puja'
                    : daysToGo === 0
                    ? 'Puja starts today'
                    : 'Puja underway'
                }
                size="small"
                sx={{
                  fontWeight: 600,
                  backgroundColor: statusBadge.info.bg,
                  color: statusBadge.info.text,
                }}
              />
            )}
          </Box>

          {/* Message Textarea */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="WhatsApp Sharing Message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setIsCustomEdited(true);
              }}
              helperText={
                isCustomEdited
                  ? 'Custom modified. Click Reset to return to the template.'
                  : `Dynamic countdown based on Puja start date (${formatDate(effectivePujaStartDate, config?.dateFormat)})`
              }
              slotProps={{
                input: {
                  sx: {
                    fontFamily: 'inherit',
                    fontSize: '0.92rem',
                    lineHeight: 1.5,
                  },
                },
              }}
            />
            {isCustomEdited && (
              <Tooltip title="Reset to default message template">
                <Button
                  size="small"
                  startIcon={<ResetIcon />}
                  onClick={handleResetMessage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: '0.75rem',
                    py: 0.2,
                    textTransform: 'none',
                  }}
                >
                  Reset
                </Button>
              </Tooltip>
            )}
          </Box>

          {/* Optional Toggles */}
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, mb: 1, backgroundColor: 'background.default' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Optional Additions to Message
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 2 }, mt: 0.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={includeFlats}
                    onChange={(e) => {
                      setIncludeFlats(e.target.checked);
                      setIsCustomEdited(false);
                    }}
                  />
                }
                label={<Typography variant="body2">Include Pending Flat Numbers</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={includeUpi}
                    onChange={(e) => {
                      setIncludeUpi(e.target.checked);
                      setIsCustomEdited(false);
                    }}
                  />
                }
                label={<Typography variant="body2">Include UPI Payment Info</Typography>}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={includeSignature}
                    onChange={(e) => {
                      setIncludeSignature(e.target.checked);
                      setIsCustomEdited(false);
                    }}
                  />
                }
                label={<Typography variant="body2">Include Committee Sign-off</Typography>}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Print Pending List
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyMessage}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Copy
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} color="inherit" size="small" sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<WhatsAppIcon />}
              onClick={handleShareWhatsApp}
              sx={{
                background: `${thirdParty.whatsapp} !important`,
                backgroundColor: `${thirdParty.whatsapp} !important`,
                backgroundImage: 'none !important',
                color: '#fff !important',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)',
                '&:hover': {
                  background: '#1ebe5d !important',
                  backgroundColor: '#1ebe5d !important',
                  backgroundImage: 'none !important',
                },
              }}
            >
              Share on WhatsApp
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PendingReminderDialog;
