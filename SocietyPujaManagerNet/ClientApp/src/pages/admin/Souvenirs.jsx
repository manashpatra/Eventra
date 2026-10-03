import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, MenuItem, Grid, FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, Tooltip, Fade, Autocomplete, TablePagination, Menu, ListItemIcon, ListItemText } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, MenuBook as SouvenirIcon, CurrencyRupee as RupeeIcon,
  Image as ImageIcon, CloudUpload as UploadIcon, WhatsApp as WhatsAppIcon,
  PhotoCamera as CameraIcon, MoreVert as MoreVertIcon, CloudDownload as LoadAllIcon,
} from '@mui/icons-material';
import { createSouvenir, searchSouvenirsByFilters, deleteSouvenir, updateSouvenir } from '../../services/souvenirService';
import { getDashboardStats } from '../../services/dashboardStatsService';
import { getLocalISODate, formatDate, getDatePickerFormat } from '../../utils/dateUtils';
import { getAllResidents } from '../../services/residentService';
import { generateImageFromHTML } from '../../utils/print/core';
import { getReceiptHTML } from '../../utils/print/templates/receiptTemplate';
import { matchesFlatOrName, autocompleteFlatFilter } from '../../utils/flatHelper';
import { getMasterConfig } from '../../services/masterConfigService';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { getPaymentProof } from '../../services/firebase';
import { useDebounce } from '../../hooks/useDebounce';
import { useProcessing } from '../../contexts/ProcessingContext';
import { statusBadge, thirdParty, status } from '../../theme/colorTokens';

