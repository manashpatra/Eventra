import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Grid, FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, InputAdornment, Tooltip, TablePagination, Autocomplete, Menu, ListItemIcon, ListItemText, Checkbox } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, CurrencyRupee as RupeeIcon, Business as ExpenseIcon,
  Print as PrintIcon, Image as ImageIcon, CloudUpload as UploadIcon,
  PhotoCamera as CameraIcon, MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { createExpense, getAllExpenses, deleteExpense, updateExpense, getExpenseStats } from '../../services/expenseService';
import { getLocalISODate, formatDate, getDatePickerFormat } from '../../utils/dateUtils';
import { printHTML } from '../../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles } from '../../utils/print/shared';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { getMasterConfig, updateMasterConfig } from '../../services/masterConfigService';
import { getPaymentProof } from '../../services/firebase';
import { useDebounce } from '../../hooks/useDebounce';
import { useProcessing } from '../../contexts/ProcessingContext';
import { printTheme, statusBadge, status } from '../../theme/colorTokens';

const Expenses = () => {
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const isAuditor = user?.role === 'Auditor';
  const isSuperAdmin = user?.role === 'Super Admin';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [filterMode, setFilterMode] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [stats, setStats] = useState({ totalExpenses: 0, totalAmount: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofImages, setProofImages] = useState([]);
  const [config, setConfig] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionExpense, setActionExpense] = useState(null);

  const handleMenuOpen = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setActionExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionExpense(null);
  };

  const [form, setForm] = useState({ payeeName: '', expenseDate: getLocalISODate(), category: '', subCategory: '', amount: '', paymentMode: 'Cash', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [data, configData] = await Promise.all([getAllExpenses(), getMasterConfig()]);
      // Compute stats from already-fetched data (no duplicate Firestore read)
      const statsData = await getExpenseStats(data);
      setExpenses(data); setStats(statsData); setConfig(configData);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];
    if (debouncedSearchTerm) {
      const t = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(e => (e.remarks || '').toLowerCase().includes(t));
    }
    if (filterMode && filterMode.length > 0) {
      filtered = filtered.filter(e => {
        if (filterMode.includes('Bank')) {
          if (['UPI', 'Net Banking', 'Cheque'].includes(e.paymentMode)) return true;
        }
        return filterMode.includes(e.paymentMode);
      });
    }
    if (filterCategory) {
      filtered = filtered.filter(e => e.category === filterCategory);
    }
    if (filterSubCategory) {
      filtered = filtered.filter(e => e.subCategory === filterSubCategory);
    }
    if (filterStartDate) {
      filtered = filtered.filter(e => new Date(e.expenseDate || e.createdAt) >= new Date(filterStartDate + 'T00:00:00'));
    }
    if (filterEndDate) {
      filtered = filtered.filter(e => new Date(e.expenseDate || e.createdAt) <= new Date(filterEndDate + 'T23:59:59'));
    }
    return filtered.sort((a, b) => new Date(b.expenseDate || b.createdAt) - new Date(a.expenseDate || a.createdAt));
  }, [expenses, debouncedSearchTerm, filterMode, filterCategory, filterSubCategory, filterStartDate, filterEndDate]);

  const filteredTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [filteredExpenses]);

  const handleSave = async () => {
    startProcessing('Saving expense...');
    try {
      const dataPayload = {
        payeeName: form.payeeName,
        expenseDate: form.expenseDate,
        category: form.category,
        subCategory: form.subCategory,
        amount: Number(form.amount) || 0,
        paymentMode: form.paymentMode,
        remarks: form.remarks,
        paymentProofUrl: form.paymentProofUrl || null,
      };

      if (editId) {
        await updateExpense(editId, dataPayload, form.proofFiles, form.existingProofs);
      } else {
        await createExpense(dataPayload, form.proofFiles);
      }

      if (form.payeeName && config && (!config.payees || !config.payees.includes(form.payeeName))) {
        const newPayees = [...(config.payees || []), form.payeeName].sort((a, b) => a.localeCompare(b));
        await updateMasterConfig({ ...config, payees: newPayees });
        setConfig(prev => ({ ...prev, payees: newPayees }));
      }

      setDialogOpen(false);
      resetForm();
      await loadData();
    }
    catch (error) { console.error('Error:', error); }
    finally { stopProcessing(); }
  };

  const handleEdit = async (exp) => {
    setEditId(exp.id);
    setForm({
      payeeName: exp.payeeName,
      expenseDate: exp.expenseDate || (exp.createdAt ? exp.createdAt.split('T')[0] : getLocalISODate()),
      category: exp.category || '',
      subCategory: exp.subCategory || '',
      amount: exp.amount || '',
      paymentMode: exp.paymentMode,
      remarks: exp.remarks || '',
      proofFiles: [],
      existingProofs: [],
      paymentProofUrl: exp.paymentProofUrl || null,
    });
    setDialogOpen(true);

    if (exp.paymentProofUrl) {
      const proofs = await getPaymentProof(exp.id, exp.paymentProofUrl);
      if (proofs) {
        setForm(prev => {
          if (prev.paymentProofUrl !== exp.paymentProofUrl) return prev;
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
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      onConfirm: async () => {
        startProcessing('Deleting expense...');
        try {
          await deleteExpense(id);
          await loadData();
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ payeeName: '', expenseDate: getLocalISODate(), category: '', subCategory: '', amount: '', paymentMode: 'Cash', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null });
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

  const getCategoryName = (idOrName) => {
    const cat = config?.expenseCategories?.find(c => c.id === idOrName || c.name === idOrName || c.category === idOrName);
    return cat ? (cat.name || cat.category) : idOrName;
  };

  const getSubCategoryName = (catIdOrName, subIdOrName) => {
    const cat = config?.expenseCategories?.find(c => c.id === catIdOrName || c.name === catIdOrName || c.category === catIdOrName);
    if (!cat) return subIdOrName;
    const sub = cat.subCategories?.find(s => s.id === subIdOrName || s.name === subIdOrName || s === subIdOrName);
    return sub ? (sub.name || sub) : subIdOrName;
  };

  const handlePrintReceipt = (s) => {
    const html = `<html><head><title>Expense Receipt</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:20px;max-width:350px;margin:0 auto}
      ${getPrintHeaderStyles()}
      .receipt-title{text-align:center; color:${printTheme.receiptCyan}; font-size: 16px; margin: 10px 0; text-transform: uppercase; font-weight: bold; border-bottom: 1px dashed ${printTheme.text}; padding-bottom: 8px;}
      .row{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}
      .row.total{border-top:1px solid ${printTheme.text};font-weight:bold;font-size:16px;padding-top:8px;margin-top:8px}
      .footer{text-align:center;border-top:2px dashed ${printTheme.text};padding-top:12px;margin-top:16px;font-size:11px;color:${printTheme.textMuted}}
    </style></head><body>
    ${getPrintHeaderHTML(config)}
    <div class="receipt-title">Expense Voucher ${config?.year || ''}</div>
    <div class="row"><span>Date:</span><span>${formatDate(s.expenseDate, config?.dateFormat)}</span></div>
    <div class="row"><span>Payee Name:</span><strong>${s.payeeName}</strong></div>
    <div class="row"><span>Category:</span><span>${getCategoryName(s.category) || 'N/A'}</span></div>
    <div class="row"><span>Payment:</span><strong>${s.paymentMode}</strong></div>
    <div class="row total"><span>Amount:</span><strong>${formatCurrency(s.amount)}</strong></div>
    ${s.remarks ? `<div class="row"><span>Remarks:</span><span>${s.remarks}</span></div>` : ''}
    <div class="footer"><p>Thank you! \ud83d\ude4f</p><p>Jai Maa Durga!</p></div>
    </body></html>`;
    printHTML(html);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField size="small" placeholder="Search remarks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
              sx={{ flex: 1, minWidth: 160 }} />
            <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
              <InputLabel shrink>Payment Mode</InputLabel>
              <Select
                multiple
                value={filterMode}
                label="Payment Mode"
                onChange={(e) => {
                  const val = e.target.value;
                  let selected = typeof val === 'string' ? val.split(',') : [...val];

                  const bankPreviouslySelected = filterMode.includes('Bank');
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
                  setFilterMode(selected);
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
                    <Checkbox checked={filterMode.indexOf(opt.value) > -1} size="small" sx={{ py: 0 }} />
                    <ListItemText primary={opt.label} sx={{ my: 0 }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
              <InputLabel>Category</InputLabel>
              <Select value={filterCategory} label="Category" onChange={(e) => { setFilterCategory(e.target.value); setFilterSubCategory(''); }}>
                <MenuItem value="">All Categories</MenuItem>
                {config?.expenseCategories?.map(c => <MenuItem key={c.id || c.name || c.category} value={c.id || c.name || c.category}>{c.name || c.category}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }} disabled={!filterCategory}>
              <InputLabel>Sub-Category</InputLabel>
              <Select value={filterSubCategory} label="Sub-Category" onChange={(e) => setFilterSubCategory(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                {config?.expenseCategories?.find(c => (c.id || c.name || c.category) === filterCategory)?.subCategories?.map(s => <MenuItem key={s.id || s.name || s} value={s.id || s.name || s}>{s.name || s}</MenuItem>)}
              </Select>
            </FormControl>
            <DatePicker
              label="From Date"
              value={filterStartDate ? new Date(filterStartDate + 'T00:00:00') : null}
              onChange={(val) => setFilterStartDate(val ? getLocalISODate(val) : null)}
              sx={{ width: { xs: 'calc(50% - 8px)', sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
              format={getDatePickerFormat(config?.dateFormat)}
            />
            <DatePicker
              label="To Date"
              value={filterEndDate ? new Date(filterEndDate + 'T00:00:00') : null}
              onChange={(val) => setFilterEndDate(val ? getLocalISODate(val) : null)}
              sx={{ width: { xs: 'calc(50% - 8px)', sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
              format={getDatePickerFormat(config?.dateFormat)}
            />
            {!isAuditor && (
              <Button variant="contained" sx={{ height: 40, whiteSpace: 'nowrap' }} startIcon={<AddIcon />} onClick={() => { resetForm(); setDialogOpen(true); }}>Expense</Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell><TableCell>Amount</TableCell><TableCell>Category &gt; Sub Category</TableCell>
                <TableCell>Mode</TableCell><TableCell>Payee</TableCell><TableCell>Remarks</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => (
                <TableRow key={s.id}>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{formatDate(s.expenseDate, config?.dateFormat)}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: statusBadge.expense.text }}>{formatCurrency(s.amount)}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {getCategoryName(s.category) || '-'} {s.subCategory ? `> ${getSubCategoryName(s.category, s.subCategory)}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.paymentMode}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{s.payeeName}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.remarks}</Typography></TableCell>
                  <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                      {isSuperAdmin && (
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: statusBadge.warning.text }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="More Actions">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, s)}>
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredExpenses.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <ExpenseIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 1 }} />
                  <Typography sx={{ color: 'text.secondary' }}>No expenses recorded yet</Typography>
                </TableCell></TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell align="right"><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total Filtered Amount:</Typography></TableCell>
                <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 800, color: statusBadge.expense.text }}>{formatCurrency(filteredTotalAmount)}</Typography></TableCell>
                <TableCell colSpan={5}></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredExpenses.length}
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

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {dialogOpen && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{editId ? 'Edit Expense' : 'New Expense'}</Typography>
              <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                <Grid size={12}>
                  <Autocomplete
                    freeSolo
                    options={Array.from(new Map([
                      'Cash Fund', 'DPC Account', 
                      ...(config?.payees || [])
                    ].map(p => [p.trim().toLowerCase(), p.trim()])).values()).sort((a,b) => a.localeCompare(b))}
                    value={form.payeeName}
                    onChange={(e, newValue) => setForm({ ...form, payeeName: newValue || '' })}
                    onInputChange={(e, newInputValue) => setForm({ ...form, payeeName: newInputValue })}
                    renderInput={(params) => <TextField {...params} label="Payee Name" required fullWidth />}
                  />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth><InputLabel>Category</InputLabel>
                    <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, subCategory: '' })} label="Category">
                      {config?.expenseCategories?.filter(c => c.active !== false).map(c => <MenuItem key={c.id || c.name || c.category} value={c.id || c.name || c.category}>{c.name || c.category}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth disabled={!form.category}><InputLabel>Sub-Category</InputLabel>
                    <Select value={form.subCategory} onChange={(e) => setForm({ ...form, subCategory: e.target.value })} label="Sub-Category">
                      {config?.expenseCategories?.find(c => (c.id || c.name || c.category) === form.category)?.subCategories?.filter(s => s.active !== false).sort((a, b) => (a.name || a).localeCompare(b.name || b)).map(s => <MenuItem key={s.id || s.name || s} value={s.id || s.name || s}>{s.name || s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={6}>
                  <DatePicker
                    label="Date"
                    value={new Date(form.expenseDate)}
                    onChange={(newValue) => {
                      if (newValue && !isNaN(newValue.getTime())) {
                        setForm({ ...form, expenseDate: getLocalISODate(newValue) });
                      }
                    }}
                    format={getDatePickerFormat(config?.dateFormat)}
                    sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth><InputLabel>Payment Mode</InputLabel>
                    <Select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} label="Payment Mode">
                      {['UPI', 'Cash', 'Cheque', 'Net Banking'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}><TextField fullWidth label="Remarks" multiline rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
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
              <Button variant="contained" onClick={handleSave} disabled={!form.payeeName || !form.amount || Number(form.amount) <= 0} startIcon={<RupeeIcon />}>{editId ? 'Update' : 'Save'}</Button>
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

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableRestoreFocus
        disableScrollLock
        slotProps={{ paper: {
          sx: { mt: 0.5, minWidth: 150 }
        } }}
      >
        {actionExpense?.paymentProofUrl && (
          <MenuItem key="view-proof" onClick={async () => {
            handleMenuClose();
            document.activeElement?.blur();
            const imgs = await getPaymentProof(actionExpense.id, actionExpense.paymentProofUrl);
            if (imgs && imgs.length > 0) {
              setProofImages(imgs);
              setTimeout(() => setProofDialogOpen(true), 0);
            }
          }}>
            <ListItemIcon><ImageIcon fontSize="small" sx={{ color: statusBadge.success.text }} /></ListItemIcon>
            <ListItemText>View Proof</ListItemText>
          </MenuItem>
        )}
        <MenuItem key="print-receipt" onClick={() => {
          handleMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handlePrintReceipt(actionExpense), 0);
        }}>
          <ListItemIcon><PrintIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
          <ListItemText>Print Receipt</ListItemText>
        </MenuItem>
        {isSuperAdmin && (
          <MenuItem key="delete" onClick={() => {
            handleMenuClose();
            document.activeElement?.blur();
            setTimeout(() => handleDelete(actionExpense?.id), 0);
          }}>
            <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

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

export default Expenses;
