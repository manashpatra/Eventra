import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, Tooltip, Fade, TablePagination, Chip, LinearProgress, Menu, ListItemIcon, ListItemText } from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, CurrencyRupee as RupeeIcon, Phone as PhoneIcon,
  Group as LeadIcon, AccessTime as PendingIcon, CheckCircle as PaidIcon,
  Cancel as ClosedIcon, MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import { createLead, updateLead, deleteLead, getAllLeads, getLeadStats } from '../../services/collectionTrackerService';
import { getMasterConfig } from '../../services/masterConfigService';
import { useDebounce } from '../../hooks/useDebounce';
import { brand, statusBadge } from '../../theme/colorTokens';

const formatCurrency = (a) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a || 0);

const STATUSES = ['Pending', 'Closed', 'Paid'];

const Leads = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';
  const isAdmin = user?.role === 'Admin';
  const isCollection = user?.role === 'Collection';
  const canEdit = isSuperAdmin || isAdmin || isCollection;

  const [leads, setLeads] = useState([]);
  const [config, setConfig] = useState(null);
  const [stats, setStats] = useState({ totalLeads: 0, pendingCount: 0, closedCount: 0, paidCount: 0, totalPromisedAmount: 0, paidAmount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Menu states
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionLead, setActionLead] = useState(null);
  const handleMenuOpen = (e, lead) => { e.stopPropagation(); setAnchorEl(e.currentTarget); setActionLead(lead); };
  const handleMenuClose = () => { setAnchorEl(null); setActionLead(null); };

  // Form State
  const [form, setForm] = useState({
    name: '', contact: '', amount: '', notes: '', status: 'Pending', trackedBy: ''
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, configData] = await Promise.all([
        getAllLeads(),
        getMasterConfig()
      ]);
      const s = await getLeadStats(data);
      setLeads(data);
      setConfig(configData);
      setStats(s);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    if (statusFilter !== 'All') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    if (debouncedSearchTerm) {
      filtered = filtered.filter(l =>
        (l.name || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (l.contact || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [leads, debouncedSearchTerm, statusFilter]);

  const resetForm = () => {
    setEditId(null);
    let defaultTrackedBy = user?.fullName || user?.email || '';
    if (config?.userRoles) {
      const matchedUser = config.userRoles.find(u => u.email === user?.email);
      if (matchedUser) {
        defaultTrackedBy = matchedUser.fullName || matchedUser.email || defaultTrackedBy;
      }
    }
    setForm({ name: '', contact: '', amount: '', notes: '', status: 'Pending', trackedBy: defaultTrackedBy });
  };

  const handleSave = async () => {
    try {
      if (editId) {
        await updateLead(editId, form);
      } else {
        await createLead({ ...form, trackedBy: form.trackedBy || user?.fullName || user?.email || 'Unknown' });
      }
      setDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving lead:', error);
    }
  };

  const handleEdit = (lead) => {
    setEditId(lead.id);
    setForm({
      name: lead.name || '',
      contact: lead.contact || '',
      amount: lead.amount || '',
      notes: lead.notes || '',
      status: lead.status || 'Pending',
      trackedBy: lead.trackedBy || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Lead',
      message: 'Are you sure you want to delete this lead? This action cannot be undone.',
      onConfirm: async () => {
        await deleteLead(id);
        await loadData();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Closed': return 'error';
      case 'Pending': default: return 'warning';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: 'calc(100dvh - 80px)', sm: 'calc(100vh - 85px)' }, overflow: 'hidden' }}>
      {loading && <LinearProgress sx={{ mb: 2, flexShrink: 0 }} />}

      {/* Stats Section */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}>
        {[
          { label: 'Total Leads', value: stats.totalLeads, color: statusBadge.purple.text, icon: <LeadIcon />, xs: 6 },
          { label: 'Pending Follow-ups', value: stats.pendingCount, color: brand.gold, icon: <PendingIcon />, xs: 6 },
          { label: 'Total Amount', value: formatCurrency(stats.totalPromisedAmount), color: statusBadge.info.text, icon: <RupeeIcon />, xs: 6 },
          { label: 'Total Paid (Converted)', value: formatCurrency(stats.paidAmount), color: statusBadge.success.text, icon: <PaidIcon />, xs: 6 }
        ].map((s, i) => (
          <Grid key={i} size={{ xs: s.xs, sm: 6, md: 3 }}>
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

      {/* Toolbar */}
      <Card sx={{ mb: { xs: 1.5, md: 3 }, flexShrink: 0 }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search leads..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: { xs: 20, sm: 24 } }} /></InputAdornment> } }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: 100, sm: 140 } }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="All">All</MenuItem>
                {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            {canEdit && (
              <Tooltip title="Add Lead">
                <Button variant="contained" onClick={() => { resetForm(); setDialogOpen(true); }} sx={{ minWidth: { xs: 40, sm: 'auto' }, px: { xs: 0, sm: 2 } }}>
                  <AddIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'block' } }}>Lead</Box>
                </Button>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Tracked By</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Notes</TableCell>
                {canEdit && <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 4, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 7 : 6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {loading ? 'Loading...' : 'No leads found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((l) => (
                  <TableRow key={l.id} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 600 }}>{l.name}</Typography></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="body2">{l.contact || '—'}</Typography>
                        {l.contact && (
                          <Tooltip title={`Call ${l.contact}`}>
                            <IconButton
                              size="small"
                              component="a"
                              href={`tel:${l.contact}`}
                              onClick={(e) => e.stopPropagation()}
                              sx={{ color: statusBadge.success.text, p: 0.5 }}
                            >
                              <PhoneIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{l.trackedBy}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600, color: statusBadge.info.text }}>{formatCurrency(l.amount)}</Typography></TableCell>
                    <TableCell align="center">
                      <Chip label={l.status} size="small" color={getStatusColor(l.status)} variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={l.notes || 'No notes'}>
                        <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'text.secondary' }}>
                          {l.notes || '—'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    {canEdit && (
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                        <Tooltip title="More Actions">
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, l)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {filteredLeads.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredLeads.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            labelRowsPerPage="Rows:"
            sx={{ flexShrink: 0 }}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        {dialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editId ? 'Edit Lead' : 'Add New Lead'}
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Name *" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Contact Number" value={form.contact} onChange={(e) => setForm(prev => ({ ...prev, contact: e.target.value }))} slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Amount" type="number" value={form.amount || ''} onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))} slotProps={{ input: { startAdornment: <InputAdornment position="start"><RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Tracked By</InputLabel>
                <Select value={form.trackedBy} label="Tracked By" onChange={(e) => setForm(prev => ({ ...prev, trackedBy: e.target.value }))}>
                  {config?.userRoles
                    ?.filter(u => u.isActive !== false)
                    .map(u => {
                      const label = u.fullName || u.email;
                      return <MenuItem key={u.email} value={label}>{label}</MenuItem>;
                    })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={form.status} label="Status" onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField fullWidth label="Follow-up Notes" multiline rows={3} value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="Enter interaction details, next follow-up dates, or commitments..." />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim()}>
            {editId ? 'Update Lead' : 'Add Lead'}
          </Button>
        </DialogActions>
          </>
        )}
      </Dialog>

      <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))} />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableRestoreFocus
        disableScrollLock
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          document.activeElement?.blur();
          setTimeout(() => handleEdit(actionLead), 0);
        }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
          <ListItemText>Edit Lead</ListItemText>
        </MenuItem>
        {isSuperAdmin && (
          <MenuItem onClick={() => {
            handleMenuClose();
            document.activeElement?.blur();
            setTimeout(() => handleDelete(actionLead?.id), 0);
          }}>
            <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
            <ListItemText>Delete Lead</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default Leads;
