import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Grid, FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, InputAdornment, useTheme, useMediaQuery } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import { createWithdrawTransaction, getAllWithdrawTransactions, deleteWithdrawTransaction, updateWithdrawTransaction } from '../../services/withdrawService';
import { createExpense } from '../../services/expenseService';
import { getAllVendors } from '../../services/vendorService';
import { getLocalISODate, formatDate } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../contexts/AuthContext';
import { status } from '../../theme/colorTokens';

const Withdraw = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === 'Auditor';
  const [transactions, setTransactions] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [form, setForm] = useState({
    transactionDate: getLocalISODate(),
    chequeNumber: '',
    amount: '',
    transactionType: 'To Cash',
    vendorName: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [txData, vendorData] = await Promise.all([
        getAllWithdrawTransactions(),
        getAllVendors(),
      ]);
      setTransactions(txData);
      setVendors(vendorData);
    } catch (error) {
      console.error('Error loading cheque transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      (t.chequeNumber || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (t.remarks || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [transactions, debouncedSearchTerm]);

  const handleSave = async () => {
    try {
      const dataPayload = {
        transactionDate: form.transactionDate,
        chequeNumber: form.chequeNumber,
        amount: Number(form.amount),
        transactionType: form.transactionType,
        vendorName: form.transactionType === 'To Vendor' ? form.vendorName : '',
        remarks: form.remarks,
      };

      if (editId) {
        await updateWithdrawTransaction(editId, dataPayload);
      } else {
        // If "To Vendor", we also need to create an Expense
        if (dataPayload.transactionType === 'To Vendor') {
           const expenseData = {
              payeeName: dataPayload.vendorName,
              category: 'Vendor Payment',
              subCategory: 'Bank Withdrawal',
              amount: dataPayload.amount,
              paymentMode: 'Bank',
              remarks: `Ref: ${dataPayload.chequeNumber} - ${dataPayload.remarks}`,
              expenseDate: dataPayload.transactionDate,
           };
           const newExpense = await createExpense(expenseData, []);
           dataPayload.expenseId = newExpense.id;
        }
        await createWithdrawTransaction(dataPayload);
      }

      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (tx) => {
    setEditId(tx.id);
    setForm({
      transactionDate: tx.transactionDate ? tx.transactionDate.split('T')[0] : getLocalISODate(),
      chequeNumber: tx.chequeNumber || '',
      amount: tx.amount || '',
      transactionType: tx.transactionType || 'To Cash',
      vendorName: tx.vendorName || '',
      remarks: tx.remarks || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this withdrawal transaction? If it was paid to a vendor, the associated expense will NOT be automatically deleted.',
      onConfirm: async () => {
        await deleteWithdrawTransaction(id);
        setConfirmDialog({ ...confirmDialog, open: false });
        await loadData();
      }
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      transactionDate: getLocalISODate(),
      chequeNumber: '',
      amount: '',
      transactionType: 'To Cash',
      vendorName: '',
      remarks: '',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search by Ref No or Remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
              sx={{ flex: 1, minWidth: 200 }}
            />
            {!isAuditor && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => { resetForm(); setDialogOpen(true); }}
              >
                Withdrawal
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ref / Cheque No.</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vendor / Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amount</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80, fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Loading...</TableCell></TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>No transactions found.</TableCell></TableRow>
              ) : (
                filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell>{tx.chequeNumber}</TableCell>
                    <TableCell>
                      <Box sx={{ 
                        px: 1.5, py: 0.5, borderRadius: 1, display: 'inline-block',
                        fontSize: '0.75rem', fontWeight: 600,
                        backgroundColor: tx.transactionType === 'To Cash' ? (theme.palette.mode === 'dark' ? 'rgba(102, 187, 106, 0.15)' : 'rgba(76, 175, 80, 0.1)') : (theme.palette.mode === 'dark' ? 'rgba(239, 83, 80, 0.15)' : 'rgba(244, 67, 54, 0.1)'),
                        color: tx.transactionType === 'To Cash' ? status.success.main(theme.palette.mode === 'dark') : status.error.main(theme.palette.mode === 'dark')
                      }}>
                        {tx.transactionType}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {tx.transactionType === 'To Vendor' && tx.vendorName ? (
                        <Typography variant="body2" fontWeight={600}>{tx.vendorName}</Typography>
                      ) : null}
                      {tx.remarks && <Typography variant="caption" color="text.secondary" display="block">{tx.remarks}</Typography>}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(tx.amount)}</TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {!isAuditor && (
                          <>
                            <IconButton size="small" onClick={() => handleEdit(tx)} color="primary"><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleDelete(tx.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredTransactions.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {dialogOpen && (
          <>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editId ? 'Edit Withdrawal' : 'New Withdrawal'}
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Transaction Type</InputLabel>
                <Select
                  value={form.transactionType}
                  label="Transaction Type"
                  onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                  disabled={!!editId} // Cannot change type on edit
                >
                  <MenuItem value="To Cash">Transfer to Cash</MenuItem>
                  <MenuItem value="To Vendor">Pay to Vendor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <DatePicker
                label="Date"
                value={new Date(form.transactionDate)}
                onChange={(newValue) => setForm({ ...form, transactionDate: newValue ? getLocalISODate(newValue) : getLocalISODate() })}
                slotProps={{ textField: { fullWidth: true, size: "small" } }}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth size="small" label="Ref / Cheque No."
                value={form.chequeNumber}
                onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
              />
            </Grid>
            {form.transactionType === 'To Vendor' && (
              <Grid size={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vendor</InputLabel>
                  <Select
                    value={form.vendorName}
                    label="Vendor"
                    onChange={(e) => setForm({ ...form, vendorName: e.target.value })}
                  >
                    {vendors.map(v => (
                      <MenuItem key={v.id} value={v.name}>{v.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                fullWidth size="small" label="Amount" type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth size="small" label="Remarks" multiline rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!(Number(form.amount) > 0) || (form.transactionType === 'To Vendor' && !form.vendorName)}>{editId ? 'Update' : 'Save'}</Button>
        </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog {...confirmDialog} onClose={() => setConfirmDialog({ ...confirmDialog, open: false })} />
    </Box>
  );
};

export default Withdraw;
