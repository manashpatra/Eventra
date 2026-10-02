import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, MenuItem, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, TableFooter, InputAdornment, FormControl, InputLabel, Select, Tooltip, Menu, ListItemIcon, ListItemText, Checkbox, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Payment as PaymentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Undo as UndoIcon,
  HourglassEmpty as PendingIcon,
  CloudUpload as UploadIcon,
  CurrencyRupee as RupeeIcon,
  WhatsApp as WhatsAppIcon,
  PhotoCamera as CameraIcon,
  People as PeopleIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { generateImageFromHTML, printHTML } from '../../utils/print/core';
import { getReceiptHTML } from '../../utils/print/templates/receiptTemplate';
import { getPendingSubscriptionsHTML } from '../../utils/print/templates/pendingSubscriptionTemplate';
import PendingReminderDialog from '../../components/PendingReminderDialog';
import {
  createResident,
  updateResident,
  deleteResident,
  getAllResidents,
  searchResidentsByFilters,
  recordSubscription,
  deleteSubscriptionPayment,
} from '../../services/residentService';
import { getLocalISODate, formatDate, getDatePickerFormat, getDaysRemaining, getPujaStartDate } from '../../utils/dateUtils';
import { getMasterConfig } from '../../services/masterConfigService';
import { getDashboardStats } from '../../services/dashboardStatsService';


import { matchesFlatOrName } from '../../utils/flatHelper';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { getPaymentProof } from '../../services/firebase';
import { useDebounce } from '../../hooks/useDebounce';
import { useProcessing } from '../../contexts/ProcessingContext';
import { statusBadge, thirdParty, status } from '../../theme/colorTokens';

const PAYMENT_MODES = ['UPI', 'Cash', 'Cheque', 'Net Banking'];

