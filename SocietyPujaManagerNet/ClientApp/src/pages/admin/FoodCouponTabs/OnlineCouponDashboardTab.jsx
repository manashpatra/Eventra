import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Fade, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Collapse, IconButton, TextField, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  PhoneAndroid as PhoneAndroidIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getAllFoodCouponDocs, updateAccessCode } from '../../../services/foodCouponService';
import { getMealDisplayName } from '../../../utils/textFormatters';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import { useSnackbar } from 'notistack';
import { brand, statusBadge, leadsPalette, gradient as themeGradient } from '../../../theme/colorTokens';

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

const OnlineCouponDashboardTab = ({ config }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [onlineCoupons, setOnlineCoupons] = useState([]);
  const [expandedFlats, setExpandedFlats] = useState({});
  const [revealedCodes, setRevealedCodes] = useState({});

  // Edit access code dialog
  const [editDialog, setEditDialog] = useState({ open: false, docId: '', currentCode: '' });
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAllFoodCouponDocs();
      setOnlineCoupons(data);
    } catch (error) {
      console.error('Error loading online food coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const toggleExpand = (id) => {
    setExpandedFlats(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRevealCode = (id) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditCode = (docId, currentCode) => {
    setEditDialog({ open: true, docId, currentCode });
    setNewCode(currentCode);
    setCodeError('');
  };

  const handleSaveCode = async () => {
    const code = newCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Please enter a valid 6-digit numeric code');
      return;
    }
    setSaving(true);
    try {
      await updateAccessCode(editDialog.docId, code);
      setOnlineCoupons(prev => prev.map(doc =>
        doc.id === editDialog.docId ? { ...doc, accessCode: code } : doc
      ));
      setEditDialog({ open: false, docId: '', currentCode: '' });
      enqueueSnackbar('Access code updated successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error updating access code: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Analytics
  const analytics = useMemo(() => {
    if (!onlineCoupons || onlineCoupons.length === 0) return null;

    const totalFlats = onlineCoupons.length;
    let totalCoupons = 0;
    let redeemedCount = 0;
    let pendingCount = 0;
    let totalAmount = 0;

    onlineCoupons.forEach(doc => {
      (doc.coupons || []).forEach(c => {
        totalCoupons++;
        totalAmount += c.totalAmount || 0;
        if (c.redeemed) {
          redeemedCount++;
        } else {
          pendingCount++;
        }
      });
    });

    return { totalFlats, totalCoupons, redeemedCount, pendingCount, totalAmount };
  }, [onlineCoupons]);

  // Sort flats by flat number
  const sortedDocs = useMemo(() => {
    return [...onlineCoupons].sort((a, b) => (a.flatNumber || '').localeCompare(b.flatNumber || '', undefined, { numeric: true }));
  }, [onlineCoupons]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: leadsPalette.total.color }} />
      </Box>
    );
  }

  return (
    <Fade in={true}>
      <Box>
        {/* Refresh */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadData} size="small" color="primary">
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {!analytics ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <PhoneAndroidIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>No online food coupons issued yet</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Issue online food coupons from the Sell counter to see data here.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
                <SummaryCard
                  title="Flats Issued"
                  value={analytics.totalFlats}
                  icon={<PhoneAndroidIcon />}
                  color={leadsPalette.total.color}
                  bg={leadsPalette.total.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
                <SummaryCard
                  title="Total Coupons"
                  value={analytics.totalCoupons}
                  icon={<PhoneAndroidIcon />}
                  color={brand.orange}
                  bg="rgba(255,143,0,0.12)"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
                <SummaryCard
                  title="Redeemed"
                  value={analytics.redeemedCount}
                  subtitle={`${analytics.totalCoupons > 0 ? Math.round((analytics.redeemedCount / analytics.totalCoupons) * 100) : 0}%`}
                  icon={<CheckCircleIcon />}
                  color={statusBadge.success.text}
                  bg={statusBadge.success.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2.4 }}>
                <SummaryCard
                  title="Pending"
                  value={analytics.pendingCount}
                  icon={<PendingIcon />}
                  color={statusBadge.warning.text}
                  bg={statusBadge.warning.bg}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, lg: 2.4 }}>
                <SummaryCard
                  title="Total Amount"
                  value={formatCurrency(analytics.totalAmount)}
                  icon={<PhoneAndroidIcon />}
                  color={statusBadge.info.text}
                  bg={statusBadge.info.bg}
                />
              </Grid>
            </Grid>

            {/* Per-Flat Table */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
              Per-Flat Online Coupons
            </Typography>

            {sortedDocs.map(doc => {
              const isExpanded = expandedFlats[doc.id] || false;
              const isRevealed = revealedCodes[doc.id] || false;
              const coupons = doc.coupons || [];
              const redeemed = coupons.filter(c => c.redeemed).length;
              const pending = coupons.length - redeemed;

              // Group coupons by day
              const dayGroups = {};
              coupons.forEach(c => {
                const day = c.day || 'Unknown';
                if (!dayGroups[day]) dayGroups[day] = [];
                dayGroups[day].push(c);
              });

              // Sort days by dayDate
              const sortedDays = Object.keys(dayGroups).sort((a, b) => {
                const dateA = dayGroups[a][0]?.dayDate ? new Date(dayGroups[a][0].dayDate).getTime() : 0;
                const dateB = dayGroups[b][0]?.dayDate ? new Date(dayGroups[b][0].dayDate).getTime() : 0;
                return dateA - dateB;
              });

              return (
                <Card key={doc.id} sx={{ mb: 1.5, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: themeGradient.purpleVibrant } }}>
                  {/* Flat Header — always visible */}
                  <Box
                    onClick={() => toggleExpand(doc.id)}
                    sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      px: 2, pl: 3, py: 1.5, cursor: 'pointer',
                      '&:hover': { bgcolor: leadsPalette.total.bg },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{doc.flatNumber}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{doc.residentName}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Chip
                          label={isRevealed ? doc.accessCode : '••••••'}
                          size="small"
                          sx={{
                            fontWeight: 700, fontSize: '0.75rem', fontFamily: 'monospace',
                            bgcolor: leadsPalette.total.bg, color: leadsPalette.total.color,
                            border: `1px solid ${statusBadge.purple.border}`,
                          }}
                        />
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); toggleRevealCode(doc.id); }} sx={{ p: 0.25 }}>
                          {isRevealed ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleEditCode(doc.id, doc.accessCode); }} sx={{ p: 0.25 }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Chip label={`${redeemed}/${coupons.length}`} size="small" color={redeemed === coupons.length ? 'success' : 'warning'} sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {pending > 0 ? `${pending} pending` : 'All redeemed'}
                      </Typography>
                      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Box>
                  </Box>

                  {/* Expanded: Per-day coupon details */}
                  <Collapse in={isExpanded}>
                    <Box sx={{ px: 2, pb: 2, pl: 3 }}>
                      {sortedDays.map(day => {
                        const dayCoupons = dayGroups[day];
                        const mealOrder = ['Breakfast', 'Lunch', 'Dinner'];
                        const sortedCoupons = [...dayCoupons].sort((a, b) => {
                          const aIdx = mealOrder.indexOf(a.mealType);
                          const bIdx = mealOrder.indexOf(b.mealType);
                          return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
                        });

                        return (
                          <Box key={day} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{day}</Typography>
                              {dayCoupons[0]?.dayDate && (
                                <Chip
                                  label={formatDate(dayCoupons[0].dayDate, config?.dateFormat)}
                                  size="small"
                                  sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: leadsPalette.total.bg, color: leadsPalette.total.color }}
                                />
                              )}
                            </Box>
                            <TableContainer>
                              <Table size="small" sx={{ bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 700 }}>Meal</TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Plates</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700 }}>Amount</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {sortedCoupons.map(c => {
                                    const totalPlates = (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
                                    return (
                                      <TableRow key={c.id}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                          {c.mealType === 'Breakfast' ? '🌅' : c.mealType === 'Lunch' ? '☀️' : '🌙'} {getMealDisplayName(day, c.mealType)}
                                        </TableCell>
                                        <TableCell>
                                          <Chip
                                            label={c.foodType}
                                            size="small"
                                            sx={{
                                              fontWeight: 600, fontSize: '0.65rem', height: 22,
                                              bgcolor: c.foodType === 'Veg' ? statusBadge.success.bg : c.foodType === 'Chicken' ? statusBadge.warning.bg : statusBadge.error.bg,
                                              color: c.foodType === 'Veg' ? statusBadge.success.text : c.foodType === 'Chicken' ? brand.orange : statusBadge.error.text,
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell align="center">
                                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{totalPlates}</Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: brand.gold }}>
                                            {formatCurrency(c.totalAmount)}
                                          </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                          {c.redeemed ? (
                                            <Tooltip title={c.redeemedAt ? `Redeemed at ${formatDateTime(c.redeemedAt, config?.dateFormat)}` : 'Redeemed'}>
                                              <Chip
                                                icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                                                label="Redeemed"
                                                size="small"
                                                color="success"
                                                sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                                              />
                                            </Tooltip>
                                          ) : (
                                            <Chip
                                              icon={<PendingIcon sx={{ fontSize: '14px !important' }} />}
                                              label="Pending"
                                              size="small"
                                              color="warning"
                                              sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                                            />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        );
                      })}
                    </Box>
                  </Collapse>
                </Card>
              );
            })}
          </>
        )}

        {/* Edit Access Code Dialog */}
        <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, docId: '', currentCode: '' })} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Update Access Code</Typography>
            <IconButton size="small" onClick={() => setEditDialog({ open: false, docId: '', currentCode: '' })}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="New 6-Digit Access Code"
              placeholder="e.g. 482913"
              value={newCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setNewCode(val);
                if (codeError) setCodeError('');
              }}
              error={!!codeError}
              helperText={codeError || 'Enter a new 6-digit numeric code'}
              slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' } }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditDialog({ open: false, docId: '', currentCode: '' })} color="inherit">Cancel</Button>
            <Button
              onClick={handleSaveCode}
              variant="contained"
              disabled={saving || newCode.length !== 6}
              sx={{
                background: themeGradient.purpleVibrant,
                '&:hover': { background: themeGradient.purpleVibrantHover },
                fontWeight: 700,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Fade>
  );
};

export default OnlineCouponDashboardTab;
