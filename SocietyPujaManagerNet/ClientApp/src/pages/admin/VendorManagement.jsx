import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Grid, FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, Tooltip, Fade, TablePagination, Chip, LinearProgress, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, CurrencyRupee as RupeeIcon, Phone as PhoneIcon,
  Payment as PaymentIcon, Store as StoreIcon, Email as EmailIcon,
  LocationOn as LocationIcon, Handshake as HandshakeIcon,
  AccountBalanceWallet as WalletIcon, TrendingDown as BalanceIcon,
  PhotoCamera as CameraIcon, CloudUpload as UploadIcon, Image as ImageIcon,
  Description as DescriptionIcon, Print as PrintIcon, MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import {
  createVendor, updateVendor, deleteVendor, getAllVendors,
  addVendorPayment, deleteVendorPayment, updateVendorPayment,
} from '../../services/vendorService';
import { createExpense, updateExpense, deleteExpense } from '../../services/expenseService';
import { getMasterConfig } from '../../services/masterConfigService';
import { getLocalISODate, formatShortDate, getDatePickerFormat } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useProcessing } from '../../contexts/ProcessingContext';
import { getPaymentProof } from '../../services/firebase';
import { printHTML } from '../../utils/print/core';
import { getVendorsReportHTML } from '../../utils/print/templates/vendorReportTemplate';
import { useDebounce } from '../../hooks/useDebounce';
import { brand, status, statusBadge } from '../../theme/colorTokens';

const PAYMENT_MODES = ['UPI', 'Cash', 'Cheque', 'Net Banking'];

const formatCurrency = (a) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a || 0);