const Subscriptions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const isAuditor = user?.role === 'Auditor';
  const isSuperAdmin = user?.role === 'Super Admin';
  const [residents, setResidents] = useState([]);
  const [config, setConfig] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterBlock, setFilterBlock] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionResident, setActionResident] = useState(null);

  const handleMenuOpen = (event, resident) => {
    setAnchorEl(event.currentTarget);
    setActionResident(resident);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionResident(null);
  };
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [proofImages, setProofImages] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Pending payment WhatsApp reminder & print states
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [reminderInitialBlock, setReminderInitialBlock] = useState('all');
  const [allPendingResidents, setAllPendingResidents] = useState([]);
  const [printMenuAnchor, setPrintMenuAnchor] = useState(null);

  const effectivePujaStartDate = useMemo(() => getPujaStartDate(config), [config]);
  const pujaDaysToGo = useMemo(() => getDaysRemaining(effectivePujaStartDate), [effectivePujaStartDate]);

  const loadPendingResidents = async () => {
    try {
      const all = await getAllResidents();
      const pending = all.filter((r) => r.subscriptionStatus === 'pending');
      pending.sort((a, b) => {
        const blockA = Number(a?.block) || 0;
        const blockB = Number(b?.block) || 0;
        if (blockA !== blockB) return blockA - blockB;

        const floorA = Number(a?.floor) || 0;
        const floorB = Number(b?.floor) || 0;
        if (floorA !== floorB) return floorA - floorB;

        const flatA = String(a?.flatNumber || a?.flat || '');
        const flatB = String(b?.flatNumber || b?.flat || '');
        return flatA.localeCompare(flatB, undefined, { numeric: true, sensitivity: 'base' });
      });
      setAllPendingResidents(pending);
      return pending;
    } catch (err) {
      console.error('Error loading pending residents:', err);
      return [];
    }
  };

  const handleOpenReminderDialog = async (block = null) => {
    const targetBlock = block !== null ? block : (filterBlock !== 'all' ? filterBlock : 'all');
    setReminderInitialBlock(targetBlock);
    setReminderDialogOpen(true);
    if (allPendingResidents.length === 0) {
      startProcessing('Loading pending residents...');
      try {
        await loadPendingResidents();
      } finally {
        stopProcessing();
      }
    }
  };

  const handlePrintPending = async (block = 'all') => {
    let pending = allPendingResidents;
    if (!pending || pending.length === 0) {
      startProcessing('Preparing pending list for print...');
      try {
        pending = await loadPendingResidents();
      } finally {
        stopProcessing();
      }
    }

    const targetList = block === 'all'
      ? pending
      : pending.filter((r) => String(r.block) === String(block));

    const html = getPendingSubscriptionsHTML({
      residents: targetList,
      selectedBlock: block,
      config,
      daysToGo: pujaDaysToGo,
      pujaStartDate: effectivePujaStartDate,
    });

    printHTML(html);
  };

  // Form states
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    block: '',
    floor: '',
    flatType: '',
    remarks: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMode: 'UPI',
    remarks: '',
    proofFiles: [],
    existingProofs: [],
    transactionDate: getLocalISODate(),
  });

  const [editMode, setEditMode] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configData, statsData] = await Promise.all([
        getMasterConfig(),
        getDashboardStats(false),
      ]);
      setConfig(configData);
      setPaymentForm((prev) => ({ ...prev, amount: configData?.subscriptionAmount || 0 }));
      if (statsData?.subscription) {
        setGlobalStats(statsData.subscription);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      const term = (searchTerm || '').trim();
      const hasSearch = term.length > 0;
      const isFlatSearch = hasSearch && /^[0-9]/.test(term);
      const isNameSearch = hasSearch && !isFlatSearch;
      const hasBlock = filterBlock !== 'all';
      const hasStatus = filterStatus !== 'all';
      const hasPaymentMode = filterPaymentMode && filterPaymentMode.length > 0;
      const hasDate = startDate !== null || endDate !== null;

      const isSearchAll = term.toLowerCase() === 'all';

      // If no filters are active, clear the list (unless searching 'all')
      if (!hasSearch && !hasBlock && !hasStatus && !hasPaymentMode && !hasDate) {
        setResidents([]);
        return;
      }

      // If it's a flat search without other filters, require 3 chars (unless 'all')
      if (isFlatSearch && term.length < 3 && !hasBlock && !hasStatus && !hasPaymentMode && !hasDate && !isSearchAll) {
        setResidents([]);
        return;
      }

      // If it's a Name search without a Block filter, require at least 3 chars (unless 'all')
      if (isNameSearch && !hasBlock && term.length < 3 && !isSearchAll) {
        setResidents([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchResidentsByFilters(searchTerm, filterBlock, filterStatus, filterPaymentMode && filterPaymentMode.length > 0 ? filterPaymentMode : 'all', hasDate);
        setResidents(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, filterBlock, filterStatus, filterPaymentMode, startDate, endDate, refreshTrigger]);

  const filteredResidents = useMemo(() => {
    let filtered = [...residents];
    if (debouncedSearchTerm && debouncedSearchTerm.trim().toLowerCase() !== 'all') {
      filtered = filtered.filter((r) => matchesFlatOrName(r, debouncedSearchTerm));
    }
    if (filterBlock !== 'all') {
      filtered = filtered.filter((r) => String(r.block) === filterBlock);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.subscriptionStatus === filterStatus);
    }
    if (filterPaymentMode && filterPaymentMode.length > 0) {
      filtered = filtered.filter((r) => {
        if (r.subscriptionStatus !== 'paid') return false;
        if (filterPaymentMode.includes('Bank')) {
          if (['UPI', 'Net Banking', 'Cheque'].includes(r.paymentMode)) return true;
        }
        return filterPaymentMode.includes(r.paymentMode);
      });
    }
    if (startDate || endDate) {
      filtered = filtered.filter((r) => {
        const dateVal = r.transactionDate || r.paymentDate || r.createdAt;
        if (!dateVal) return false;
        const dStr = dateVal.split('T')[0];
        if (startDate && dStr < startDate) return false;
        if (endDate && dStr > endDate) return false;
        return true;
      });
    }
    // Sort by block, floor, type
    filtered.sort((a, b) => {
      const getFlatStr = (r) => {
        let f = r?.flatNumber || r?.flat || '';
        if (!f && r?.block !== undefined && r?.floor !== undefined && r?.flatType) {
          f = `${r.block}-${r.floor}-${r.flatType}`;
        }
        return String(f).trim();
      };
      
      const flatA = getFlatStr(a);
      const flatB = getFlatStr(b);

      const blockA = Number(a?.block) || 0;
      const blockB = Number(b?.block) || 0;
      if (blockA !== blockB) return blockA - blockB;

      if (flatA && flatB) {
        return flatA.localeCompare(flatB, undefined, { numeric: true, sensitivity: 'base' });
      }

      const floorA = Number(a?.floor) || 0;
      const floorB = Number(b?.floor) || 0;
      if (floorA !== floorB) return floorA - floorB;

      const typeA = String(a?.flatType || '');
      const typeB = String(b?.flatType || '');
      return typeA.localeCompare(typeB);
    });
    return filtered;
  }, [residents, debouncedSearchTerm, filterBlock, filterStatus, filterPaymentMode, startDate, endDate]);

  const filteredStats = useMemo(() => {
    const total = filteredResidents.length;
    const paid = filteredResidents.filter((r) => r.subscriptionStatus === 'paid').length;
    const pending = total - paid;
    const totalAmount = filteredResidents
      .filter((r) => r.subscriptionStatus === 'paid')
      .reduce((sum, r) => sum + (Number(r.subscriptionAmount) || 0), 0);

    const cashCount = filteredResidents.filter((r) => r.subscriptionStatus === 'paid' && r.paymentMode && String(r.paymentMode).toLowerCase() === 'cash').length;
    const accountCount = paid - cashCount;

    return { total, paid, pending, totalAmount, accountCount, cashCount };
  }, [filteredResidents]);

  const isSearchActive = !!searchTerm || filterBlock !== 'all' || filterStatus !== 'all' || (filterPaymentMode && filterPaymentMode.length > 0) || !!startDate || !!endDate;

  const displayStats = isSearchActive ? filteredStats : {
    total: globalStats?.totalFlats || 0,
    paid: globalStats?.paidCount || 0,
    pending: globalStats?.pendingCount || 0,
    totalAmount: globalStats?.totalCollected || 0,
    accountCount: globalStats?.accountCount || 0,
    cashCount: globalStats?.cashCount || 0,
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterBlock('all');
    setFilterStatus('all');
    setFilterPaymentMode([]);
    setStartDate(null);
    setEndDate(null);
  };

  const hasActiveFilters = Boolean(
    searchTerm ||
    filterBlock !== 'all' ||
    filterStatus !== 'all' ||
    (filterPaymentMode && filterPaymentMode.length > 0) ||
    startDate ||
    endDate
  );

  const handleAddResident = async () => {
    startProcessing('Saving resident details...');
    try {
      if (editMode && selectedResident) {
        await updateResident(selectedResident.id, form);
      } else {
        await createResident(form);
      }
      setAddDialogOpen(false);
      resetForm();
      await loadData();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error saving resident:', error);
    } finally {
      stopProcessing();
    }
  };

  const handleRecordPayment = async () => {
    startProcessing('Recording payment...');
    try {
      await recordSubscription(selectedResident.id, paymentForm, paymentForm.proofFiles, paymentForm.existingProofs);
      setPaymentDialogOpen(false);
      setSelectedResident(null);
      setPaymentForm({ amount: config?.subscriptionAmount || 0, paymentMode: 'UPI', remarks: '', proofFiles: [], existingProofs: [], transactionDate: getLocalISODate() });
      setAllPendingResidents([]);
      await loadData();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error recording payment:', error);
    } finally {
      stopProcessing();
    }
  };

  const handleDeletePayment = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Payment',
      message: 'Are you sure you want to delete this payment? This will mark the flat as pending.',
      onConfirm: async () => {
        startProcessing('Deleting payment...');
        try {
          await deleteSubscriptionPayment(id);
          setAllPendingResidents([]);
          await loadData();
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const handleDeleteResident = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Resident',
      message: 'Are you sure you want to delete this resident? This action cannot be undone.',
      onConfirm: async () => {
        startProcessing('Deleting resident...');
        try {
          await deleteResident(id);
          await loadData();
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const openEditDialog = (resident) => {
    setForm({
      name: resident.name,
      mobile: resident.mobile,
      email: resident.email,
      block: resident.block,
      floor: resident.floor,
      flatType: resident.flatType,
      remarks: resident.remarks || '',
    });
    setSelectedResident(resident);
    setEditMode(true);
    setAddDialogOpen(true);
  };

  const openPaymentDialog = async (resident) => {
    setSelectedResident(resident);
    setPaymentForm({
      amount: resident.subscriptionAmount || config?.subscriptionAmount || '',
      paymentMode: resident.paymentMode || 'UPI',
      remarks: resident.remarks || '',
      proofFiles: [],
      existingProofs: [],
      transactionDate: resident.transactionDate ? getLocalISODate(resident.transactionDate) : (resident.paymentDate ? getLocalISODate(resident.paymentDate) : getLocalISODate()),
    });
    setPaymentDialogOpen(true);

    if (resident.paymentProofUrl) {
      const proofs = await getPaymentProof(resident.id, resident.paymentProofUrl);
      if (proofs) {
        setPaymentForm(prev => {
          if (selectedResident && selectedResident.id !== resident.id) return prev; // check if selection changed
          return {
            ...prev,
            existingProofs: Array.isArray(proofs) ? proofs : [proofs],
          };
        });
      }
    }
  };

  const resetForm = () => {
    setForm({ name: '', mobile: '', email: '', block: '', floor: '', flatType: '', remarks: '' });
    setEditMode(false);
    setSelectedResident(null);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPaymentForm((prev) => ({
        ...prev,
        proofFiles: [...(prev.proofFiles || []), ...files],
      }));
    }
  };

  const removeNewProofFile = (index) => {
    setPaymentForm(prev => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, idx) => idx !== index),
    }));
  };

  const removeExistingProof = (index) => {
    setPaymentForm(prev => ({
      ...prev,
      existingProofs: prev.existingProofs.filter((_, idx) => idx !== index),
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleShareWhatsApp = async (r) => {
    try {
      const receiptHtmlStr = getReceiptHTML(r, config, true, 'Subscription Receipt');
      const canvas = await generateImageFromHTML(receiptHtmlStr);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const file = new File([blob], `Subscription_Receipt_${r.name.replace(/\\s+/g, '_')}.jpg`, { type: 'image/jpeg' });

      const message = `🙏 Thank You from ${config?.committeeName || 'Committee'} ${config?.year || ''} 🙏

The ${config?.committeeName || 'Committee'} sincerely thanks ${r.name} for your prompt subscription payment of ₹${r.subscriptionAmount || config?.subscriptionAmount || 0} towards Durga Puja.

Your kind support and contribution inspire us to make this year's celebration even more memorable for the entire ${config?.societyName || 'society'} family.

With heartfelt gratitude.
Jai Maa Durga! 🌺🙏
— ${config?.committeeName || 'Committee'} ${config?.year || ''}`;

      if (navigator.share) {
        try {
          await navigator.clipboard.writeText(message);
        } catch (err) {
          console.warn('Clipboard write failed', err);
        }
        await navigator.share({
          files: [file],
          text: message,
          title: 'Subscription Receipt'
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      alert('Failed to share receipt. ' + error.message);
    }
  };

  return (
    <Box>
      {/* Compact Page Header & Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 1.25, sm: 2 },
          gap: { xs: 0.5, sm: 1 },
          flexWrap: 'nowrap',
          width: '100%',
        }}
      >
        {/* Left: Compact chips (never wrapping) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, minWidth: 0, flexWrap: 'nowrap', flexShrink: 1 }}>
          {displayStats && (
            <Chip
              label={`${displayStats.pending || 0} Pending`}
              size="small"
              sx={{
                height: 26,
                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                fontWeight: 700,
                backgroundColor: statusBadge.warning.bg,
                color: statusBadge.warning.text,
                whiteSpace: 'nowrap',
                '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } },
              }}
            />
          )}

          {pujaDaysToGo !== null && (
            <Chip
              icon={<EventIcon sx={{ '&&': { fontSize: 13, ml: 0.5 } }} />}
              label={
                <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
                  {pujaDaysToGo > 0 ? (
                    <>
                      {pujaDaysToGo}d<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}> to Puja</Box>
                    </>
                  ) : pujaDaysToGo === 0 ? (
                    'Today'
                  ) : (
                    'Active'
                  )}
                </Box>
              }
              size="small"
              sx={{
                height: 26,
                fontSize: { xs: '0.72rem', sm: '0.78rem' },
                fontWeight: 600,
                backgroundColor: statusBadge.info.bg,
                color: statusBadge.info.text,
                whiteSpace: 'nowrap',
                '& .MuiChip-label': { px: { xs: 0.5, sm: 1 } },
              }}
            />
          )}
        </Box>

        {/* Right: Quick Action Buttons */}
        <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, alignItems: 'center', flexShrink: 0 }}>
          {!isAuditor && (
            <Tooltip title="Pending WhatsApp Reminder">
              <Button
                variant="contained"
                size="small"
                onClick={() => handleOpenReminderDialog(filterBlock !== 'all' ? filterBlock : 'all')}
                sx={{
                  background: `${thirdParty.whatsapp} !important`,
                  backgroundColor: `${thirdParty.whatsapp} !important`,
                  backgroundImage: 'none !important',
                  color: '#fff !important',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.82rem' },
                  height: { xs: 28, sm: 32 },
                  px: { xs: 0.9, sm: 1.5 },
                  minWidth: { xs: 32, sm: 'auto' },
                  boxShadow: '0 2px 6px rgba(37, 211, 102, 0.35)',
                  '&:hover': {
                    background: '#1ebe5d !important',
                    backgroundColor: '#1ebe5d !important',
                    backgroundImage: 'none !important',
                  },
                }}
              >
                <WhatsAppIcon sx={{ fontSize: { xs: 18, sm: 18 }, mr: { xs: 0, sm: 0.75 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Reminder
                </Box>
              </Button>
            </Tooltip>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: { xs: 15, sm: 18 } }} />}
            endIcon={<ArrowDropDownIcon sx={{ fontSize: 16, ml: -0.5 }} />}
            onClick={(e) => setPrintMenuAnchor(e.currentTarget)}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              height: { xs: 28, sm: 32 },
              px: { xs: 1, sm: 1.5 },
              minWidth: 0,
            }}
          >
            Print
          </Button>

          <Menu
            anchorEl={printMenuAnchor}
            open={Boolean(printMenuAnchor)}
            onClose={() => setPrintMenuAnchor(null)}
          >
            {filterBlock !== 'all' && (
              <MenuItem
                onClick={() => {
                  setPrintMenuAnchor(null);
                  handlePrintPending(filterBlock);
                }}
              >
                <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
                <ListItemText primary={`Print Pending — Block ${filterBlock}`} />
              </MenuItem>
            )}
            <MenuItem
              onClick={() => {
                setPrintMenuAnchor(null);
                handlePrintPending('all');
              }}
            >
              <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
              <ListItemText primary="Print Pending — All Blocks" />
            </MenuItem>
            <Divider />
            <MenuItem
              onClick={() => {
                setPrintMenuAnchor(null);
                handleOpenReminderDialog(filterBlock);
              }}
            >
              <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: thirdParty.whatsapp }} /></ListItemIcon>
              <ListItemText primary="WhatsApp Reminder Dialog..." />
            </MenuItem>
          </Menu>

          {hasActiveFilters && (
            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
              sx={{
                color: 'text.secondary',
                textTransform: 'none',
                fontSize: '0.75rem',
                p: 0.5,
                minWidth: 0,
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Box>

      {/* Search & Filters */}
      <Card sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search Flat / Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              } }}
              sx={{ width: { xs: 'calc(100% - 110px)', sm: 200 }, flex: { sm: 1 } }}
            />
            <FormControl size="small" sx={{ width: { xs: '100px', sm: 120 } }}>
              <InputLabel>Block</InputLabel>
              <Select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} label="Block">
                <MenuItem value="all">All Blocks</MenuItem>
                {(config?.blocks || []).map((b) => (
                  <MenuItem key={b} value={String(b)}>Block {b}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 120 } }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Status">
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ width: { xs: 'calc(50% - 4px)', sm: 160 } }}>
              <InputLabel shrink>Payment Mode</InputLabel>
              <Select 
                multiple 
                value={filterPaymentMode} 
                label="Payment Mode" 
                onChange={(e) => {
                  const val = e.target.value;
                  let selected = typeof val === 'string' ? val.split(',') : [...val];
                  
                  const bankPreviouslySelected = filterPaymentMode.includes('Bank');
                  const bankCurrentlySelected = selected.includes('Bank');
                  
                  if (bankCurrentlySelected && !bankPreviouslySelected) {
                    selected = [...new Set([...selected, 'UPI', 'Net Banking', 'Cheque'])];
                  } else if (!bankCurrentlySelected && bankPreviouslySelected) {
                    selected = selected.filter(m => !['UPI', 'Net Banking', 'Cheque'].includes(m));
                  } else {
                    const allBankSelected = ['UPI', 'Net Banking', 'Cheque'].every(m => selected.includes(m));
                    if (allBankSelected && !bankCurrentlySelected) {
                      selected.push('Bank');
                    } else if (!allBankSelected && bankCurrentlySelected) {
                      selected = selected.filter(m => m !== 'Bank');
                    }
                  }
                  setFilterPaymentMode(selected);
                }}
                renderValue={(selected) => {
                  if (selected.length === 0) return "All Modes";
                  let toShow = [...selected];
                  if (toShow.includes('Bank')) {
                    toShow = toShow.filter(m => !['UPI', 'Net Banking', 'Cheque'].includes(m));
                  }
                  return toShow.join(', ');
                }}
                displayEmpty
              >
                {[
                  { value: 'Cash', label: 'Cash' },
                  { value: 'Bank', label: 'Bank' },
                  { value: 'UPI', label: 'UPI', isSub: true },
                  { value: 'Net Banking', label: 'Net Banking', isSub: true },
                  { value: 'Cheque', label: 'Cheque', isSub: true }
                ].map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={opt.isSub ? { pl: 4 } : {}}>
                    <Checkbox checked={filterPaymentMode.indexOf(opt.value) > -1} size="small" sx={{ py: 0 }} />
                    <ListItemText primary={opt.label} sx={{ my: 0 }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <DatePicker
              label="From Date"
              value={startDate ? new Date(startDate) : null}
              onChange={(newValue) => {
                if (newValue && !isNaN(newValue.getTime())) {
                  setStartDate(getLocalISODate(newValue));
                } else {
                  setStartDate(null);
                }
              }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: { xs: 'calc(50% - 4px)', sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
            />
            <DatePicker
              label="To Date"
              value={endDate ? new Date(endDate) : null}
              onChange={(newValue) => {
                if (newValue && !isNaN(newValue.getTime())) {
                  setEndDate(getLocalISODate(newValue));
                } else {
                  setEndDate(null);
                }
              }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: { xs: 'calc(50% - 4px)', sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
            />

          </Box>
        </CardContent>
      </Card>

      {/* Residents Table */}
      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 800, md: 1000 } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'background.paper', width: 80, minWidth: 80, borderRight: '1px solid rgba(128,128,128,0.2)' }}>Flat</TableCell>
                <TableCell sx={{ minWidth: 200, width: 220 }}>Name</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredResidents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'background.paper', borderRight: '1px solid rgba(128,128,128,0.2)' }}>
                      <Chip
                        label={resident.flatNumber}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          backgroundColor: statusBadge.info.bg,
                          color: statusBadge.info.text,
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 200, maxWidth: 220 }}>
                      <Tooltip title={resident.name}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {resident.name}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {resident.mobile}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={resident.subscriptionStatus === 'paid' ? <CheckCircleIcon /> : <PendingIcon />}
                        label={resident.subscriptionStatus === 'paid' ? 'Paid' : 'Pending'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          backgroundColor:
                            resident.subscriptionStatus === 'paid'
                              ? statusBadge.success.bg
                              : statusBadge.warning.bg,
                          color: resident.subscriptionStatus === 'paid' ? statusBadge.success.text : statusBadge.warning.text,
                          '& .MuiChip-icon': {
                            color: resident.subscriptionStatus === 'paid' ? statusBadge.success.text : statusBadge.warning.text,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {resident.subscriptionStatus === 'paid'
                        ? formatCurrency(resident.subscriptionAmount)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {resident.paymentMode || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {resident.transactionDate || resident.paymentDate
                          ? formatDate(resident.transactionDate || resident.paymentDate, config?.dateFormat)
                          : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        {!isAuditor && resident.subscriptionStatus === 'pending' && (
                          <Tooltip title="Record Payment">
                            <IconButton
                              size="small"
                              onClick={() => openPaymentDialog(resident)}
                              sx={{ color: statusBadge.success.text }}
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {resident.subscriptionStatus === 'paid' && !isAuditor && (
                          <>
                            <Tooltip title="Share to WhatsApp">
                              <IconButton size="small" onClick={() => handleShareWhatsApp(resident)} sx={{ color: thirdParty.whatsapp }}>
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {isSuperAdmin && (
                          <Tooltip title="Edit Flat">
                            <IconButton size="small" onClick={() => openEditDialog(resident)} sx={{ color: statusBadge.warning.text }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More Actions">
                          <span>
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, resident)}
                              disabled={!(resident.paymentProofUrl || (isSuperAdmin && resident.subscriptionStatus === 'paid'))}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>

                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              {filteredResidents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {(!searchTerm && filterBlock === 'all' && filterStatus === 'all' && (!filterPaymentMode || filterPaymentMode.length === 0) && !startDate && !endDate)
                        ? 'Search by Flat (e.g. 104) or Name, or select any filter above.'
                        : (searchTerm && !/^[0-9]/.test(searchTerm) && filterBlock === 'all' && searchTerm.trim().length < 3)
                          ? 'Type at least 3 characters to search by Name.'
                          : 'No matching residents found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={8} sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', py: 0.5, gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: statusBadge.info.text }}>Total Flats: {displayStats.total}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: statusBadge.success.text }}>
                      Paid: {displayStats.paid}
                      {(displayStats.accountCount > 0 || displayStats.cashCount > 0) && ` (Acc: ${displayStats.accountCount}, Cash: ${displayStats.cashCount})`}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: statusBadge.warning.text }}>Pending: {displayStats.pending}</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: statusBadge.donation.text }}>Collected: {formatCurrency(displayStats.totalAmount)}</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredResidents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: 'text.secondary',
            },
          }}
        />
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: {
          sx: { mt: 0.5, minWidth: 150 }
        } }}
      >
        {actionResident?.paymentProofUrl && (
          <MenuItem key="view-proof" onClick={async () => {
            handleMenuClose();
            const imgs = await getPaymentProof(actionResident.id, actionResident.paymentProofUrl);
            if (imgs && imgs.length > 0) {
              setProofImages(imgs);
              setProofDialogOpen(true);
            }
          }}>
            <ListItemIcon><ImageIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
            <ListItemText>View Proof</ListItemText>
          </MenuItem>
        )}
        {isSuperAdmin && actionResident?.subscriptionStatus === 'paid' && (
          <>
            <MenuItem key="edit-payment" onClick={() => { openPaymentDialog(actionResident); handleMenuClose(); }}>
              <ListItemIcon><EditIcon fontSize="small" sx={{ color: statusBadge.success.text }} /></ListItemIcon>
              <ListItemText>Edit Payment</ListItemText>
            </MenuItem>
            <MenuItem key="undo-payment" onClick={() => { handleDeletePayment(actionResident.id); handleMenuClose(); }}>
              <ListItemIcon><UndoIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
              <ListItemText>Undo Payment</ListItemText>
            </MenuItem>
          </>
        )}
        {/* Delete flat hidden for now
        {isSuperAdmin && (
          <>
            <MenuItem key="delete-flat" onClick={() => { handleDeleteResident(actionResident.id); handleMenuClose(); }}>
              <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
              <ListItemText>Delete Flat</ListItemText>
            </MenuItem>
          </>
        )}
        */}
      </Menu>

      {/* Add/Edit Resident Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); resetForm(); }}
        maxWidth="sm"
        fullWidth
      >
        {addDialogOpen && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {editMode ? 'Edit Flat Owner' : 'Register New Flat Owner'}
              </Typography>
              <IconButton onClick={() => { setAddDialogOpen(false); resetForm(); }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Owner Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Block</InputLabel>
                    <Select value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} label="Block">
                      {(config?.blocks || []).map((b) => (
                        <MenuItem key={b} value={b}>Block {b}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Floor</InputLabel>
                    <Select value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} label="Floor">
                      {(config?.floors || []).map((f) => (
                        <MenuItem key={f} value={f}>Floor {f}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Type</InputLabel>
                    <Select value={form.flatType} onChange={(e) => setForm({ ...form, flatType: e.target.value })} label="Type">
                      {(config?.flatTypes || []).map((t) => (
                        <MenuItem key={t} value={t}>Type {t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Mobile Number"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={form.remarks}
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => { setAddDialogOpen(false); resetForm(); }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleAddResident}
                disabled={!form.name || !form.block || !form.floor || !form.flatType}
              >
                {editMode ? 'Update' : 'Register'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {paymentDialogOpen && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                  Record Subscription Payment
                </Typography>
                {selectedResident && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedResident.name} — {selectedResident.flatNumber}
                  </Typography>
                )}
              </Box>
              <IconButton onClick={() => setPaymentDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 6 }}>
                  <TextField fullWidth label="Amount" type="number" value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <DatePicker
                    label="Transaction Date"
                    value={new Date(paymentForm.transactionDate)}
                    onChange={(newValue) => {
                      if (newValue && !isNaN(newValue.getTime())) {
                        setPaymentForm({ ...paymentForm, transactionDate: getLocalISODate(newValue) });
                      }
                    }}
                    format={getDatePickerFormat(config?.dateFormat)}
                    sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Mode</InputLabel>
                    <Select
                      value={paymentForm.paymentMode}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                      label="Payment Mode"
                    >
                      {PAYMENT_MODES.map((mode) => (
                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                    Upload Payment Proof (Screenshots)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<CameraIcon />}
                        fullWidth
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
                      >
                        Camera
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          capture="environment"
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Grid>
                    <Grid size={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        fullWidth
                        sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
                      >
                        Gallery
                        <input
                          type="file"
                          hidden
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Grid>
                  </Grid>
                </Grid>
                {((paymentForm.existingProofs && paymentForm.existingProofs.length > 0) || (paymentForm.proofFiles && paymentForm.proofFiles.length > 0)) && (
                  <Grid size={12}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      Attached Proofs:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      {paymentForm.existingProofs && paymentForm.existingProofs.map((img, idx) => (
                        <Box key={`exist-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                          <img src={img} alt="Existing proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                          <IconButton
                            size="small"
                            onClick={() => removeExistingProof(idx)}
                            sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}
                          >
                            <CloseIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      ))}
                      {paymentForm.proofFiles && paymentForm.proofFiles.map((file, idx) => {
                        const localUrl = URL.createObjectURL(file);
                        return (
                          <Box key={`new-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                            <img src={localUrl} alt="New proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                            <IconButton
                              size="small"
                              onClick={() => removeNewProofFile(idx)}
                              sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}
                            >
                              <CloseIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  </Grid>
                )}
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    multiline
                    rows={2}
                    value={paymentForm.remarks}
                    onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleRecordPayment}
                disabled={!(Number(paymentForm.amount) > 0) || !paymentForm.paymentMode}
                startIcon={<RupeeIcon />}
              >
                Record Payment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={proofDialogOpen}
        onClose={() => setProofDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {proofDialogOpen && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="span">Payment Proof</Typography>
              <IconButton onClick={() => setProofDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                p: 2,
                textAlign: 'center',
                maxHeight: '80vh',
                overflowY: 'auto',
              }}
            >
              {proofImages && proofImages.map((img, idx) => (
                <Box key={idx} sx={{ mb: idx === proofImages.length - 1 ? 0 : 3, position: 'relative' }}>
                  {proofImages.length > 1 && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                      Image {idx + 1} of {proofImages.length}
                    </Typography>
                  )}
                  <img
                    src={img}
                    alt={`Payment Proof ${idx + 1}`}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '70vh',
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                  />
                </Box>
              ))}
            </DialogContent>
          </>
        )}
      </Dialog>


      {/* Pending Reminder & Sharing Dialog */}
      <PendingReminderDialog
        open={reminderDialogOpen}
        onClose={() => setReminderDialogOpen(false)}
        initialBlock={reminderInitialBlock}
        config={config}
        allPendingResidents={allPendingResidents}
        onPrintPending={handlePrintPending}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default Subscriptions;
