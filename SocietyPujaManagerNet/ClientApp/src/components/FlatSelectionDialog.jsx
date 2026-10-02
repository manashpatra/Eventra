import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Fade,
  useTheme,
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { brand, surface, overlay, gradient, border, shadow, text } from '../theme/colorTokens';

const BLOCKS = Array.from({ length: 13 }, (_, i) => i + 1);
const FLOORS = Array.from({ length: 11 }, (_, i) => i + 1);
const FLAT_TYPES = ['A', 'B', 'C', 'D', 'E', 'F'];

const STORAGE_KEY = 'app_selected_flat';

export const getSelectedFlat = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const setSelectedFlat = (flat) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flat));
};

export const clearSelectedFlat = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const parseAndSelectFlat = (flatId) => {
  if (!flatId) return null;
  
  // Clean parameter: replace slashes/spaces, convert to uppercase
  const clean = flatId.trim().replace(/\//g, '-').replace(/\s+/g, '').toUpperCase();
  
  let blockVal = null;
  let floorVal = null;
  let typeVal = null;

  // Pattern 1: block-floor-type (e.g., 10-4-B)
  const parts = clean.split('-');
  if (parts.length === 3) {
    blockVal = parseInt(parts[0], 10);
    floorVal = parseInt(parts[1], 10);
    typeVal = parts[2];
  } else if (parts.length === 2) {
    // Pattern 2: block-floortype (e.g., 10-4B)
    blockVal = parseInt(parts[0], 10);
    const lastPart = parts[1];
    if (lastPart.length >= 2) {
      typeVal = lastPart.slice(-1);
      floorVal = parseInt(lastPart.slice(0, -1), 10);
    }
  }

  // Fallback pattern matching if split parsing didn't get all values
  if (!blockVal || !floorVal || !typeVal) {
    const match = clean.match(/^(\d+)-(\d+)([A-F])$/);
    if (match) {
      blockVal = parseInt(match[1], 10);
      floorVal = parseInt(match[2], 10);
      typeVal = match[3];
    }
  }

  // Validation
  if (
    blockVal && 
    floorVal && 
    typeVal &&
    BLOCKS.includes(blockVal) &&
    FLOORS.includes(floorVal) &&
    FLAT_TYPES.includes(typeVal)
  ) {
    const flatNumber = `${blockVal}/${floorVal}${typeVal}`;
    const flatNumberForLookup = `${blockVal}-${floorVal}-${typeVal}`;
    const flat = {
      block: blockVal,
      floor: floorVal,
      flatType: typeVal,
      flatNumber,
      flatNumberForLookup
    };
    setSelectedFlat(flat);
    window.dispatchEvent(new Event('flatSelectionChanged'));
    return flat;
  }
  
  return null;
};

const FlatSelectionDialog = ({ open, onClose, onSelect, allowClose = true }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [block, setBlock] = useState('');
  const [floor, setFloor] = useState('');
  const [flatType, setFlatType] = useState('');

  useEffect(() => {
    if (open) {
      const existing = getSelectedFlat();
      if (existing) {
        setBlock(existing.block);
        setFloor(existing.floor);
        setFlatType(existing.flatType);
      } else {
        setBlock('');
        setFloor('');
        setFlatType('');
      }
    }
  }, [open]);

  const flatNumber = block && floor && flatType ? `${block}/${floor}${flatType}` : '';
  const flatNumberForLookup = block && floor && flatType ? `${block}-${floor}-${flatType}` : '';

  const handleSave = () => {
    if (block && floor && flatType) {
      const flat = { block, floor, flatType, flatNumber, flatNumberForLookup };
      setSelectedFlat(flat);
      onSelect(flat);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={allowClose ? onClose : undefined}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: {
        sx: {
          borderRadius: '20px',
          background: isDark
            ? gradient.surfaceDark
            : surface.paperLight,
          border: `1px solid ${border.brandSubtle(isDark)}`,
          boxShadow: shadow.dialog(isDark),
          overflow: 'visible',
        },
      } }}
    >
      {/* Top accent */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50%',
          height: 3,
          background: gradient.accentLine,
          borderRadius: '0 0 4px 4px',
        }}
      />

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: gradient.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ApartmentIcon sx={{ color: text.white, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              Select Your Flat
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Choose your block, floor & flat type
            </Typography>
          </Box>
        </Box>
        {allowClose && (
          <IconButton onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 2, overflow: 'visible' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Block</InputLabel>
            <Select value={block} onChange={(e) => setBlock(e.target.value)} label="Block">
              {BLOCKS.map((b) => (
                <MenuItem key={b} value={b}>Block {b}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Floor</InputLabel>
            <Select value={floor} onChange={(e) => setFloor(e.target.value)} label="Floor">
              {FLOORS.map((f) => (
                <MenuItem key={f} value={f}>Floor {f}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select value={flatType} onChange={(e) => setFlatType(e.target.value)} label="Type">
              {FLAT_TYPES.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Preview */}
        <Fade in={!!flatNumber}>
          <Box
            sx={{
              textAlign: 'center',
              p: 2.5,
              borderRadius: '16px',
              background: gradient.brandPreview,
              border: `1px solid ${overlay.brandGlowLight}`,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              YOUR FLAT
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                background: gradient.brandTextFull,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {flatNumber || '—'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
              {block ? `Block ${block}` : ''}{floor ? `, Floor ${floor}` : ''}{flatType ? `, Type ${flatType}` : ''}
            </Typography>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        {allowClose && (
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Cancel</Button>
        )}
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!block || !floor || !flatType}
          startIcon={<CheckIcon />}
          sx={{ borderRadius: '12px', px: 3 }}
        >
          Confirm Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlatSelectionDialog;
