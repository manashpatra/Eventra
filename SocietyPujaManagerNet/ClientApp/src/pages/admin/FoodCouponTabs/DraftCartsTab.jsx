import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, IconButton, Chip,
  Grid, FormControl, InputLabel, Select, MenuItem, Tooltip, Fade,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, InputAdornment, Alert
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  ShoppingCartCheckout as LoadCartIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Restaurant as DineIcon,
  TakeoutDining as ParcelIcon,
  Home as HomeIcon,
  Phone as PhoneIcon,
  AccessTime as TimeIcon,
  WarningAmber as WarningIcon,
  CheckCircle as CheckIcon,
  Fastfood as FastfoodIcon,
  CreditCard as PaymentIcon
} from '@mui/icons-material';
import { getAllDraftCarts, deleteDraftCart, isFoodDayValid } from '../../../services/draftCartService';
import { formatDateTime, formatDate } from '../../../utils/dateUtils';
import { getMealDisplayName } from '../../../utils/textFormatters';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { useSnackbar } from 'notistack';
import { brand, statusBadge, leadsPalette, printTheme, gradient as themeGradient } from '../../../theme/colorTokens';

const SummaryCard = ({ title, value, subtitle, icon, color, bg }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` } }}>
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.25 }}>{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>{subtitle}</Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const DraftCartsTab = ({ residents = [], config, onSelectDraft, onDraftCountChange, isAuditor = false }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [expandedDrafts, setExpandedDrafts] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ open: false, draftId: null, flatNumber: '' });
  const [deletingId, setDeletingId] = useState(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const allDrafts = await getAllDraftCarts();
      const pending = (allDrafts || [])
        .filter(d => d.status === 'pending')
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setDrafts(pending);
      if (onDraftCountChange) {
        onDraftCountChange(pending.length);
      }
    } catch (error) {
      console.error('Error fetching draft carts:', error);
      enqueueSnackbar('Failed to load draft carts: ' + error.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  };

  const toggleExpand = (id) => {
    setExpandedDrafts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenDiscard = (draft) => {
    setConfirmDialog({
      open: true,
      draftId: draft.id,
      flatNumber: draft.flatNumber
    });
  };

  const handleConfirmDiscard = async () => {
    const { draftId, flatNumber } = confirmDialog;
    if (!draftId) return;

    setDeletingId(draftId);
    try {
      await deleteDraftCart(draftId);
      const updated = drafts.filter(d => d.id !== draftId);
      setDrafts(updated);
      if (onDraftCountChange) {
        onDraftCountChange(updated.length);
      }
      enqueueSnackbar(`Draft cart for Flat ${flatNumber} discarded.`, { variant: 'success' });
    } catch (error) {
      console.error('Error deleting draft cart:', error);
      enqueueSnackbar('Failed to discard draft: ' + error.message, { variant: 'error' });
    } finally {
      setDeletingId(null);
      setConfirmDialog({ open: false, draftId: null, flatNumber: '' });
    }
  };

  // Filtered drafts based on search and payment mode
  const filteredDrafts = useMemo(() => {
    return drafts.filter(draft => {
      const flatMatch = (draft.flatNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const nameMatch = (draft.residentName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch = !searchTerm || flatMatch || nameMatch;

      const matchesPayment = paymentFilter === 'all' || (draft.paymentMode || 'Cash').toLowerCase() === paymentFilter.toLowerCase();

      return matchesSearch && matchesPayment;
    });
  }, [drafts, searchTerm, paymentFilter]);

  // Overall analytics
  const analytics = useMemo(() => {
    const totalDrafts = drafts.length;
    const uniqueFlats = new Set(drafts.map(d => d.flatNumber)).size;
    let totalPlates = 0;
    let totalAmount = 0;

    drafts.forEach(d => {
      totalAmount += Number(d.totalAmount) || 0;
      (d.items || []).forEach(item => {
        totalPlates += (item.normalDineOutCount || 0) + (item.normalParcelCount || 0) + (item.additionalDineOutCount || 0) + (item.additionalParcelCount || 0);
      });
    });

    return { totalDrafts, uniqueFlats, totalPlates, totalAmount };
  }, [drafts]);

  // Map resident details for quick lookup (e.g. phone, block)
  const residentMap = useMemo(() => {
    const map = {};
    residents.forEach(r => {
      if (r.id) map[r.id] = r;
      if (r.flatNumber) map[r.flatNumber] = r;
    });
    return map;
  }, [residents]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: brand.orange }} />
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box>
        {/* Analytics Summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              title="Pending Drafts"
              value={analytics.totalDrafts}
              icon={<ShoppingCartIcon />}
              color={brand.orange}
              bg="rgba(255,143,0,0.12)"
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              title="Flats Pre-Booked"
              value={analytics.uniqueFlats}
              icon={<HomeIcon />}
              color={leadsPalette.total.color}
              bg={leadsPalette.total.bg}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              title="Total Plates"
              value={analytics.totalPlates}
              icon={<FastfoodIcon />}
              color={statusBadge.success.text}
              bg={statusBadge.success.bg}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <SummaryCard
              title="Pre-Booked Amount"
              value={formatCurrency(analytics.totalAmount)}
              icon={<PaymentIcon />}
              color={brand.gold}
              bg="rgba(255,193,7,0.12)"
            />
          </Grid>
        </Grid>

        {/* Filter & Action Bar */}
        <Card sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search flat number or resident..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 7, sm: 4, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Mode</InputLabel>
                  <Select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    label="Payment Mode"
                  >
                    <MenuItem value="all">All Modes</MenuItem>
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 5, sm: 3, md: 5 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Tooltip title="Refresh Draft Carts">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={fetchDrafts}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Refresh
                  </Button>
                </Tooltip>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredDrafts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'action.hover',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: 36, color: 'text.secondary', opacity: 0.4 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
              {searchTerm || paymentFilter !== 'all' ? 'No matching draft carts found' : 'No Pending Draft Carts'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 450, mx: 'auto' }}>
              {searchTerm || paymentFilter !== 'all'
                ? 'Try adjusting your search or payment mode filter.'
                : 'All resident pre-booked food carts have been loaded and completed, or none have been submitted yet.'}
            </Typography>
          </Box>
        ) : (
          /* Draft Cards List */
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredDrafts.map((draft) => {
              const isExpanded = expandedDrafts[draft.id] || false;
              const res = residentMap[draft.residentId] || residentMap[draft.flatNumber];
              const items = draft.items || [];
              const totalItems = items.length;
              const totalPlates = items.reduce((sum, item) => {
                return sum + (item.normalDineOutCount || 0) + (item.normalParcelCount || 0) + (item.additionalDineOutCount || 0) + (item.additionalParcelCount || 0);
              }, 0);

              const hasExpiredItems = items.some(item => !isFoodDayValid(item.dayDate));

              return (
                <Card
                  key={draft.id}
                  sx={{
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 3,
                      borderColor: brand.orange,
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 4,
                      background: draft.paymentMode === 'UPI' ? themeGradient.purpleVibrant : themeGradient.orangeVibrant,
                    }
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                      {/* Left info: Flat, Resident, Contact */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Flat ${draft.flatNumber}`}
                          size="medium"
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            bgcolor: brand.orangeLight,
                            color: brand.orangeDark,
                            border: `1px solid ${brand.orange}40`,
                            px: 0.5
                          }}
                        />
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {draft.residentName || res?.name || 'Resident'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.25, flexWrap: 'wrap' }}>
                            {res?.mobile && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <PhoneIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                  {res.mobile}
                                </Typography>
                              </Box>
                            )}
                            {draft.createdAt && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                <TimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatDateTime(draft.createdAt, config?.dateFormat)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      {/* Right info: Badges & Amounts */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={draft.paymentMode || 'Cash'}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            bgcolor: draft.paymentMode === 'UPI' ? leadsPalette.total.bg : statusBadge.success.bg,
                            color: draft.paymentMode === 'UPI' ? leadsPalette.total.color : statusBadge.success.text,
                            border: '1px solid',
                            borderColor: draft.paymentMode === 'UPI' ? statusBadge.purple.border : statusBadge.success.border,
                          }}
                        />
                        <Chip
                          label={`${totalItems} item${totalItems === 1 ? '' : 's'} (${totalPlates} plates)`}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                        {hasExpiredItems && (
                          <Chip
                            icon={<WarningIcon sx={{ fontSize: '14px !important' }} />}
                            label="Has past date items"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: 800, color: brand.gold, minWidth: 90, textAlign: 'right' }}>
                          {formatCurrency(draft.totalAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Actions and Toggle */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                      <Button
                        size="small"
                        onClick={() => toggleExpand(draft.id)}
                        endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600, px: 0.5 }}
                      >
                        {isExpanded ? 'Hide Items' : `View ${totalItems} Item${totalItems === 1 ? '' : 's'}`}
                      </Button>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Button
                          size="small"
                          color="error"
                          variant="text"
                          startIcon={<DeleteIcon fontSize="small" />}
                          onClick={() => handleOpenDiscard(draft)}
                          disabled={deletingId === draft.id}
                          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.8rem' }}
                        >
                          Discard
                        </Button>
                        {!isAuditor && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<LoadCartIcon />}
                            onClick={() => onSelectDraft(draft)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              bgcolor: brand.orange,
                              '&:hover': { bgcolor: brand.orangeDark },
                              boxShadow: '0 2px 8px rgba(255,143,0,0.3)',
                              px: 2,
                            }}
                          >
                            Load into Sell Counter
                          </Button>
                        )}
                      </Box>
                    </Box>

                    {/* Collapsible Items Table */}
                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 2 }}>
                        <TableContainer sx={{ bgcolor: 'background.default', borderRadius: 1.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'action.hover' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Day & Date</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Meal</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Food Type</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Plates</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Amount</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items.map((item, idx) => {
                                const isValid = isFoodDayValid(item.dayDate);
                                const dine = (item.normalDineOutCount || 0) + (item.additionalDineOutCount || 0);
                                const parcel = (item.normalParcelCount || 0) + (item.additionalParcelCount || 0);
                                const platesText = [];
                                if (dine > 0) platesText.push(`Dine: ${dine}`);
                                if (parcel > 0) platesText.push(`Parcel: ${parcel}`);

                                return (
                                  <TableRow key={idx} sx={{ opacity: isValid ? 1 : 0.6, bgcolor: isValid ? 'inherit' : 'action.disabledBackground' }}>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                      {item.day || 'Day'}
                                      {item.dayDate && (
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                          {formatDate(item.dayDate, config?.dateFormat)}
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                      {item.mealType === 'Breakfast' ? '🌅' : item.mealType === 'Lunch' ? '☀️' : '🌙'} {getMealDisplayName(item.day, item.mealType)}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={item.foodType || 'Veg'}
                                        size="small"
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '0.68rem',
                                          height: 22,
                                          bgcolor: item.foodType === 'Veg' ? statusBadge.success.bg : item.foodType === 'Chicken' ? statusBadge.warning.bg : statusBadge.error.bg,
                                          color: item.foodType === 'Veg' ? statusBadge.success.text : item.foodType === 'Chicken' ? brand.orange : statusBadge.error.text,
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                      {platesText.join(', ') || `${(item.normalDineOutCount || 0) + (item.normalParcelCount || 0)} plates`}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700, color: brand.gold }}>
                                      {formatCurrency(item.totalAmount)}
                                    </TableCell>
                                    <TableCell align="center">
                                      {isValid ? (
                                        <Chip label="Valid" size="small" color="success" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                                      ) : (
                                        <Chip label="Expired" size="small" color="default" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }} />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Discard Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title="Discard Pre-Booked Draft Cart?"
          message={`Are you sure you want to discard the pre-booked food draft cart for Flat ${confirmDialog.flatNumber}? This cannot be undone.`}
          onConfirm={handleConfirmDiscard}
          onCancel={() => setConfirmDialog({ open: false, draftId: null, flatNumber: '' })}
          confirmText="Discard Draft"
          cancelText="Keep Draft"
          isDestructive={true}
        />
      </Box>
    </Fade>
  );
};

export default DraftCartsTab;