const getTotalPaid = (vendor) =>
  (vendor.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

const VendorManagement = () => {
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const isSuperAdmin = user?.role === 'Super Admin';

  const [vendors, setVendors] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Vendor form dialog
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    vendorFor: '', name: '', contact: '', email: '', address: '', dealAmount: '', expenseCategory: '', expenseSubCategory: ''
  });

  // Payment tracker dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    date: getLocalISODate(), amount: '', mode: 'Cash', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null
  });
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [savingPayment, setSavingPayment] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofImages, setProofImages] = useState([]);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Menu states
  const [vendorAnchorEl, setVendorAnchorEl] = useState(null);
  const [actionVendor, setActionVendor] = useState(null);
  const handleVendorMenuOpen = (e, vendor) => { e.stopPropagation(); setVendorAnchorEl(e.currentTarget); setActionVendor(vendor); };
  const handleVendorMenuClose = () => { setVendorAnchorEl(null); setActionVendor(null); };

  const [paymentAnchorEl, setPaymentAnchorEl] = useState(null);
  const [actionPayment, setActionPayment] = useState(null);
  const handlePaymentMenuOpen = (e, payment) => { e.stopPropagation(); setPaymentAnchorEl(e.currentTarget); setActionPayment(payment); };
  const handlePaymentMenuClose = () => { setPaymentAnchorEl(null); setActionPayment(null); };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [data, masterConfig] = await Promise.all([
        getAllVendors(),
        getMasterConfig()
      ]);
      setVendors(data);
      setConfig(masterConfig);
    } catch (error) { console.error('Error loading vendors:', error); }
    finally { setLoading(false); }
  };

  // Stats
  const stats = useMemo(() => {
    const totalVendors = vendors.length;
    const totalDealAmount = vendors.reduce((s, v) => s + (Number(v.dealAmount) || 0), 0);
    const totalPaid = vendors.reduce((s, v) => s + getTotalPaid(v), 0);
    const totalBalance = totalDealAmount - totalPaid;
    return { totalVendors, totalDealAmount, totalPaid, totalBalance };
  }, [vendors]);

  // Filter
  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];
    if (debouncedSearchTerm) {
      const t = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(v =>
        (v.vendorFor || '').toLowerCase().includes(t) ||
        (v.name || '').toLowerCase().includes(t) ||
        (v.contact || '').toLowerCase().includes(t)
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [vendors, debouncedSearchTerm]);

  const handlePrint = () => {
    if (!filteredVendors || filteredVendors.length === 0) {
      alert('No vendors to print');
      return;
    }
    const html = getVendorsReportHTML(filteredVendors, config);
    printHTML(html);
  };

  // ──────── Vendor CRUD ────────
  const resetVendorForm = () => {
    setEditId(null);
    setVendorForm({ vendorFor: '', name: '', contact: '', email: '', address: '', description: '', dealAmount: '', expenseCategory: '', expenseSubCategory: '', proofFiles: [], existingProofs: [], dealImageUrl: null });
  };

  const handleSaveVendor = async () => {
    startProcessing('Saving vendor...');
    try {
      if (editId) {
        await updateVendor(editId, { ...vendorForm, dealAmount: Number(vendorForm.dealAmount) }, vendorForm.proofFiles, vendorForm.existingProofs);
      } else {
        await createVendor({ ...vendorForm, dealAmount: Number(vendorForm.dealAmount) }, vendorForm.proofFiles);
      }
      setVendorDialogOpen(false);
      resetVendorForm();
      await loadData();
    } catch (error) { console.error('Error saving vendor:', error); }
    finally { stopProcessing(); }
  };

  const handleEditVendor = async (vendor) => {
    setEditId(vendor.id);
    setVendorForm({
      vendorFor: vendor.vendorFor || '',
      name: vendor.name || '',
      contact: vendor.contact || '',
      email: vendor.email || '',
      address: vendor.address || '',
      description: vendor.description || '',
      dealAmount: vendor.dealAmount || '',
      expenseCategory: vendor.expenseCategory || '',
      expenseSubCategory: vendor.expenseSubCategory || '',
      proofFiles: [],
      existingProofs: [],
      dealImageUrl: vendor.dealImageUrl || null,
    });
    setVendorDialogOpen(true);

    if (vendor.dealImageUrl) {
      const proofs = await getPaymentProof(`vendor_${vendor.id}`, vendor.dealImageUrl);
      if (proofs) {
        setVendorForm(prev => {
          if (prev.dealImageUrl !== vendor.dealImageUrl) return prev;
          return { ...prev, existingProofs: Array.isArray(proofs) ? proofs : [proofs] };
        });
      }
    }
  };

  const handleDealFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setVendorForm(prev => ({ ...prev, proofFiles: [...(prev.proofFiles || []), ...files] }));
    }
  };

  const removeNewDealFile = (index) => {
    setVendorForm(prev => ({ ...prev, proofFiles: prev.proofFiles.filter((_, i) => i !== index) }));
  };

  const removeExistingDealProof = (index) => {
    setVendorForm(prev => ({ ...prev, existingProofs: prev.existingProofs.filter((_, i) => i !== index) }));
  };

  const handleDeleteVendor = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Vendor',
      message: 'Are you sure you want to delete this vendor and all its payment records? This action cannot be undone.',
      onConfirm: async () => {
        startProcessing('Deleting vendor...');
        try {
          await deleteVendor(id);
          await loadData();
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  // ──────── Payment Management ────────
  const openPaymentDialog = (vendor) => {
    setSelectedVendor(vendor);
    setEditPaymentId(null);
    setPaymentForm({ date: getLocalISODate(), amount: '', mode: 'Cash', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null });
    setPaymentDialogOpen(true);
  };

  const handleEditPaymentClick = async (payment) => {
    setEditPaymentId(payment.id);
    setPaymentForm({
      date: payment.date || getLocalISODate(),
      amount: payment.amount || '',
      mode: payment.mode || 'Cash',
      remarks: payment.remarks || '',
      proofFiles: [],
      existingProofs: [],
      paymentProofUrl: payment.paymentProofUrl || null,
    });

    if (payment.paymentProofUrl) {
      const proofId = `vendor_${selectedVendor.id}_payment_${payment.id}`;
      const proofs = await getPaymentProof(proofId, payment.paymentProofUrl);
      if (proofs) {
        setPaymentForm(prev => {
          if (prev.paymentProofUrl !== payment.paymentProofUrl) return prev;
          return { ...prev, existingProofs: Array.isArray(proofs) ? proofs : [proofs] };
        });
      }
    }
  };

  const handlePaymentFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setPaymentForm(prev => ({ ...prev, proofFiles: [...(prev.proofFiles || []), ...files] }));
    }
  };

  const removeNewPaymentFile = (index) => {
    setPaymentForm(prev => ({ ...prev, proofFiles: prev.proofFiles.filter((_, i) => i !== index) }));
  };

  const removeExistingPaymentProof = (index) => {
    setPaymentForm(prev => ({ ...prev, existingProofs: prev.existingProofs.filter((_, i) => i !== index) }));
  };

  const handleSavePayment = async () => {
    if (!selectedVendor || !paymentForm.amount) return;
    setSavingPayment(true);
    startProcessing('Saving payment...');
    try {
      const paymentData = { ...paymentForm, amount: Number(paymentForm.amount) };
      if (editPaymentId) {
        const existingPayment = selectedVendor.payments.find(p => p.id === editPaymentId);
        if (existingPayment?.expenseId) {
          await updateExpense(existingPayment.expenseId, {
            payeeName: paymentData.mode === 'Cash' ? 'Cash Fund' : 'DPC Account',
            category: selectedVendor.expenseCategory,
            subCategory: selectedVendor.expenseSubCategory,
            amount: Number(paymentData.amount),
            paymentMode: paymentData.mode,
            remarks: `${selectedVendor.name}${paymentData.remarks ? ` - ${paymentData.remarks}` : ''}`,
            expenseDate: paymentData.date
          }, paymentData.proofFiles, paymentData.existingProofs);
        }
        await updateVendorPayment(selectedVendor.id, editPaymentId, paymentData, paymentData.proofFiles, paymentData.existingProofs);
      } else {
        let expenseId = null;
        if (selectedVendor.expenseCategory) {
          const expense = await createExpense({
            payeeName: paymentData.mode === 'Cash' ? 'Cash Fund' : 'DPC Account',
            category: selectedVendor.expenseCategory,
            subCategory: selectedVendor.expenseSubCategory,
            amount: Number(paymentData.amount),
            paymentMode: paymentData.mode,
            remarks: `${selectedVendor.name}${paymentData.remarks ? ` - ${paymentData.remarks}` : ''}`,
            expenseDate: paymentData.date
          }, paymentData.proofFiles);
          expenseId = expense.id;
        }
        await addVendorPayment(selectedVendor.id, { ...paymentData, expenseId }, paymentData.proofFiles);
      }
      
      await loadData();
      const updated = (await getAllVendors()).find(v => v.id === selectedVendor.id);
      setSelectedVendor(updated);
      setEditPaymentId(null);
      setPaymentForm({ date: getLocalISODate(), amount: '', mode: 'Cash', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null });
    } catch (error) { console.error('Error saving payment:', error); }
    finally { 
      setSavingPayment(false);
      stopProcessing();
    }
  };

  const handleDeletePayment = (paymentId) => {
    const payment = selectedVendor.payments.find(p => p.id === paymentId);
    setConfirmDialog({
      open: true,
      title: 'Delete Payment',
      message: 'Are you sure you want to delete this payment record?' + (payment?.expenseId ? ' This will also delete the linked Expense.' : ''),
      onConfirm: async () => {
        startProcessing('Deleting payment...');
        try {
          if (payment?.expenseId) {
            await deleteExpense(payment.expenseId);
          }
          await deleteVendorPayment(selectedVendor.id, paymentId);
          await loadData();
          const updated = (await getAllVendors()).find(v => v.id === selectedVendor.id);
          setSelectedVendor(updated);
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      },
    });
  };

  // ──────── Render ────────
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100dvh - 80px)', sm: 'calc(100vh - 85px)' }, overflow: 'hidden' }}>
      {loading && <LinearProgress sx={{ mb: 2, flexShrink: 0 }} />}

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}>
        {[
          { label: 'Total Deal Amount', value: formatCurrency(stats.totalDealAmount), color: brand.orange, icon: <HandshakeIcon />, xs: 12 },
          { label: 'Total Paid', value: formatCurrency(stats.totalPaid), color: statusBadge.success.text, icon: <WalletIcon />, xs: 6 },
          { label: 'Balance Due', value: formatCurrency(stats.totalBalance), color: stats.totalBalance > 0 ? statusBadge.error.text : statusBadge.success.text, icon: <BalanceIcon />, xs: 6 },
        ].map((s, i) => (
          <Grid key={s.label} size={{ xs: s.xs, sm: 4 }}>
            <Fade in timeout={400 + i * 100}>
              <Card sx={{ textAlign: { xs: 'left', sm: 'center' }, position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` } }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } }, display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: 'center', gap: { xs: 1, sm: 0 } }}>
                  <Box sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, borderRadius: '8px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: { xs: 0, sm: 'auto' }, mb: { xs: 0, sm: 1 }, flexShrink: 0 }}>
                    {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: { xs: 16, sm: 20 } } })}
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, fontSize: { xs: '0.85rem', sm: '1.15rem' }, lineHeight: 1.2 }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      {/* Search & Add */}
      <Card sx={{ mb: { xs: 1.5, md: 3 }, flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search vendor..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: { xs: 20, sm: 24 } }} /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            {isSuperAdmin && (
              <Tooltip title="Add Vendor">
                <Button variant="contained" onClick={() => { resetVendorForm(); setVendorDialogOpen(true); }} sx={{ minWidth: { xs: 40, sm: 'auto' }, px: { xs: 0, sm: 2 } }}>
                  <AddIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Vendor</Box>
                </Button>
              </Tooltip>
            )}
            <Tooltip title="Print">
              <Button variant="outlined" onClick={handlePrint} color="inherit" sx={{ borderColor: 'rgba(255,255,255,0.2)', minWidth: { xs: 40, sm: 'auto' }, px: { xs: 0, sm: 2 } }}>
                <PrintIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Print</Box>
              </Button>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Vendor For</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="right">Deal Amount</TableCell>
                <TableCell align="right">Total Paid</TableCell>
                <TableCell align="right">Balance</TableCell>
                {isSuperAdmin && <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 4, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {loading ? 'Loading...' : 'No vendors found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((v) => {
                  const totalPaid = getTotalPaid(v);
                  const balance = (v.dealAmount || 0) - totalPaid;
                  return (
                    <TableRow key={v.id} hover sx={{ cursor: 'pointer' }} onClick={() => openPaymentDialog(v)}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{v.vendorFor || '—'}</Typography>
                      </TableCell>
                      <TableCell>{v.name || '—'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2">{v.contact || '—'}</Typography>
                          {v.contact && (
                            <Tooltip title={`Call ${v.contact}`}>
                              <IconButton
                                size="small"
                                component="a"
                                href={`tel:${v.contact}`}
                                onClick={(e) => e.stopPropagation()}
                                sx={{ color: statusBadge.success.text, p: 0.5 }}
                              >
                                <PhoneIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {v.dealAmount ? (
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(v.dealAmount)}</Typography>
                        ) : (
                          <Chip label="Pay as you go" size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 22, borderColor: statusBadge.slate.text, color: statusBadge.slate.text }} />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ color: statusBadge.success.text, fontWeight: 600 }}>{formatCurrency(totalPaid)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        {v.dealAmount ? (
                          <Chip
                            label={formatCurrency(balance)}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              backgroundColor: balance > 0 ? statusBadge.error.bg : statusBadge.success.bg,
                              color: balance > 0 ? statusBadge.error.text : statusBadge.success.text,
                              border: `1px solid ${balance > 0 ? `${statusBadge.error.text}4D` : `${statusBadge.success.text}4D`}`,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            <Tooltip title="Payments">
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openPaymentDialog(v); }} sx={{ color: statusBadge.purple.text }}>
                                <PaymentIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="More Actions">
                              <IconButton size="small" onClick={(e) => handleVendorMenuOpen(e, v)}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredVendors.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredVendors.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Rows:"
            sx={{ flexShrink: 0 }}
          />
        )}
      </Card>

      {/* ──────── Add/Edit Vendor Dialog ──────── */}
      <Dialog 
        open={vendorDialogOpen} 
        onClose={() => setVendorDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        {vendorDialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editId ? 'Edit Vendor' : 'Add New Vendor'}
          <IconButton onClick={() => setVendorDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={12}>
              <TextField fullWidth label="Vendor For *" placeholder="e.g. Pandal Decoration, Lighting, Sound System"
                value={vendorForm.vendorFor} onChange={(e) => setVendorForm(prev => ({ ...prev, vendorFor: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Vendor Name *" value={vendorForm.name}
                onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Contact Number" value={vendorForm.contact}
                onChange={(e) => setVendorForm(prev => ({ ...prev, contact: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Email" value={vendorForm.email}
                onChange={(e) => setVendorForm(prev => ({ ...prev, email: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Deal Amount" type="number" value={vendorForm.dealAmount}
                onChange={(e) => setVendorForm(prev => ({ ...prev, dealAmount: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
                helperText="Leave empty for pay-as-you-go"
              />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Address" value={vendorForm.address} multiline rows={2}
                onChange={(e) => setVendorForm(prev => ({ ...prev, address: e.target.value }))}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Mapped Expense Category</InputLabel>
                <Select
                  value={vendorForm.expenseCategory}
                  onChange={(e) => setVendorForm({ ...vendorForm, expenseCategory: e.target.value, expenseSubCategory: '' })}
                  label="Mapped Expense Category"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {config?.expenseCategories?.filter(c => c.active !== false).map(c => (
                    <MenuItem key={c.id || c.name || c.category} value={c.id || c.name || c.category}>{c.name || c.category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth disabled={!vendorForm.expenseCategory}>
                <InputLabel>Mapped Sub-Category</InputLabel>
                <Select
                  value={vendorForm.expenseSubCategory}
                  onChange={(e) => setVendorForm({ ...vendorForm, expenseSubCategory: e.target.value })}
                  label="Mapped Sub-Category"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {config?.expenseCategories?.find(c => (c.id || c.name || c.category) === vendorForm.expenseCategory)?.subCategories?.filter(s => s.active !== false).map(s => (
                    <MenuItem key={s.id || s.name || s} value={s.id || s.name || s}>{s.name || s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Description / Deal Info" value={vendorForm.description} multiline rows={3}
                onChange={(e) => setVendorForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter deal details, terms, conditions, or any notes about this vendor..."
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Attach Deal Image (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Button variant="outlined" component="label" startIcon={<CameraIcon />} fullWidth
                    sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                    Camera
                    <input type="file" hidden accept="image/*" capture="environment" onChange={handleDealFileChange} />
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button variant="outlined" component="label" startIcon={<UploadIcon />} fullWidth
                    sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}>
                    Gallery
                    <input type="file" hidden multiple accept="image/*" onChange={handleDealFileChange} />
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            {((vendorForm.existingProofs && vendorForm.existingProofs.length > 0) || (vendorForm.proofFiles && vendorForm.proofFiles.length > 0)) && (
              <Grid size={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Attached Images:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {vendorForm.existingProofs && vendorForm.existingProofs.map((img, idx) => (
                    <Box key={`exist-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={img} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                      <IconButton size="small" onClick={() => removeExistingDealProof(idx)}
                        sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                  {vendorForm.proofFiles && vendorForm.proofFiles.map((file, idx) => (
                    <Box key={`new-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={URL.createObjectURL(file)} alt="New" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                      <IconButton size="small" onClick={() => removeNewDealFile(idx)}
                        sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}>
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setVendorDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveVendor}
            disabled={!vendorForm.vendorFor.trim() || !vendorForm.name.trim()}>
            {editId ? 'Update' : 'Add Vendor'}
          </Button>
        </DialogActions>
          </>
        )}
      </Dialog>

      {/* ──────── Payment Tracker Dialog ──────── */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={() => setPaymentDialogOpen(false)} 
        maxWidth="xl" 
        fullWidth
        slotProps={{ paper: {
          sx: {
            m: { xs: 1, md: 2 },
            width: '100%',
            height: 'calc(100% - 32px)',
            maxHeight: 'none',
            display: 'flex',
            flexDirection: 'column',
          }
        } }}
      >
        {paymentDialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              {selectedVendor?.name || 'Vendor'} — Payments
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {selectedVendor?.vendorFor}
            </Typography>
          </Box>
          <IconButton onClick={() => setPaymentDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedVendor && (
            <>
              {/* Vendor Summary Header */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={4}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'rgba(255,143,0,0.06)' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: brand.orange, fontSize: '1rem' }}>{selectedVendor.dealAmount ? formatCurrency(selectedVendor.dealAmount) : 'Pay as you go'}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Deal Amount</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={4}>
                  <Card sx={{ textAlign: 'center', bgcolor: 'rgba(102,187,106,0.06)' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: statusBadge.success.text, fontSize: '1rem' }}>{formatCurrency(getTotalPaid(selectedVendor))}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Total Paid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={4}>
                  {(() => {
                    const hasDeal = !!selectedVendor.dealAmount;
                    const bal = hasDeal ? (selectedVendor.dealAmount - getTotalPaid(selectedVendor)) : 0;
                    return (
                      <Card sx={{ textAlign: 'center', bgcolor: hasDeal ? (bal > 0 ? 'rgba(239,83,80,0.06)' : 'rgba(102,187,106,0.06)') : 'rgba(120,144,156,0.06)' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="h6" sx={{ fontWeight: 800, color: hasDeal ? (bal > 0 ? statusBadge.error.text : statusBadge.success.text) : statusBadge.slate.text, fontSize: '1rem' }}>{hasDeal ? formatCurrency(bal) : '—'}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Balance</Typography>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </Grid>
              </Grid>

              {/* Add Payment Form (Super Admin only) */}
              {isSuperAdmin && (
                <Card sx={{ mb: 2, bgcolor: 'rgba(124,77,255,0.04)', border: '1px solid rgba(124,77,255,0.15)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: statusBadge.purple.text }}>Add Payment</Typography>
                    <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                      <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                        <DatePicker
                          label="Date"
                          value={paymentForm.date ? new Date(paymentForm.date + 'T00:00:00') : null}
                          onChange={(val) => setPaymentForm(prev => ({ ...prev, date: val ? getLocalISODate(val) : getLocalISODate() }))}
                          sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small', fullWidth: true } }}
                          format={getDatePickerFormat(config?.dateFormat)}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <TextField size="small" fullWidth label="Amount" type="number" value={paymentForm.amount}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                          slotProps={{ input: { startAdornment: <InputAdornment position="start"><RupeeIcon sx={{ fontSize: 16 }} /></InputAdornment> } }}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Mode</InputLabel>
                          <Select value={paymentForm.mode} label="Mode"
                            onChange={(e) => setPaymentForm(prev => ({ ...prev, mode: e.target.value }))}>
                            {PAYMENT_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 12, md: 5 }}>
                        <TextField size="small" fullWidth label="Remarks" value={paymentForm.remarks}
                          onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                        />
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
                              <input type="file" hidden accept="image/*" capture="environment" onChange={handlePaymentFileChange} />
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
                              <input type="file" hidden multiple accept="image/*" onChange={handlePaymentFileChange} />
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
                              <Box key={`exist-pay-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                                <img src={img} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                                <IconButton size="small" onClick={() => removeExistingPaymentProof(idx)}
                                  sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}>
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            ))}
                            {paymentForm.proofFiles && paymentForm.proofFiles.map((file, idx) => (
                              <Box key={`new-pay-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                                <img src={URL.createObjectURL(file)} alt="New" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                                <IconButton size="small" onClick={() => removeNewPaymentFile(idx)}
                                  sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: status.error.main(true), color: 'white', '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}>
                                  <CloseIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        </Grid>
                      )}
                      <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button variant="contained" onClick={handleSavePayment}
                          disabled={!paymentForm.amount || savingPayment} startIcon={editPaymentId ? <EditIcon /> : <AddIcon />}
                          sx={{ minWidth: 120, height: 40, bgcolor: editPaymentId ? statusBadge.info.text : statusBadge.purple.text, '&:hover': { bgcolor: editPaymentId ? status.info.dark(true) : statusBadge.purple.dark } }}>
                          {editPaymentId ? 'Update' : 'Add'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Payment History */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Mode</TableCell>
                      <TableCell>Remarks</TableCell>
                      {isSuperAdmin && <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Action</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(!selectedVendor.payments || selectedVendor.payments.length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={isSuperAdmin ? 6 : 5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No payments recorded yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      [...(selectedVendor.payments || [])]
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .map((p, idx) => (
                          <TableRow key={p.id}>
                            <TableCell>{idx + 1}</TableCell>
                            <TableCell>{formatShortDate(p.date, config?.dateFormat)}</TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.success.text }}>{formatCurrency(p.amount)}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={p.mode} size="small" variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 22,
                                  borderColor: p.mode === 'Cash' ? statusBadge.warning.text : p.mode === 'UPI' ? statusBadge.purple.text : statusBadge.info.text,
                                  color: p.mode === 'Cash' ? statusBadge.warning.text : p.mode === 'UPI' ? statusBadge.purple.text : statusBadge.info.text,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{p.remarks || '—'}</Typography>
                            </TableCell>
                            {isSuperAdmin && (
                              <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                                  {p.paymentProofUrl && (
                                    <Tooltip title="View Proof">
                                      <IconButton size="small" onClick={async () => {
                                        const imgs = await getPaymentProof(`vendor_${selectedVendor.id}_payment_${p.id}`, p.paymentProofUrl);
                                        if (imgs && imgs.length > 0) {
                                          setProofImages(imgs);
                                          setProofDialogOpen(true);
                                        }
                                      }} sx={{ color: statusBadge.success.text }}>
                                        <ImageIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="More Actions">
                                    <IconButton size="small" onClick={(e) => handlePaymentMenuOpen(e, p)}>
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPaymentDialogOpen(false)}>Close</Button>
        </DialogActions>
          </>
        )}
      </Dialog>

      {/* Proof Viewer Dialog */}
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
            <DialogContent sx={{ p: 2, textAlign: 'center', maxHeight: '80vh', overflowY: 'auto' }}>
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
                    style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
                  />
                </Box>
              ))}
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      <Menu
        anchorEl={vendorAnchorEl}
        open={Boolean(vendorAnchorEl)}
        onClose={handleVendorMenuClose}
        disableRestoreFocus
        disableScrollLock
      >
        <MenuItem onClick={() => {
          handleVendorMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handleEditVendor(actionVendor), 0);
        }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
          <ListItemText>Edit Vendor</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleVendorMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handleDeleteVendor(actionVendor?.id), 0);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
          <ListItemText>Delete Vendor</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={paymentAnchorEl}
        open={Boolean(paymentAnchorEl)}
        onClose={handlePaymentMenuClose}
        disableRestoreFocus
        disableScrollLock
      >
        <MenuItem onClick={() => {
          handlePaymentMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handleEditPaymentClick(actionPayment), 0);
        }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
          <ListItemText>Edit Payment</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handlePaymentMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handleDeletePayment(actionPayment?.id), 0);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
          <ListItemText>Delete Payment</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default VendorManagement;
