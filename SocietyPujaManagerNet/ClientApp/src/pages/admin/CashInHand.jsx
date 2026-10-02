import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Tooltip,
  Fade,
  TablePagination,
  Chip,
  LinearProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Tabs,
  Tab,
  Drawer,
  Divider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CurrencyRupee as RupeeIcon,
  Phone as PhoneIcon,
  Payments as CashIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  getAllCashMembers,
  addCashMember,
  updateCashMember,
  deleteCashMember,
  addMemberCash,
  subtractMemberCash,
  transferCashBetweenMembers,
  getAllCashTransactions,
  updateCashTransaction,
  deleteCashTransaction,
  getCashStats,
} from '../../services/cashInHandService';
import { getMasterConfig } from '../../services/masterConfigService';
import { useDebounce } from '../../hooks/useDebounce';
import {
  brand,
  statusBadge,
  cashInHandPalette,
} from '../../theme/colorTokens';
import {
  getLocalISODate,
  formatDate,
  getDatePickerFormat,
} from '../../utils/dateUtils';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(val || 0);

const COMMON_ROLES = [
  'Treasurer',
  'Joint Treasurer',
  'Secretary',
  'Joint Secretary',
  'President',
  'Vice President',
  'Convenor',
  'Joint Convenor',
  'Food Committee',
  'Cultural Committee',
  'Collection Incharge',
  'Puja Committee',
  'Executive Member',
  'Member',
];

const PRESET_ADD_REASONS = [
  'Bank Withdrawal (Cheque to Cash)',
  'Food Stall Collection',
  'Subscription / Donation Collection',
  'Sponsorship Cash Received',
  'Handover from Member',
  'Opening Balance',
  'Misc Cash Received',
];

const PRESET_SUBTRACT_REASONS = [
  'Puja Samagri / Flowers / Fruits',
  'Priest Dakshina / Purohit',
  'Dhaki / Musicians Payment',
  'Labor & Immersion (Visarjan)',
  'Vendor Cash Advance / Payment',
  'Food & Refreshments Expense',
  'Logistics / Transportation',
  'Electrical & Sound Expense',
  'Deposited into Bank Account',
  'Handover to Member',
  'Misc Cash Expense',
];

const PRESET_AMOUNTS = [100, 200, 500, 1000, 5000];