const Souvenirs = () => {
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const isAuditor = user?.role === 'Auditor' || user?.role === 'FoodCoupon';
  const isSuperAdmin = user?.role === 'Super Admin';
  const [souvenirs, setSouvenirs] = useState([]);
  const [residents, setResidents] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fetchAll, setFetchAll] = useState(false);
  const [stats, setStats] = useState({ totalSouvenirs: 0, totalAmount: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofImages, setProofImages] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionSouvenir, setActionSouvenir] = useState(null);

  const handleMenuOpen = (event, souvenir) => {
    setAnchorEl(event.currentTarget);
    setActionSouvenir(souvenir);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionSouvenir(null);
  };
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedResident, setSelectedResident] = useState(null);
  const [form, setForm] = useState({ donorName: '', amount: '', paymentMode: 'UPI', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null, transactionDate: getLocalISODate() });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [residentData, configData, statsData] = await Promise.all([
        getAllResidents(), getMasterConfig(), getDashboardStats(false)
      ]);
      setResidents(residentData); 
      setConfig(configData); 
      setStats(statsData?.souvenir || { totalSouvenirs: 0, totalAmount: 0 });
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      const term = (searchTerm || '').trim();
      const hasSearch = term.length > 0;
      const isFlatSearch = hasSearch && /^[0-9]/.test(term);
      const hasDate = startDate !== null || endDate !== null;

      if (!hasSearch && !hasDate && !fetchAll) {
        setSouvenirs([]);
        return;
      }

      if (isFlatSearch && term.length < 3 && !hasDate && !fetchAll) {
        setSouvenirs([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchSouvenirsByFilters(searchTerm, hasDate, fetchAll);
        setSouvenirs(results);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, startDate, endDate, fetchAll, refreshTrigger]);

  const filteredSouvenirs = useMemo(() => {
    let filtered = [...souvenirs];
    if (debouncedSearchTerm) {
      filtered = filtered.filter(d => matchesFlatOrName(d, debouncedSearchTerm));
    }
    if (startDate) {
      filtered = filtered.filter(d => {
        const dateVal = d.transactionDate || d.createdAt;
        if (!dateVal) return false;
        return new Date(dateVal) >= new Date(startDate);
      });
    }
    if (endDate) {
      filtered = filtered.filter(d => {
        const dateVal = d.transactionDate || d.createdAt;
        if (!dateVal) return false;
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return new Date(dateVal) <= end;
      });
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [souvenirs, debouncedSearchTerm, startDate, endDate]);

  const handleSave = async () => {
    startProcessing('Saving souvenir...');
    try {
      const dataPayload = {
        donorName: form.donorName,
        amount: Number(form.amount) || 0,
        paymentMode: form.paymentMode,
        remarks: form.remarks,
        transactionDate: form.transactionDate,
        residentId: selectedResident?.id || null,
        residentName: selectedResident?.name || form.donorName,
        flatNumber: selectedResident?.flatNumber || '',
        paymentProofUrl: form.paymentProofUrl || null,
      };

      if (editId) {
        await updateSouvenir(editId, dataPayload, form.proofFiles, form.existingProofs);
      } else {
        await createSouvenir(dataPayload, form.proofFiles);
      }
      setDialogOpen(false);
      resetForm();
      await loadData();
      
      if (!editId) {
        // Auto-search for the newly added souvenir so it appears in the grid for receipt generation
        const searchParam = dataPayload.flatNumber || dataPayload.donorName;
        if (searchParam) {
          setSearchTerm(searchParam);
        } else {
          setFetchAll(true);
        }
      }

      setRefreshTrigger(prev => prev + 1);
    } catch (error) { console.error('Error:', error); }
    finally { stopProcessing(); }
  };

  const handleEdit = async (souvenir) => {
    setEditId(souvenir.id);
    setSelectedResident(residents.find(r => r.id === souvenir.residentId) || null);
    setForm({
      donorName: souvenir.donorName,
      amount: souvenir.amount || '',
      paymentMode: souvenir.paymentMode,
      remarks: souvenir.remarks || '',
      proofFiles: [],
      existingProofs: [],
      paymentProofUrl: souvenir.paymentProofUrl || null,
      transactionDate: souvenir.transactionDate || (souvenir.createdAt ? souvenir.createdAt.split('T')[0] : getLocalISODate()),
    });
    setDialogOpen(true);

    if (souvenir.paymentProofUrl) {
      const proofs = await getPaymentProof(souvenir.id, souvenir.paymentProofUrl);
      if (proofs) {
        setForm(prev => {
          if (prev.paymentProofUrl !== souvenir.paymentProofUrl) return prev;
          return {
            ...prev,
            existingProofs: Array.isArray(proofs) ? proofs : [proofs],
          };
        });
      }
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Souvenir Entry',
      message: 'Are you sure you want to delete this souvenir entry? This action cannot be undone.',
      onConfirm: async () => {
        startProcessing('Deleting souvenir...');
        try {
          await deleteSouvenir(id);
          await loadData();
          setRefreshTrigger(prev => prev + 1);
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const resetForm = () => {
    setSelectedResident(null);
    setEditId(null);
    setForm({ donorName: '', amount: '', paymentMode: 'UPI', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null, transactionDate: getLocalISODate() });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setForm((prev) => ({
        ...prev,
        proofFiles: [...(prev.proofFiles || []), ...files],
      }));
    }
  };

  const removeNewProofFile = (index) => {
    setForm(prev => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, idx) => idx !== index),
    }));
  };

  const removeExistingProof = (index) => {
    setForm(prev => ({
      ...prev,
      existingProofs: prev.existingProofs.filter((_, idx) => idx !== index),
    }));
  };

  const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);

  const handleShareWhatsApp = async (souvenir) => {
    try {
      const receiptHtmlStr = getReceiptHTML(souvenir, config, true, 'Souvenir Receipt');
      const canvas = await generateImageFromHTML(receiptHtmlStr);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const file = new File([blob], `Souvenir_Receipt_${souvenir.donorName.replace(/\\s+/g, '_')}.jpg`, { type: 'image/jpeg' });
      
      const message = `🙏 Thank You from ${config?.committeeName || 'Committee'} ${config?.year || ''} 🙏

The ${config?.committeeName || 'Committee'} sincerely thanks ${souvenir.donorName} for his/her generous contribution of ₹${souvenir.amount} towards the Durga Puja Souvenir Booklet.

Your kind support and patronage help us create a memorable keepsake for the entire ${config?.societyName || 'society'} family.

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
          title: 'Souvenir Receipt'
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
      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}>
        {[
          { label: 'Total Souvenirs', value: stats.totalSouvenirs, color: statusBadge.souvenir.text, icon: <SouvenirIcon /> },
          { label: 'Total Amount', value: formatCurrency(stats.totalAmount), color: statusBadge.success.text, icon: <RupeeIcon /> },
        ].map((s, i) => (
          <Grid key={s.label} size={{ xs: 6, sm: 6 }}>
            <Fade in timeout={400 + i * 100}>
              <Card sx={{ textAlign: { xs: 'left', sm: 'center' }, position: 'relative', overflow: 'hidden', height: '100%', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` } }}>
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

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(newValue) => { setStartDate(newValue); setFetchAll(false); }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: { xs: 'calc(50% - 4px)', sm: 170 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(newValue) => { setEndDate(newValue); setFetchAll(false); }}
              format={getDatePickerFormat(config?.dateFormat)}
              sx={{ width: { xs: 'calc(50% - 4px)', sm: 170 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
            />
            <TextField size="small" placeholder="Search contributor..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setFetchAll(false); }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
              sx={{ flex: 1, minWidth: 120 }} />
            <Tooltip title="Load All">
              <IconButton onClick={() => { setFetchAll(true); setSearchTerm(''); setStartDate(null); setEndDate(null); }} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <LoadAllIcon />
              </IconButton>
            </Tooltip>
            {!isAuditor && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setDialogOpen(true); }} sx={{ whiteSpace: 'nowrap' }}>Souvenir</Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ minWidth: { xs: 800, md: 1000 } }}>
            <TableHead>
              <TableRow>
                <TableCell>Contributor</TableCell><TableCell>Flat</TableCell><TableCell>Amount</TableCell>
                <TableCell>Mode</TableCell><TableCell>Date</TableCell><TableCell>Remarks</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSouvenirs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((d) => (
                <TableRow key={d.id}>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{d.donorName}</Typography></TableCell>
                  <TableCell>{d.flatNumber ? <Chip label={d.flatNumber} size="small" sx={{ fontWeight: 600, backgroundColor: statusBadge.info.bg, color: statusBadge.info.text }} /> : '-'}</TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: statusBadge.souvenir.text }}>{formatCurrency(d.amount)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{d.paymentMode}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(d.transactionDate || d.createdAt, config?.dateFormat)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.remarks || '-'}</Typography></TableCell>
                  <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {!isAuditor && <Tooltip title="Share to WhatsApp"><IconButton size="small" onClick={() => handleShareWhatsApp(d)} sx={{ color: thirdParty.whatsapp }}><WhatsAppIcon fontSize="small" /></IconButton></Tooltip>}
                      <Tooltip title="More Actions">
                        <span>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, d)}
                            disabled={!(d.paymentProofUrl || isSuperAdmin)}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {souvenirs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      {(!searchTerm && !startDate && !endDate && !fetchAll)
                        ? 'Search by Flat (e.g. 104), Name, Date, or click Load All.'
                        : 'No matching souvenir entries found.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredSouvenirs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
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
        {actionSouvenir?.paymentProofUrl && (
          <MenuItem key="view-proof" onClick={async () => {
            handleMenuClose();
            const imgs = await getPaymentProof(actionSouvenir.id, actionSouvenir.paymentProofUrl);
            if (imgs && imgs.length > 0) {
              setProofImages(imgs);
              setProofDialogOpen(true);
            }
          }}>
            <ListItemIcon><ImageIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
            <ListItemText>View Proof</ListItemText>
          </MenuItem>
        )}
        {isSuperAdmin && (
          <>
            <MenuItem key="edit-souvenir" onClick={() => { handleEdit(actionSouvenir); handleMenuClose(); }}>
              <ListItemIcon><EditIcon fontSize="small" sx={{ color: statusBadge.warning.text }} /></ListItemIcon>
              <ListItemText>Edit Entry</ListItemText>
            </MenuItem>
            <MenuItem key="delete-souvenir" onClick={() => { handleDelete(actionSouvenir.id); handleMenuClose(); }}>
              <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
              <ListItemText>Delete Entry</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Souvenir Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {dialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{editId ? 'Edit Souvenir Entry' : 'New Souvenir Entry'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <Autocomplete
                options={residents}
                filterOptions={autocompleteFlatFilter}
                getOptionLabel={(o) => `${o.flatNumber} — ${o.name}`}
                value={selectedResident}
                onChange={(_, v) => { setSelectedResident(v); if (v) setForm(f => ({ ...f, donorName: v.name })); }}
                renderInput={(params) => <TextField {...params} label="Select Flat Owner (Optional)" />}
              />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Contributor Name" value={form.donorName}
                onChange={(e) => setForm({ ...form, donorName: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <DatePicker
                label="Transaction Date"
                value={new Date(form.transactionDate)}
                onChange={(newValue) => {
                  if (newValue && !isNaN(newValue.getTime())) {
                    setForm({ ...form, transactionDate: getLocalISODate(newValue) });
                  }
                }}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="Amount" type="number" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth><InputLabel>Payment Mode</InputLabel>
                <Select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} label="Payment Mode">
                  {['UPI', 'Cash', 'Cheque', 'Net Banking'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Remarks (Ad type, page, poem title, etc.)" multiline rows={2} value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Upload Payment Proof (Optional)
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
            {((form.existingProofs && form.existingProofs.length > 0) || (form.proofFiles && form.proofFiles.length > 0)) && (
              <Grid size={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Attached Proofs:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {form.existingProofs && form.existingProofs.map((img, idx) => (
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
                  {form.proofFiles && form.proofFiles.map((file, idx) => {
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
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.donorName || Number(form.amount) <= 0}>{editId ? 'Update' : 'Save'}</Button>
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

export default Souvenirs;
