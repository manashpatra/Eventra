import React, { useState, useEffect, useMemo } from 'react';
import { Box, Card, CardContent, Typography, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Tooltip, FormControl, InputLabel, Select, Button, CircularProgress, Grid, Fade } from '@mui/material';
import {
  Search as SearchIcon, Close as CloseIcon, Visibility as ViewIcon,
  History as HistoryIcon, Info as InfoIcon, Clear as ClearIcon,
  FilterAlt as FilterIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getFilteredAuditLogs } from '../../services/auditService';
import { getMasterConfig } from '../../services/masterConfigService';
import { formatDateTime, getDatePickerFormat } from '../../utils/dateUtils';
import SleekLoader from '../../components/SleekLoader';
import { surface, border, status, statusBadge } from '../../theme/colorTokens';

const AuditReport = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // User list from Firebase
  const [userList, setUserList] = useState([]);

  // Filters
  const [filterAction, setFilterAction] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Details Modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [config, setConfig] = useState(null);

  // Load user list from master config on mount
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const configData = await getMasterConfig();
        setConfig(configData);
        const roles = configData.userRoles || [];
        // Always include the hardcoded super admin
        const superAdminEmail = 'softdev.vivek@gmail.com';
        const hasSuper = roles.some((r) => r.email === superAdminEmail);
        const allUsers = hasSuper
          ? roles
          : [{ email: superAdminEmail, displayName: 'Super Admin', role: 'Super Admin' }, ...roles];
        setUserList(allUsers);
      } catch (error) {
        console.error('Error loading user list:', error);
      }
    };
    loadUsers();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    setPage(0);
    try {
      const filters = {};
      if (filterAction !== 'all') filters.action = filterAction;
      if (filterEntity !== 'all') filters.entityType = filterEntity;
      if (filterUser !== 'all') filters.userEmail = filterUser;
      if (startDate) filters.startDate = startDate.toISOString();
      if (endDate) filters.endDate = endDate.toISOString();

      // If no filters at all, still fetch all (user explicitly clicked search)
      const hasAnyFilter = Object.keys(filters).length > 0;
      if (!hasAnyFilter) {
        // Pass a dummy to force fetch
        filters.action = 'all';
      }

      const data = await getFilteredAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilterAction('all');
    setFilterEntity('all');
    setFilterUser('all');
    setStartDate(null);
    setEndDate(null);
    setLogs([]);
    setSearched(false);
    setPage(0);
  };

  const stats = useMemo(() => {
    const total = logs.length;
    const creates = logs.filter((l) => l.action === 'CREATE').length;
    const updates = logs.filter((l) => l.action === 'UPDATE').length;
    const deletes = logs.filter((l) => l.action === 'DELETE').length;
    return { total, creates, updates, deletes };
  }, [logs]);

  const getActionChip = (action) => {
    switch (action) {
      case 'CREATE':
        return <Chip label="CREATE" size="small" sx={{ fontWeight: 700, backgroundColor: statusBadge.success.bg, color: statusBadge.success.text, border: `1px solid ${statusBadge.success.text}40` }} />;
      case 'UPDATE':
        return <Chip label="UPDATE" size="small" sx={{ fontWeight: 700, backgroundColor: statusBadge.warning.bg, color: statusBadge.warning.text, border: `1px solid ${statusBadge.warning.text}40` }} />;
      case 'DELETE':
        return <Chip label="DELETE" size="small" sx={{ fontWeight: 700, backgroundColor: statusBadge.error.bg, color: statusBadge.error.text, border: `1px solid ${statusBadge.error.text}40` }} />;
      default:
        return <Chip label={action} size="small" />;
    }
  };

  const getEntityChip = (entity) => {
    switch (entity) {
      case 'Donation':
        return <Chip label="Donation" size="small" sx={{ backgroundColor: statusBadge.donation.bg, color: statusBadge.donation.text }} />;
      case 'Expense':
        return <Chip label="Expense" size="small" sx={{ backgroundColor: statusBadge.expense.bg, color: statusBadge.expense.text }} />;
      case 'Sponsorship':
        return <Chip label="Sponsorship" size="small" sx={{ backgroundColor: statusBadge.info.bg, color: statusBadge.info.text }} />;
      case 'Subscription':
        return <Chip label="Subscription" size="small" sx={{ backgroundColor: statusBadge.gold.bg, color: statusBadge.gold.text }} />;
      case 'FoodCoupon':
        return <Chip label="Food Coupon" size="small" sx={{ backgroundColor: statusBadge.lightGreen.bg, color: statusBadge.lightGreen.text }} />;
      case 'Resident':
        return <Chip label="Resident" size="small" sx={{ backgroundColor: statusBadge.slate.bg, color: statusBadge.slate.text }} />;
      default:
        return <Chip label={entity} size="small" />;
    }
  };

  const handleOpenDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const formatJson = (jsonStr) => {
    if (!jsonStr) return 'No details available.';
    try {
      const parsed = JSON.parse(jsonStr);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <Box>
      {/* Filter Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Grid container columns={24} spacing={{ xs: 1.5, sm: 1.5, lg: 1.5 }} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="audit-type-label">Type</InputLabel>
                <Select
                  labelId="audit-type-label"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="CREATE">Insert</MenuItem>
                  <MenuItem value="UPDATE">Update</MenuItem>
                  <MenuItem value="DELETE">Delete</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="audit-page-label">Page</InputLabel>
                <Select
                  labelId="audit-page-label"
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  label="Page"
                >
                  <MenuItem value="all">All Pages</MenuItem>
                  <MenuItem value="Donation">Donation</MenuItem>
                  <MenuItem value="Expense">Expense</MenuItem>
                  <MenuItem value="Sponsorship">Sponsorship</MenuItem>
                  <MenuItem value="Subscription">Subscription</MenuItem>
                  <MenuItem value="FoodCoupon">Food Coupon</MenuItem>
                  <MenuItem value="Resident">Resident</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <DatePicker
                label="From Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }}
                slotProps={{
                  actionBar: { actions: ['clear', 'cancel', 'accept'] },
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 4 }}>
              <DatePicker
                label="To Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }}
                slotProps={{
                  actionBar: { actions: ['clear', 'cancel', 'accept'] },
                  textField: { size: 'small', fullWidth: true },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 5 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="audit-user-label">User</InputLabel>
                <Select
                  labelId="audit-user-label"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  label="User"
                >
                  <MenuItem value="all">All Users</MenuItem>
                  {userList.map((u) => (
                    <MenuItem key={u.email} value={u.email}>
                      {u.email} ({u.role || 'N/A'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 5 }}>
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 0.75, sm: 1 },
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                  onClick={handleClearFilters}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'text.secondary',
                    minHeight: 40,
                    whiteSpace: 'nowrap',
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                  }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SearchIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />}
                  onClick={handleSearch}
                  disabled={loading}
                  sx={{
                    minHeight: 40,
                    px: { xs: 1.25, sm: 2 },
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    whiteSpace: 'nowrap',
                  }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Stats Cards - only show after search */}
      {searched && !loading && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Logs', value: stats.total, color: statusBadge.info.text },
            { label: 'Inserts', value: stats.creates, color: statusBadge.success.text },
            { label: 'Updates', value: stats.updates, color: statusBadge.warning.text },
            { label: 'Deletes', value: stats.deletes, color: statusBadge.error.text },
          ].map((stat, i) => (
            <Grid key={stat.label} size={{ xs: 6, sm: 3 }}>
              <Fade in={true} timeout={400 + i * 100}>
                <Card sx={{ textAlign: 'center' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Prompt Banner - before first search */}
      {!searched && !loading && (
        <Card sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <FilterIcon sx={{ fontSize: 56, color: 'rgba(255,255,255,0.08)', mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Use the filters above and click Search
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Select any combination of user, type, page, or date range to query audit logs.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Log Table - after search */}
      {searched && (
        <Card>
          <TableContainer sx={{ maxHeight: '55vh' }}>
            <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Operator</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Entity Type</TableCell>
                  <TableCell>Document ID</TableCell>
                  <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ p: 0 }}>
                      <SleekLoader message="Fetching logs..." minHeight="200px" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <InfoIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.06)', mb: 1 }} />
                      <Typography sx={{ color: 'text.secondary' }}>
                        No audit logs found matching the selected filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {formatDateTime(log.timestamp, config?.dateFormat)}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {log.performedBy?.displayName || 'System'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.72rem' }}>
                            {log.performedBy?.email || 'system@dpc.com'} ({log.performedBy?.role || 'System'})
                          </Typography>
                        </TableCell>
                        <TableCell>{getActionChip(log.action)}</TableCell>
                        <TableCell>{getEntityChip(log.entityType)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                          {log.entityId}
                        </TableCell>
                        <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="View payload details">
                            <IconButton size="small" onClick={() => handleOpenDetails(log)} sx={{ color: statusBadge.info.text }}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {logs.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={logs.length}
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
          )}
        </Card>
      )}

      {/* Details Inspector Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        {detailsOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>Inspect Payload Data</Typography>
            {selectedLog && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Action: {selectedLog.action} | Entity: {selectedLog.entityType} | ID: {selectedLog.entityId}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setDetailsOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Operator</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {selectedLog.performedBy?.displayName} ({selectedLog.performedBy?.email})
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Timestamp</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(selectedLog.timestamp).toLocaleString('en-IN')}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>Payload JSON</Typography>
              <Box
                sx={{
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.4)' : surface.pageLight,
                  p: 2,
                  borderRadius: 2,
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '400px',
                  whiteSpace: 'pre-wrap',
                  border: (theme) => `1px solid ${border.code(theme.palette.mode === 'dark')}`,
                  color: (theme) => status.success.codeGreen(theme.palette.mode === 'dark')
                }}
              >
                {formatJson(selectedLog.details)}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="contained" onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AuditReport;