const CashInHand = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdmin = user?.role === 'Admin';
  const isTreasurer = user?.role === 'Treasurer';
  const canManage = isSuperAdmin || isAdmin || isTreasurer;

  const [activeTab, setActiveTab] = useState(0); // 0: Members, 1: Ledger
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [balanceFilter, setBalanceFilter] = useState('All');

  // Pagination for members
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Pagination for transactions
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(50);
  const [txTypeFilter, setTxTypeFilter] = useState('All');

  // Dialog states
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'Member',
    initialBalance: '',
    notes: '',
  });

  // Date filter for Ledger
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Add / Subtract Cash Dialog
  const [cashAdjustOpen, setCashAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState('ADD');
  const [selectedMember, setSelectedMember] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    amount: '',
    reason: '',
    notes: '',
    date: getLocalISODate(),
  });

  // Transfer Dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromMemberId: '',
    toMemberId: '',
    amount: '',
    reason: '',
    notes: '',
    date: getLocalISODate(),
  });

  // Edit Transaction Dialog
  const [editTxDialogOpen, setEditTxDialogOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({
    amount: '',
    reason: '',
    notes: '',
    date: getLocalISODate(),
  });

  // Member Ledger Drawer
  const [drawerMember, setDrawerMember] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Row Action Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuMember, setMenuMember] = useState(null);

  // Confirm Dialog
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, txData, configData] = await Promise.all([
        getAllCashMembers(),
        getAllCashTransactions(),
        getMasterConfig().catch(() => null),
      ]);
      setMembers(membersData || []);
      setTransactions(txData || []);
      setConfig(configData);
    } catch (err) {
      console.error('Error loading cash data:', err);
      enqueueSnackbar(err.message || 'Failed to load cash in hand data', {
        variant: 'error',
        key: 'cash-in-hand-load-error',
        preventDuplicate: true,
      });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Stats
  const stats = useMemo(() => {
    return getCashStats(members, transactions);
  }, [members, transactions]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    let result = [...members];

    if (balanceFilter === 'HasCash') {
      result = result.filter((m) => (Number(m.currentBalance) || 0) > 0);
    } else if (balanceFilter === 'Zero') {
      result = result.filter((m) => (Number(m.currentBalance) || 0) === 0);
    }

    if (debouncedSearchTerm) {
      const query = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(query) ||
          (m.phone || '').toLowerCase().includes(query) ||
          (m.role || '').toLowerCase().includes(query)
      );
    }

    return result;
  }, [members, balanceFilter, debouncedSearchTerm]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (txTypeFilter !== 'All') {
      result = result.filter((t) => t.type === txTypeFilter);
    }
    if (startDate) {
      const s = getLocalISODate(startDate);
      result = result.filter((t) => (t.date || t.createdAt || '') >= s);
    }
    if (endDate) {
      const e = getLocalISODate(endDate);
      result = result.filter((t) => (t.date || t.createdAt || '').slice(0, 10) <= e);
    }
    if (debouncedSearchTerm) {
      const query = debouncedSearchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          (t.memberName || '').toLowerCase().includes(query) ||
          (t.reason || '').toLowerCase().includes(query) ||
          (t.notes || '').toLowerCase().includes(query) ||
          (t.toMemberName || '').toLowerCase().includes(query) ||
          (t.fromMemberName || '').toLowerCase().includes(query)
      );
    }
    return result;
  }, [transactions, txTypeFilter, startDate, endDate, debouncedSearchTerm]);

  // Suggestions for autocomplete from userRoles
  const userSuggestions = useMemo(() => {
    if (!config?.userRoles) return [];
    return config.userRoles
      .filter((u) => u.isActive !== false)
      .map((u) => ({
        name: u.fullName || u.email,
        phone: u.phone || '',
        email: u.email || '',
        role: u.role || 'Member',
      }));
  }, [config]);

  // Handlers for Member Dialog
  const handleOpenAddMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      phone: '',
      email: '',
      role: 'Member',
      initialBalance: '',
      notes: '',
    });
    setMemberDialogOpen(true);
  };

  const handleOpenEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      phone: member.phone || '',
      email: member.email || '',
      role: member.role || 'Member',
      initialBalance: '',
      notes: member.notes || '',
    });
    setMemberDialogOpen(true);
  };

  const handleSaveMember = async () => {
    if (!memberForm.name.trim()) {
      enqueueSnackbar('Member name is required', { variant: 'warning' });
      return;
    }

    try {
      if (editingMember) {
        await updateCashMember(editingMember.id, memberForm);
        enqueueSnackbar('Member updated successfully', { variant: 'success' });
      } else {
        const recordedBy = user?.displayName || user?.fullName || user?.email || 'Admin';
        await addCashMember(memberForm, recordedBy);
        enqueueSnackbar('Member added successfully', { variant: 'success' });
      }
      setMemberDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error saving member:', err);
      enqueueSnackbar(err.message || 'Failed to save member', { variant: 'error' });
    }
  };

  const handleDeleteMember = (member) => {
    const hasBalance = (Number(member.currentBalance) || 0) > 0;
    setConfirmDialog({
      open: true,
      title: 'Remove Member',
      message: hasBalance
        ? `Warning: ${member.name} still has ${formatCurrency(member.currentBalance)} in cash! Are you sure you want to remove this member?`
        : `Are you sure you want to remove ${member.name}?`,
      onConfirm: async () => {
        try {
          await deleteCashMember(member.id);
          enqueueSnackbar('Member removed successfully', { variant: 'success' });
          setConfirmDialog((p) => ({ ...p, open: false }));
          await loadData();
        } catch (err) {
          console.error('Error deleting member:', err);
          enqueueSnackbar('Failed to remove member', { variant: 'error' });
        }
      },
    });
  };

  // Handlers for Cash Adjustment (Add/Subtract)
  const handleOpenCashAdjust = (member, type = 'ADD') => {
    setSelectedMember(member);
    setAdjustType(type);
    setAdjustForm({
      amount: '',
      reason: '',
      notes: '',
      date: getLocalISODate(),
    });
    setCashAdjustOpen(true);
  };

  const handleSaveCashAdjust = async () => {
    const amt = Number(adjustForm.amount);
    if (!amt || amt <= 0) {
      enqueueSnackbar('Please enter a valid positive amount', { variant: 'warning' });
      return;
    }

    if (adjustType === 'SUBTRACT' && amt > (Number(selectedMember.currentBalance) || 0)) {
      if (!window.confirm(`Notice: Subtracting ${formatCurrency(amt)} exceeds current cash of ${formatCurrency(selectedMember.currentBalance)}. Balance will become negative. Continue?`)) {
        return;
      }
    }

    try {
      const payload = {
        memberId: selectedMember.id,
        amount: amt,
        date: adjustForm.date,
        reason: adjustForm.reason || (adjustType === 'ADD' ? 'Cash Received' : 'Cash Disbursed'),
        notes: adjustForm.notes,
        recordedBy: user?.displayName || user?.fullName || user?.email || 'Admin',
      };

      if (adjustType === 'ADD') {
        await addMemberCash(payload);
        enqueueSnackbar(`Added ${formatCurrency(amt)} to ${selectedMember.name}`, { variant: 'success' });
      } else {
        await subtractMemberCash(payload);
        enqueueSnackbar(`Subtracted ${formatCurrency(amt)} from ${selectedMember.name}`, { variant: 'info' });
      }

      setCashAdjustOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error adjusting cash:', err);
      enqueueSnackbar(err.message || 'Transaction failed', { variant: 'error' });
    }
  };

  // Handlers for Transfer
  const handleOpenTransfer = (defaultFromMember = null) => {
    setTransferForm({
      fromMemberId: defaultFromMember?.id || (members[0]?.id || ''),
      toMemberId: '',
      amount: '',
      reason: 'Handover between members',
      notes: '',
      date: getLocalISODate(),
    });
    setTransferOpen(true);
  };

  const handleSaveTransfer = async () => {
    const amt = Number(transferForm.amount);
    if (!transferForm.fromMemberId || !transferForm.toMemberId) {
      enqueueSnackbar('Please select both sender and receiver', { variant: 'warning' });
      return;
    }
    if (transferForm.fromMemberId === transferForm.toMemberId) {
      enqueueSnackbar('Sender and receiver must be different members', { variant: 'warning' });
      return;
    }
    if (!amt || amt <= 0) {
      enqueueSnackbar('Please enter a valid transfer amount', { variant: 'warning' });
      return;
    }

    const fromM = members.find((m) => m.id === transferForm.fromMemberId);
    if (fromM && amt > (Number(fromM.currentBalance) || 0)) {
      if (!window.confirm(`Notice: Transfer amount ${formatCurrency(amt)} exceeds ${fromM.name}'s balance of ${formatCurrency(fromM.currentBalance)}. Proceed anyway?`)) {
        return;
      }
    }

    try {
      await transferCashBetweenMembers({
        fromMemberId: transferForm.fromMemberId,
        toMemberId: transferForm.toMemberId,
        amount: amt,
        date: transferForm.date,
        reason: transferForm.reason,
        notes: transferForm.notes,
        recordedBy: user?.displayName || user?.fullName || user?.email || 'Admin',
      });

      enqueueSnackbar(`Successfully transferred ${formatCurrency(amt)}`, { variant: 'success' });
      setTransferOpen(false);
      await loadData();
    } catch (err) {
      console.error('Transfer failed:', err);
      enqueueSnackbar(err.message || 'Transfer failed', { variant: 'error' });
    }
  };

  // Handlers for Edit Transaction
  const handleOpenEditTx = (tx) => {
    setEditingTx(tx);
    setEditTxForm({
      amount: String(tx.amount || ''),
      reason: tx.reason || '',
      notes: tx.notes || '',
      date: tx.date || getLocalISODate(),
    });
    setEditTxDialogOpen(true);
  };

  const handleSaveEditTx = async () => {
    const amt = Number(editTxForm.amount);
    if (!amt || amt <= 0) {
      enqueueSnackbar('Please enter a valid positive amount', { variant: 'warning' });
      return;
    }

    try {
      const recordedBy = user?.displayName || user?.fullName || user?.email || 'Admin';
      await updateCashTransaction(
        editingTx.id,
        {
          amount: amt,
          date: editTxForm.date,
          reason: editTxForm.reason,
          notes: editTxForm.notes,
        },
        recordedBy
      );
      enqueueSnackbar('Entry updated successfully', { variant: 'success' });
      setEditTxDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error('Error updating transaction:', err);
      enqueueSnackbar(err.message || 'Failed to update entry', { variant: 'error' });
    }
  };

  // Handlers for Member Ledger Drawer
  const handleOpenLedger = (member) => {
    setDrawerMember(member);
    setDrawerOpen(true);
  };

  // Handlers for Delete Transaction (Super Admin)
  const handleDeleteTx = (tx) => {
    if (!isSuperAdmin) return;
    setConfirmDialog({
      open: true,
      title: 'Reverse / Delete Transaction',
      message: `Are you sure you want to delete this ${tx.type} transaction of ${formatCurrency(tx.amount)}? The member's balance will be automatically adjusted to revert this entry.`,
      onConfirm: async () => {
        try {
          await deleteCashTransaction(tx.id);
          enqueueSnackbar('Transaction reverted successfully', { variant: 'success' });
          setConfirmDialog((p) => ({ ...p, open: false }));
          await loadData();
        } catch (err) {
          console.error('Error deleting transaction:', err);
          enqueueSnackbar('Failed to revert transaction', { variant: 'error' });
        }
      },
    });
  };

  // Computed preview for adjustment
  const previewBalance = useMemo(() => {
    if (!selectedMember) return 0;
    const cur = Number(selectedMember.currentBalance) || 0;
    const amt = Number(adjustForm.amount) || 0;
    return adjustType === 'ADD' ? cur + amt : cur - amt;
  }, [selectedMember, adjustType, adjustForm.amount]);

  // Drawer Member transactions
  const drawerTransactions = useMemo(() => {
    if (!drawerMember) return [];
    return transactions.filter((t) => t.memberId === drawerMember.id);
  }, [drawerMember, transactions]);

  const getTxChip = (type) => {
    switch (type) {
      case 'ADD':
        return <Chip size="small" icon={<ArrowDownwardIcon sx={{ fontSize: '14px !important' }} />} label="Added (+)" sx={{ bgcolor: cashInHandPalette.added.bg, color: cashInHandPalette.added.color, fontWeight: 700 }} />;
      case 'SUBTRACT':
        return <Chip size="small" icon={<ArrowUpwardIcon sx={{ fontSize: '14px !important' }} />} label="Subtracted (-)" sx={{ bgcolor: cashInHandPalette.subtracted.bg, color: cashInHandPalette.subtracted.color, fontWeight: 700 }} />;
      case 'TRANSFER_IN':
        return <Chip size="small" icon={<TransferIcon sx={{ fontSize: '14px !important' }} />} label="Transfer In (+)" sx={{ bgcolor: cashInHandPalette.transfer.bg, color: cashInHandPalette.transfer.color, fontWeight: 700 }} />;
      case 'TRANSFER_OUT':
        return <Chip size="small" icon={<TransferIcon sx={{ fontSize: '14px !important' }} />} label="Transfer Out (-)" sx={{ bgcolor: statusBadge.warning.bg, color: statusBadge.warning.text, fontWeight: 700 }} />;
      default:
        return <Chip size="small" label={type} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100dvh - 80px)', sm: 'calc(100vh - 85px)' }, overflow: 'hidden' }}>
      {loading && <LinearProgress sx={{ mb: 2, flexShrink: 0 }} />}

      {/* KPI Stats Cards - following Leads.jsx standard */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}>
        {[
          {
            label: 'Total Cash in Hand',
            value: formatCurrency(stats.totalCashInHand),
            color: cashInHandPalette.total.color,
            icon: <CashIcon />,
            xs: 6,
          },
          {
            label: 'Active Cash Holders',
            value: `${stats.activeHoldersCount} / ${stats.totalMembers}`,
            color: cashInHandPalette.members.color,
            icon: <PersonIcon />,
            xs: 6,
          },
          {
            label: 'Total Added (Inflow)',
            value: formatCurrency(stats.totalAdded),
            color: statusBadge.success.text,
            icon: <TrendingUpIcon />,
            xs: 6,
          },
          {
            label: 'Total Spent (Outflow)',
            value: formatCurrency(stats.totalSubtracted),
            color: statusBadge.error.text,
            icon: <TrendingDownIcon />,
            xs: 6,
          },
        ].map((s, i) => (
          <Grid key={i} size={{ xs: s.xs, sm: 6, md: 3 }}>
            <Fade in timeout={400 + i * 100}>
              <Card
                sx={{
                  textAlign: { xs: 'left', sm: 'center' },
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg, ${s.color}, ${s.color}88)`,
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } }, display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: 'center', gap: { xs: 1, sm: 0 } }}>
                  <Box
                    sx={{
                      width: { xs: 32, sm: 36 },
                      height: { xs: 32, sm: 36 },
                      borderRadius: '8px',
                      background: `${s.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: { xs: 0, sm: 'auto' },
                      mb: { xs: 0, sm: 1 },
                      flexShrink: 0,
                    }}
                  >
                    {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: { xs: 16, sm: 20 } } })}
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, fontSize: { xs: '0.85rem', sm: '1.15rem' }, lineHeight: 1.2 }}>
                      {s.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {s.label}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Toolbar Card - responsive layout */}
      <Card sx={{ mb: { xs: 1.5, md: 3 }, flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
          <Stack spacing={1}>
            {/* 1st Row: Tabs, Search & Type/Filter, and Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              {/* Tabs */}
              <Tabs
                value={activeTab}
                onChange={(_, v) => {
                  setActiveTab(v);
                  setSearchTerm('');
                }}
                sx={{
                  order: 1,
                  minHeight: 38,
                  flexShrink: 0,
                  '& .MuiTab-root': {
                    minHeight: 38,
                    py: 0.5,
                    px: { xs: 1.25, sm: 2 },
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  },
                }}
              >
                <Tab label={`Members (${members.length})`} />
                <Tab label={`Ledger (${transactions.length})`} />
              </Tabs>

              {/* Search & Filter / Type controls */}
              {activeTab === 0 ? (
                <>
                  <TextField
                    size="small"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      order: { xs: 3, md: 2 },
                      flex: { xs: '1 1 calc(60% - 8px)', sm: '1 1 160px', md: '1 1 200px' },
                      minWidth: { xs: 130, sm: 160 },
                      maxWidth: { md: 280 },
                    }}
                  />

                  <FormControl
                    size="small"
                    sx={{
                      order: { xs: 4, md: 3 },
                      width: { xs: 'calc(40% - 8px)', sm: 130 },
                      minWidth: { xs: 100, sm: 120 },
                      flexShrink: 0,
                    }}
                  >
                    <InputLabel>Filter</InputLabel>
                    <Select value={balanceFilter} label="Filter" onChange={(e) => setBalanceFilter(e.target.value)}>
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="HasCash">Holding Cash</MenuItem>
                      <MenuItem value="Zero">Zero Balance</MenuItem>
                    </Select>
                  </FormControl>
                </>
              ) : (
                <>
                  <TextField
                    size="small"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      order: { xs: 3, md: 2 },
                      flex: { xs: '1 1 calc(60% - 8px)', sm: '1 1 160px', md: '1 1 200px' },
                      minWidth: { xs: 130, sm: 160 },
                      maxWidth: { md: 280 },
                    }}
                  />

                  <FormControl
                    size="small"
                    sx={{
                      order: { xs: 4, md: 3 },
                      width: { xs: 'calc(40% - 8px)', sm: 130 },
                      minWidth: { xs: 100, sm: 120 },
                      flexShrink: 0,
                    }}
                  >
                    <InputLabel>Type</InputLabel>
                    <Select value={txTypeFilter} label="Type" onChange={(e) => setTxTypeFilter(e.target.value)}>
                      <MenuItem value="All">All Types</MenuItem>
                      <MenuItem value="ADD">Added (+)</MenuItem>
                      <MenuItem value="SUBTRACT">Subtracted (-)</MenuItem>
                      <MenuItem value="TRANSFER_IN">Transfer In</MenuItem>
                      <MenuItem value="TRANSFER_OUT">Transfer Out</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}

              {/* Action buttons */}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{
                  order: { xs: 2, md: 4 },
                  ml: { xs: 'auto', md: 'auto' },
                  flexShrink: 0,
                }}
              >
                <Tooltip title="Refresh">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      loadData();
                    }}
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                {canManage && (
                  <>
                    <Tooltip title="Transfer Cash Between Members">
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleOpenTransfer()}
                        disabled={members.length < 2}
                        sx={{ minWidth: { xs: 36, sm: 'auto' }, px: { xs: 1, sm: 1.5 }, whiteSpace: 'nowrap' }}
                      >
                        <TransferIcon sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: 18 }} />
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Transfer</Box>
                      </Button>
                    </Tooltip>

                    <Tooltip title="Add Member">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleOpenAddMember}
                        sx={{ minWidth: { xs: 36, sm: 'auto' }, px: { xs: 1, sm: 2 }, whiteSpace: 'nowrap' }}
                      >
                        <AddIcon sx={{ mr: { xs: 0, sm: 0.5 }, fontSize: 18 }} />
                        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Member</Box>
                      </Button>
                    </Tooltip>
                  </>
                )}
              </Stack>
            </Box>

            {/* 2nd Row: Date Range Filter for Ledger */}
            {activeTab === 1 && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap',
                  pt: 0.5,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    display: { xs: 'none', sm: 'inline-flex' },
                    alignItems: 'center',
                    mr: 0.5,
                  }}
                >
                  Date Range:
                </Typography>
                <DatePicker
                  label="From Date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  format={getDatePickerFormat(config?.dateFormat)}
                  sx={{ width: { xs: 'calc(50% - 4px)', sm: 150 } }}
                  slotProps={{ actionBar: { actions: ['clear', 'accept'] }, textField: { size: 'small', fullWidth: true } }}
                />

                <DatePicker
                  label="To Date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  format={getDatePickerFormat(config?.dateFormat)}
                  sx={{ width: { xs: 'calc(50% - 4px)', sm: 150 } }}
                  slotProps={{ actionBar: { actions: ['clear', 'accept'] }, textField: { size: 'small', fullWidth: true } }}
                />

                {(startDate || endDate) && (
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                    }}
                    sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.5 }}
                  >
                    Clear Dates
                  </Button>
                )}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Main Table Card - following Leads.jsx standard */}
      <Card sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        {activeTab === 0 ? (
          /* ================= MEMBERS VIEW ================= */
          <>
            <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { whiteSpace: 'nowrap', py: { xs: 0.75, sm: 1 }, fontWeight: 600 } }}>
                    <TableCell>Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Role</TableCell>
                    <TableCell align="right">Cash in Hand</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Last Activity</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Notes</TableCell>
                    {canManage && (
                      <TableCell
                        align="right"
                        sx={{
                          position: 'sticky',
                          right: 0,
                          zIndex: 4,
                          backgroundColor: 'background.paper',
                          borderLeft: '1px solid rgba(128,128,128,0.2)',
                          width: 80,
                          minWidth: 80,
                        }}
                      >
                        Actions
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {loading ? 'Loading...' : 'No cash members found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMembers
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((m) => {
                        const bal = Number(m.currentBalance) || 0;
                        const hasPositiveCash = bal > 0;
                        const isZero = bal === 0;

                        return (
                          <TableRow key={m.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {m.name}
                              </Typography>
                              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                  {m.role || 'Member'}
                                </Typography>
                              </Box>
                              {m.email && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}>
                                  {m.email}
                                </Typography>
                              )}
                            </TableCell>

                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>
                              <Chip label={m.role || 'Member'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                            </TableCell>

                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: hasPositiveCash
                                    ? cashInHandPalette.total.color
                                    : isZero
                                    ? 'text.secondary'
                                    : statusBadge.error.text,
                                }}
                              >
                                {formatCurrency(bal)}
                              </Typography>
                            </TableCell>

                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {formatDate(m.lastTransactionAt || m.createdAt, config?.dateFormat)}
                              </Typography>
                            </TableCell>

                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Tooltip title={m.notes || 'No notes'}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 160,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {m.notes || '—'}
                                </Typography>
                              </Tooltip>
                            </TableCell>

                            {canManage && (
                              <TableCell
                                align="right"
                                sx={{
                                  position: 'sticky',
                                  right: 0,
                                  zIndex: 1,
                                  backgroundColor: 'background.paper',
                                  borderLeft: '1px solid rgba(128,128,128,0.2)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Tooltip title="Actions">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      setAnchorEl(e.currentTarget);
                                      setMenuMember(m);
                                    }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredMembers.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredMembers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelRowsPerPage="Rows:"
                sx={{ flexShrink: 0 }}
              />
            )}
          </>
        ) : (
          /* ================= LEDGER VIEW ================= */
          <>
            <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { whiteSpace: 'nowrap', py: { xs: 0.75, sm: 1 }, fontWeight: 600 } }}>
                    <TableCell>Date</TableCell>
                    <TableCell>Member</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Balance After</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Notes</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Recorded By</TableCell>
                    {canManage && (
                      <TableCell
                        align="right"
                        sx={{
                          position: 'sticky',
                          right: 0,
                          zIndex: 4,
                          backgroundColor: 'background.paper',
                          borderLeft: '1px solid rgba(128,128,128,0.2)',
                          width: 80,
                          minWidth: 80,
                        }}
                      >
                        Actions
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 9 : 8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {loading ? 'Loading...' : 'No transactions found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions
                      .slice(txPage * txRowsPerPage, txPage * txRowsPerPage + txRowsPerPage)
                      .map((t) => {
                        const isAdd = t.type === 'ADD' || t.type === 'TRANSFER_IN';
                        return (
                          <TableRow key={t.id} hover>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {formatDate(t.date || t.createdAt, config?.dateFormat)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{t.memberName}</Typography>
                              {t.toMemberName && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  To: {t.toMemberName}
                                </Typography>
                              )}
                              {t.fromMemberName && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  From: {t.fromMemberName}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>{getTxChip(t.type)}</TableCell>
                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                  color: isAdd ? statusBadge.success.text : statusBadge.error.text,
                                }}
                              >
                                {isAdd ? '+' : '-'} {formatCurrency(t.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>
                              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                {t.balanceAfter !== undefined ? formatCurrency(t.balanceAfter) : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}><Typography variant="body2">{t.reason || '—'}</Typography></TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <Tooltip title={t.notes || 'No notes'}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: 160,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {t.notes || '—'}
                                </Typography>
                              </Tooltip>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {t.recordedBy || 'Admin'}
                              </Typography>
                            </TableCell>
                            {canManage && (
                              <TableCell
                                align="right"
                                sx={{
                                  position: 'sticky',
                                  right: 0,
                                  zIndex: 1,
                                  backgroundColor: 'background.paper',
                                  borderLeft: '1px solid rgba(128,128,128,0.2)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Tooltip title="Edit Entry">
                                  <IconButton size="small" onClick={() => handleOpenEditTx(t)} color="primary">
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                {isSuperAdmin && (
                                  <Tooltip title="Revert Entry">
                                    <IconButton size="small" onClick={() => handleDeleteTx(t)} sx={{ color: statusBadge.error.text }}>
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredTransactions.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredTransactions.length}
                rowsPerPage={txRowsPerPage}
                page={txPage}
                onPageChange={(_, p) => setTxPage(p)}
                onRowsPerPageChange={(e) => {
                  setTxRowsPerPage(parseInt(e.target.value, 10));
                  setTxPage(0);
                }}
                labelRowsPerPage="Rows:"
                sx={{ flexShrink: 0 }}
              />
            )}
          </>
        )}
      </Card>

      {/* ================= ADD / EDIT MEMBER DIALOG ================= */}
      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingMember ? 'Edit Cash Member' : 'Add Cash Member'}
          <IconButton size="small" onClick={() => setMemberDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <Autocomplete
                freeSolo
                options={userSuggestions}
                getOptionLabel={(option) => (typeof option === 'string' ? option : option.name)}
                value={memberForm.name}
                onInputChange={(_, newInputValue) => {
                  setMemberForm((prev) => ({ ...prev, name: newInputValue }));
                }}
                onChange={(_, newValue) => {
                  if (newValue && typeof newValue === 'object') {
                    setMemberForm((prev) => ({
                      ...prev,
                      name: newValue.name,
                      phone: newValue.phone || prev.phone,
                      email: newValue.email || prev.email,
                      role: newValue.role || prev.role,
                    }));
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} fullWidth label="Member Name *" placeholder="Type name or select member" autoFocus />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={COMMON_ROLES}
                value={memberForm.role}
                onInputChange={(_, val) => setMemberForm((p) => ({ ...p, role: val }))}
                renderInput={(params) => <TextField {...params} fullWidth label="Role / Designation" placeholder="e.g. Treasurer" />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Contact Number"
                value={memberForm.phone}
                onChange={(e) => setMemberForm((p) => ({ ...p, phone: e.target.value }))}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: editingMember ? 12 : 6 }}>
              <TextField
                fullWidth
                label="Email (Optional)"
                value={memberForm.email}
                onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
              />
            </Grid>

            {!editingMember && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Initial Cash in Hand"
                  type="number"
                  value={memberForm.initialBalance}
                  onChange={(e) => setMemberForm((p) => ({ ...p, initialBalance: e.target.value }))}
                  placeholder="0"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  helperText="Initial cash currently held (recorded as opening balance)"
                />
              </Grid>
            )}

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Remarks / Notes"
                value={memberForm.notes}
                onChange={(e) => setMemberForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Any specific instructions or notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMember} disabled={!memberForm.name.trim()}>
            {editingMember ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= ADD / SUBTRACT CASH DIALOG ================= */}
      <Dialog open={cashAdjustOpen} onClose={() => setCashAdjustOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {adjustType === 'ADD' ? 'Add Cash' : 'Subtract Cash'}
          <IconButton size="small" onClick={() => setCashAdjustOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <ToggleButtonGroup
              value={adjustType}
              exclusive
              onChange={(_, next) => {
                if (next) {
                  setAdjustType(next);
                  setAdjustForm((p) => ({ ...p, reason: '' }));
                }
              }}
              fullWidth
              size="small"
            >
              <ToggleButton value="ADD" sx={{ textTransform: 'none', fontWeight: 600 }}>
                <AddIcon sx={{ mr: 0.5, fontSize: 18 }} /> Add Cash
              </ToggleButton>
              <ToggleButton value="SUBTRACT" sx={{ textTransform: 'none', fontWeight: 600 }}>
                <RemoveIcon sx={{ mr: 0.5, fontSize: 18 }} /> Subtract Cash
              </ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Member</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{selectedMember?.name}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Current Cash</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: cashInHandPalette.total.color }}>
                  {formatCurrency(selectedMember?.currentBalance)}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              autoFocus
              label="Amount *"
              type="number"
              value={adjustForm.amount}
              onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))}
              placeholder="e.g. 5000"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {PRESET_AMOUNTS.map((amt) => (
                <Chip
                  key={amt}
                  label={`+₹${amt.toLocaleString('en-IN')}`}
                  size="small"
                  onClick={() => {
                    const current = Number(adjustForm.amount) || 0;
                    setAdjustForm((p) => ({ ...p, amount: String(current + amt) }));
                  }}
                  clickable
                />
              ))}
            </Box>

            {adjustForm.amount && (
              <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Resulting Balance:</Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: adjustType === 'ADD' ? statusBadge.success.text : statusBadge.error.text,
                  }}
                >
                  {formatCurrency(previewBalance)}
                </Typography>
              </Box>
            )}

            <DatePicker
              label="Transaction Date"
              value={adjustForm.date ? new Date(adjustForm.date + 'T00:00:00') : null}
              onChange={(newValue) => {
                if (newValue && !isNaN(newValue.getTime())) {
                  setAdjustForm((p) => ({ ...p, date: getLocalISODate(newValue) }));
                }
              }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: '100%' }}
              slotProps={{
                actionBar: { actions: ['today', 'clear', 'cancel', 'accept'] },
                textField: { fullWidth: true, size: 'small' },
              }}
            />

            <Autocomplete
              freeSolo
              options={adjustType === 'ADD' ? PRESET_ADD_REASONS : PRESET_SUBTRACT_REASONS}
              value={adjustForm.reason}
              onInputChange={(_, val) => setAdjustForm((p) => ({ ...p, reason: val }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label={adjustType === 'ADD' ? 'Source / Reason' : 'Purpose / Expense'}
                  placeholder="Select or enter reason"
                />
              )}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks / Bill / Voucher No."
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Cheque #10245, Cash handover receipt"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCashAdjustOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={adjustType === 'ADD' ? 'success' : 'error'}
            onClick={handleSaveCashAdjust}
            disabled={!adjustForm.amount || Number(adjustForm.amount) <= 0}
          >
            {adjustType === 'ADD' ? 'Add Cash' : 'Subtract Cash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= TRANSFER CASH DIALOG ================= */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Transfer Cash Between Members
          <IconButton size="small" onClick={() => setTransferOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>From Member (Sender) *</InputLabel>
                <Select
                  value={transferForm.fromMemberId}
                  label="From Member (Sender) *"
                  onChange={(e) => setTransferForm((p) => ({ ...p, fromMemberId: e.target.value }))}
                >
                  {members.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span>{m.name}</span>
                        <Typography variant="caption" sx={{ color: cashInHandPalette.total.color, fontWeight: 700 }}>
                          {formatCurrency(m.currentBalance)}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>To Member (Recipient) *</InputLabel>
                <Select
                  value={transferForm.toMemberId}
                  label="To Member (Recipient) *"
                  onChange={(e) => setTransferForm((p) => ({ ...p, toMemberId: e.target.value }))}
                >
                  {members
                    .filter((m) => m.id !== transferForm.fromMemberId)
                    .map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span>{m.name}</span>
                          <Typography variant="caption" sx={{ color: cashInHandPalette.total.color, fontWeight: 700 }}>
                            {formatCurrency(m.currentBalance)}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Transfer Amount *"
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Transfer Date"
                value={transferForm.date ? new Date(transferForm.date + 'T00:00:00') : null}
                onChange={(newValue) => {
                  if (newValue && !isNaN(newValue.getTime())) {
                    setTransferForm((p) => ({ ...p, date: getLocalISODate(newValue) }));
                  }
                }}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }}
                slotProps={{
                  actionBar: { actions: ['today', 'clear', 'cancel', 'accept'] },
                  textField: { fullWidth: true, size: 'small' },
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Reason / Purpose"
                value={transferForm.reason}
                onChange={(e) => setTransferForm((p) => ({ ...p, reason: e.target.value }))}
                placeholder="e.g. Handover for vendor advance"
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Remarks"
                value={transferForm.notes}
                onChange={(e) => setTransferForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Additional details..."
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTransferOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTransfer}
            disabled={!transferForm.amount || !transferForm.fromMemberId || !transferForm.toMemberId}
          >
            Transfer
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= EDIT CASH ENTRY DIALOG ================= */}
      <Dialog open={editTxDialogOpen} onClose={() => setEditTxDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Edit Entry
            </Typography>
            {editingTx && getTxChip(editingTx.type)}
          </Box>
          <IconButton size="small" onClick={() => setEditTxDialogOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {editingTx && (
              <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Member</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{editingTx.memberName}</Typography>
                {editingTx.toMemberName && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Recipient: {editingTx.toMemberName}
                  </Typography>
                )}
                {editingTx.fromMemberName && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Sender: {editingTx.fromMemberName}
                  </Typography>
                )}
              </Box>
            )}

            <TextField
              fullWidth
              autoFocus
              label="Amount *"
              type="number"
              value={editTxForm.amount}
              onChange={(e) => setEditTxForm((p) => ({ ...p, amount: e.target.value }))}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <DatePicker
              label="Transaction Date"
              value={editTxForm.date ? new Date(editTxForm.date + 'T00:00:00') : null}
              onChange={(newValue) => {
                if (newValue && !isNaN(newValue.getTime())) {
                  setEditTxForm((p) => ({ ...p, date: getLocalISODate(newValue) }));
                }
              }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: '100%' }}
              slotProps={{
                actionBar: { actions: ['today', 'clear', 'cancel', 'accept'] },
                textField: { fullWidth: true, size: 'small' },
              }}
            />

            <Autocomplete
              freeSolo
              options={
                editingTx?.type === 'ADD'
                  ? PRESET_ADD_REASONS
                  : editingTx?.type === 'SUBTRACT'
                  ? PRESET_SUBTRACT_REASONS
                  : []
              }
              value={editTxForm.reason}
              onInputChange={(_, val) => setEditTxForm((p) => ({ ...p, reason: val }))}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Reason / Purpose"
                  placeholder="Select or enter reason"
                />
              )}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Remarks / Notes"
              value={editTxForm.notes}
              onChange={(e) => setEditTxForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="e.g. Receipt #, description"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditTxDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEditTx}
            disabled={!editTxForm.amount || Number(editTxForm.amount) <= 0}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= MEMBER LEDGER DRAWER ================= */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: '100%', sm: 460 }, p: 2 } } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Member Cash Ledger
          </Typography>
          <IconButton size="small" onClick={() => setDrawerOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {drawerMember && (
          <Card variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {drawerMember.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {drawerMember.role} {drawerMember.phone ? `• ${drawerMember.phone}` : ''}
                </Typography>
              </Box>
              <Chip label={drawerMember.status || 'Active'} size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Balance in Hand:
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: (Number(drawerMember.currentBalance) || 0) > 0 ? cashInHandPalette.total.color : 'text.secondary',
                }}
              >
                {formatCurrency(drawerMember.currentBalance)}
              </Typography>
            </Box>

            {canManage && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="success"
                  onClick={() => {
                    setDrawerOpen(false);
                    handleOpenCashAdjust(drawerMember, 'ADD');
                  }}
                >
                  <AddIcon sx={{ fontSize: 16, mr: 0.5 }} /> Add
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setDrawerOpen(false);
                    handleOpenCashAdjust(drawerMember, 'SUBTRACT');
                  }}
                >
                  <RemoveIcon sx={{ fontSize: 16, mr: 0.5 }} /> Subtract
                </Button>
              </Stack>
            )}
          </Card>
        )}

        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Transactions ({drawerTransactions.length})
        </Typography>

        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {drawerTransactions.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', py: 4, textAlign: 'center' }}>
              No transactions recorded for this member yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {drawerTransactions.map((tx) => {
                const isAdd = tx.type === 'ADD' || tx.type === 'TRANSFER_IN';
                return (
                  <Card key={tx.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTxChip(tx.type)}
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {formatDate(tx.date || tx.createdAt, config?.dateFormat)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: isAdd ? statusBadge.success.text : statusBadge.error.text,
                            mr: 0.5,
                          }}
                        >
                          {isAdd ? '+' : '-'} {formatCurrency(tx.amount)}
                        </Typography>
                        {canManage && (
                          <Tooltip title="Edit Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditTx(tx)}
                              sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {isSuperAdmin && (
                          <Tooltip title="Revert Entry">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTx(tx)}
                              sx={{ p: 0.5, color: statusBadge.error.text }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {tx.reason}
                    </Typography>

                    {tx.notes && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                        {tx.notes}
                      </Typography>
                    )}

                    <Divider sx={{ my: 0.75 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Balance: {tx.balanceAfter !== undefined ? formatCurrency(tx.balanceAfter) : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        By: {tx.recordedBy || 'Admin'}
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* ================= ROW ACTIONS MENU ================= */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        disableRestoreFocus
        disableScrollLock
      >
        {canManage && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleOpenCashAdjust(menuMember, 'ADD');
            }}
          >
            <ListItemIcon>
              <AddIcon fontSize="small" sx={{ color: statusBadge.success.text }} />
            </ListItemIcon>
            <ListItemText>Add Cash</ListItemText>
          </MenuItem>
        )}

        {canManage && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleOpenCashAdjust(menuMember, 'SUBTRACT');
            }}
          >
            <ListItemIcon>
              <RemoveIcon fontSize="small" sx={{ color: statusBadge.error.text }} />
            </ListItemIcon>
            <ListItemText>Subtract Cash</ListItemText>
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            handleOpenTransfer(menuMember);
          }}
        >
          <ListItemIcon>
            <TransferIcon fontSize="small" sx={{ color: cashInHandPalette.transfer.color }} />
          </ListItemIcon>
          <ListItemText>Transfer Cash</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            handleOpenLedger(menuMember);
          }}
        >
          <ListItemIcon>
            <HistoryIcon fontSize="small" sx={{ color: brand.orange }} />
          </ListItemIcon>
          <ListItemText>View Ledger</ListItemText>
        </MenuItem>

        {canManage && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleOpenEditMember(menuMember);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" sx={{ color: statusBadge.info.text }} />
            </ListItemIcon>
            <ListItemText>Edit Member</ListItemText>
          </MenuItem>
        )}

        {isSuperAdmin && (
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              handleDeleteMember(menuMember);
            }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} />
            </ListItemIcon>
            <ListItemText sx={{ color: statusBadge.error.text }}>Remove Member</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((p) => ({ ...p, open: false }))}
      />
    </Box>
  );
};

export default CashInHand;
