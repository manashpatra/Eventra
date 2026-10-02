import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, IconButton, Chip,
  MenuItem, Grid, FormControl, InputLabel, Select, Fade, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Refresh as RefreshIcon,
  CurrencyRupee as RupeeIcon,
  Payments as CashIcon,
  AccountBalance as BankIcon,
  Restaurant as RestaurantIcon,
  Receipt as ReceiptIcon,
  Calculate as CalculateIcon,
  QrCode as QrCodeIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';

import { deleteFoodCoupon } from '../../../services/foodCouponService';
import { matchesFlatOrName } from '../../../utils/flatHelper';
import { printHTML } from '../../../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles } from '../../../utils/print/shared';
import ConfirmDialog from '../../../components/ConfirmDialog';
import UpiQrDialog from '../../../components/UpiQrDialog';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getLocalISODate, formatDateTime, getDatePickerFormat } from '../../../utils/dateUtils';
import { getMealDisplayName } from '../../../utils/textFormatters';
import { brand, statusBadge, printTheme } from '../../../theme/colorTokens';

const SalesHistoryTab = ({ coupons, config, historyLoading, loadHistoryData, isAuditor }) => {
  const { enqueueSnackbar } = useSnackbar();

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDay, setFilterDay] = useState('all');
  const [filterMeal, setFilterMeal] = useState('all');
  const [filterFoodType, setFilterFoodType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, flatData: null });
  const [breakdownDialog, setBreakdownDialog] = useState(false);
  const [qrDialog, setQrDialog] = useState({ open: false, amount: 0 });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const renderPlatesBreakdown = (item) => {
    const parts = [];
    if (item.normalDineOutCount) parts.push(`Dine: ${item.normalDineOutCount}`);
    if (item.normalParcelCount) parts.push(`Parcel: ${item.normalParcelCount}`);
    if (item.additionalDineOutCount) parts.push(`Dine(A): ${item.additionalDineOutCount}`);
    if (item.additionalParcelCount) parts.push(`Parcel(A): ${item.additionalParcelCount}`);
    return parts.join(', ');
  };

  const filteredCoupons = useMemo(() => {
    let filtered = [...coupons];
    if (searchTerm) {
      filtered = filtered.filter((c) => matchesFlatOrName(c, searchTerm));
    }
    if (filterDay !== 'all') {
      filtered = filtered.filter((c) => c.day === filterDay);
      if (filterMeal !== 'all') {
        filtered = filtered.filter((c) => c.mealType === filterMeal);
      }
    }
    if (filterFoodType !== 'all') {
      filtered = filtered.filter((c) => c.foodType === filterFoodType);
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [coupons, searchTerm, filterDay, filterMeal, filterFoodType, startDate, endDate]);

  const filteredStats = useMemo(() => {
    const totalAmount = filteredCoupons.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const cashAmount = filteredCoupons
      .filter(c => c.paymentMode && c.paymentMode.toLowerCase() === 'cash')
      .reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const bankAmount = totalAmount - cashAmount;
    const totalDineOut = filteredCoupons.reduce((sum, c) => sum + (c.normalDineOutCount || 0) + (c.additionalDineOutCount || 0), 0);
    const totalParcel = filteredCoupons.reduce((sum, c) => sum + (c.normalParcelCount || 0) + (c.additionalParcelCount || 0), 0);

    const breakdownMap = {};
    const mealSummaryMap = {};

    const enabledMeals = config?.foodMeals?.filter(m => m.enabled).map(m => m.mealName) || ['Breakfast', 'Lunch', 'Dinner'];
    enabledMeals.forEach(m => {
      mealSummaryMap[m] = { Veg: 0, NonVeg: 0 };
    });

    filteredCoupons.forEach(c => {
      const plates = (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
      const day = c.day || 'Unknown Day';
      const meal = c.mealType || 'Unknown Meal';
      const food = c.foodType || 'Veg';

      if (!breakdownMap[day]) breakdownMap[day] = {};
      if (!breakdownMap[day][meal]) breakdownMap[day][meal] = {};
      if (!breakdownMap[day][meal][food]) breakdownMap[day][meal][food] = { plates: 0, amount: 0 };

      breakdownMap[day][meal][food].plates += plates;
      breakdownMap[day][meal][food].amount += (c.totalAmount || 0);

      if (!mealSummaryMap[meal]) mealSummaryMap[meal] = { Veg: 0, NonVeg: 0 };
      const isVeg = food.toLowerCase() === 'veg';
      if (isVeg) mealSummaryMap[meal].Veg += plates;
      else mealSummaryMap[meal].NonVeg += plates;
    });

    const breakdown = Object.keys(breakdownMap).map(day => ({
      day,
      meals: Object.keys(breakdownMap[day]).map(meal => ({
        meal,
        foods: Object.keys(breakdownMap[day][meal]).map(food => ({
          food,
          ...breakdownMap[day][meal][food]
        }))
      }))
    }));

    breakdown.sort((a, b) => {
      const aConfig = config?.foodDays?.find(d => d.dayName === a.day);
      const bConfig = config?.foodDays?.find(d => d.dayName === b.day);
      if (aConfig && bConfig) {
        return new Date(aConfig.dayDate) - new Date(bConfig.dayDate);
      }
      return 0;
    });

    const mealOrder = ['Breakfast', 'Lunch', 'Dinner'];
    breakdown.forEach(d => {
      d.meals.sort((a, b) => {
        const aIdx = mealOrder.indexOf(a.meal);
        const bIdx = mealOrder.indexOf(b.meal);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        return 0;
      });
    });

    const mOrder = ['Breakfast', 'Lunch', 'Dinner'];
    const mealSummary = Object.keys(mealSummaryMap).map(meal => ({
      meal,
      ...mealSummaryMap[meal]
    })).sort((a, b) => {
      const aIdx = mOrder.indexOf(a.meal);
      const bIdx = mOrder.indexOf(b.meal);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      return 0;
    });

    return { totalCoupons: filteredCoupons.length, totalAmount, cashAmount, bankAmount, totalDineOut, totalParcel, breakdown, mealSummary };
  }, [filteredCoupons, config]);

  const groupedCoupons = useMemo(() => {
    const map = {};
    filteredCoupons.forEach(c => {
      const key = c.flatNumber;
      if (!map[key]) {
        map[key] = {
          flatNumber: c.flatNumber,
          residentName: c.residentName,
          totalAmount: 0,
          totalCoupons: 0,
          totalPlates: 0,
          coupons: []
        };
      }
      map[key].totalAmount += c.totalAmount || 0;
      map[key].totalCoupons += 1;
      map[key].totalPlates += (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
      map[key].coupons.push(c);
    });
    return Object.values(map);
  }, [filteredCoupons]);

  const handleDelete = (coupon) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Food Coupon',
      message: 'Are you sure you want to delete this food coupon? This action cannot be undone.',
      onConfirm: async () => {
        await deleteFoodCoupon(coupon.flatDocId, coupon.id);
        await loadHistoryData();
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleBulkDelete = (flatNumber, couponsToDelete) => {
    setConfirmDialog({
      open: true,
      title: 'Bulk Delete Food Coupons',
      message: `Are you sure you want to delete all ${couponsToDelete.length} coupons for Flat ${flatNumber}? This cannot be undone.`,
      onConfirm: async () => {
        try {
          for (const c of couponsToDelete) {
            await deleteFoodCoupon(c.flatDocId, c.id);
          }
          await loadHistoryData();
        } catch (error) {
          console.error("Error during bulk delete", error);
        } finally {
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const printIssuedCoupons = async (issuedItems) => {
    if (!issuedItems || issuedItems.length === 0) return;
    
    const sortedItems = [...issuedItems].sort((a, b) => {
      const dayConfigA = config?.foodDays?.find(d => d.dayName === a.day);
      const dayConfigB = config?.foodDays?.find(d => d.dayName === b.day);
      const dateA = dayConfigA?.date ? new Date(dayConfigA.date).getTime() : 0;
      const dateB = dayConfigB?.date ? new Date(dayConfigB.date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;

      const mealOrder = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      const mealA = mealOrder[a.mealType] || 4;
      const mealB = mealOrder[b.mealType] || 4;
      return mealA - mealB;
    });

    const residentName = sortedItems[0]?.residentName || '';
    const flatNumber = sortedItems[0]?.flatNumber || '';
    const payMode = sortedItems[0]?.paymentMode || 'Cash';
    const totalPaid = sortedItems.reduce((s, c) => s + (c.totalAmount || 0), 0);

    const headerHtml = getPrintHeaderHTML(config || {});
    const styles = getPrintHeaderStyles();

    // QR codes are not needed for physical coupons since they are managed by physical handover

    let itemsHtml = '';
    sortedItems.forEach((c) => {
      itemsHtml += `
        <div style="border: 2px dashed ${printTheme.orangeBanner}; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: ${printTheme.orangeBannerBg}; page-break-inside: avoid; text-align: center;">
            <div>
              <div style="font-size: 18px; font-weight: bold; color: ${printTheme.orangeBanner}; margin-bottom: 6px;">${c.day || ''} - ${getMealDisplayName(c.day, c.mealType || '')} (${c.foodType || ''})</div>
              <div style="font-size: 15px; margin-bottom: 4px; color: ${printTheme.text};"><strong>Plates:</strong> ${renderPlatesBreakdown(c)}</div>
              ${c.couponNumbers ? `<div style="font-size: 12px; color: ${printTheme.textSecondary}; margin-bottom: 4px;">Coupon #: ${c.couponNumbers}</div>` : ''}
              <div style="font-size: 16px; font-weight: bold; margin-top: 6px; color: ${printTheme.text};">Amount Paid: ${formatCurrency(c.totalAmount)}</div>
            </div>
        </div>
      `;
    });

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Food Coupon Receipt - ${flatNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: ${printTheme.text}; margin: 0; }
            ${styles}
            .receipt-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; color: ${printTheme.orangeBanner}; text-transform: uppercase; letter-spacing: 1px; }
            .info-box { margin-bottom: 20px; font-size: 14px; line-height: 1.6; border-bottom: 1px solid ${printTheme.borderDivider}; padding-bottom: 12px; }
            .total-row { font-size: 16px; font-weight: bold; color: ${printTheme.orangeBanner}; text-align: right; margin-top: 20px; padding: 12px; background: ${printTheme.orangeBannerHighlight}; border-radius: 6px; }
            .footer-msg { text-align: center; margin-top: 25px; color: ${printTheme.footerText}; font-size: 12px; border-top: 1px dashed ${printTheme.borderDashed}; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="receipt-title">Food Coupons Receipt</div>
          <div class="info-box">
            <strong>Flat Number:</strong> ${flatNumber}<br/>
            <strong>Resident Name:</strong> ${residentName}<br/>
            <strong>Payment Mode:</strong> ${payMode}<br/>
            <strong>Date & Time:</strong> ${formatDateTime(new Date(), config?.dateFormat)}
          </div>
          <div style="margin-top: 15px;">${itemsHtml}</div>
          <div class="total-row">Total Amount Paid: ${formatCurrency(totalPaid)}</div>
          <div class="footer-msg">🙏 Thank you for your food coupon purchase! Jai Maa Durga! 🌺</div>
        </body>
      </html>
    `;
    printHTML(fullHTML);
  };

  return (
    <Fade in={true}>
      <Box>
        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Filter Controls */}
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Grid container spacing={2} sx={{ alignItems: "center" }}>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <DatePicker
                      label="Start Date"
                      value={startDate ? new Date(startDate) : null}
                      onChange={(newValue) => {
                        if (newValue && !isNaN(newValue.getTime())) {
                          setStartDate(getLocalISODate(newValue));
                        } else {
                          setStartDate('');
                        }
                      }}
                      format={getDatePickerFormat(config?.dateFormat)}
                      sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <DatePicker
                      label="End Date"
                      value={endDate ? new Date(endDate) : null}
                      onChange={(newValue) => {
                        if (newValue && !isNaN(newValue.getTime())) {
                          setEndDate(getLocalISODate(newValue));
                        } else {
                          setEndDate('');
                        }
                      }}
                      format={getDatePickerFormat(config?.dateFormat)}
                      sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4, md: 2.5 }}>
                    <TextField
                      fullWidth size="small"
                      placeholder="Search flat/name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Day</InputLabel>
                      <Select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} label="Day">
                        <MenuItem value="all">All Days</MenuItem>
                        {(config?.foodDays || []).map((d) => (
                          <MenuItem key={d.dayName} value={d.dayName}>{d.dayName}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                    <FormControl fullWidth size="small" disabled={filterDay === 'all'}>
                      <InputLabel>Meal</InputLabel>
                      <Select value={filterDay === 'all' ? 'all' : filterMeal} onChange={(e) => setFilterMeal(e.target.value)} label="Meal">
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Breakfast">Breakfast</MenuItem>
                        <MenuItem value="Lunch">Lunch</MenuItem>
                        <MenuItem value="Dinner">{getMealDisplayName(filterDay, 'Dinner')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Food</InputLabel>
                      <Select value={filterFoodType} onChange={(e) => setFilterFoodType(e.target.value)} label="Food">
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="Veg">Veg</MenuItem>
                        <MenuItem value="Chicken">Chicken</MenuItem>
                        <MenuItem value="Mutton">Mutton</MenuItem>
                        <MenuItem value="Non-Veg">Non-Veg</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3, md: 1 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Tooltip title="Reconcile">
                      <IconButton color="secondary" onClick={() => setBreakdownDialog(true)} sx={{ bgcolor: 'secondary.light', color: 'secondary.main', '&:hover': { bgcolor: 'secondary.main', color: 'white' } }}>
                        <CalculateIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh History">
                      <IconButton color="primary" onClick={loadHistoryData} disabled={historyLoading} sx={{ bgcolor: 'primary.light', color: 'primary.main', '&:hover': { bgcolor: 'primary.main', color: 'white' } }}>
                        <RefreshIcon />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Grouped Issued Coupons Table */}
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Flat & Resident</TableCell>
                    <TableCell align="center">Total Coupons</TableCell>
                    <TableCell align="center">Total Plates</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    {!isAuditor && <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedCoupons.map((group) => (
                    <TableRow key={group.flatNumber}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{group.flatNumber}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{group.residentName}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={group.totalCoupons} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{group.totalPlates}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: brand.gold }}>{formatCurrency(group.totalAmount)}</Typography>
                      </TableCell>
                      {!isAuditor && (
                        <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => printIssuedCoupons(group.coupons)}
                            title="Print All"
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => setDetailsDialog({ open: true, flatData: group })}
                            title="View Details"
                          >
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleBulkDelete(group.flatNumber, group.coupons)}
                            title="Delete All"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {groupedCoupons.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>No food coupons found.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        />

        {/* Coupon Details Dialog */}
        <Dialog
          open={detailsDialog.open}
          onClose={() => setDetailsDialog({ open: false, flatData: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">
              Coupon Details - {detailsDialog.flatData?.flatNumber} ({detailsDialog.flatData?.residentName})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button onClick={() => setDetailsDialog({ open: false, flatData: null })} size="small">
                Close
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Day / Meal</TableCell>
                    <TableCell>Food Type</TableCell>
                    <TableCell>Plates Breakdown</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                    {!isAuditor && <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Action</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.values((detailsDialog.flatData?.coupons || []).reduce((acc, c) => {
                    const timeKey = c.createdAt ? c.createdAt.substring(0, 16) : 'unknown';
                    if (!acc[timeKey]) acc[timeKey] = { timeKey, displayTime: c.createdAt ? formatDateTime(c.createdAt, config?.dateFormat) : 'Unknown Time', coupons: [], txTotalAmount: 0 };
                    acc[timeKey].coupons.push(c);
                    acc[timeKey].txTotalAmount += (c.totalAmount || 0);
                    return acc;
                  }, {})).sort((a, b) => b.timeKey.localeCompare(a.timeKey)).map((group) => (
                    <React.Fragment key={group.timeKey}>
                      <TableRow sx={{ bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
                        <TableCell colSpan={5}>
                          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                            Transaction: {group.displayTime}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {!isAuditor && group.txTotalAmount > 0 && (
                            <Tooltip title={`Show Consolidated UPI QR (${formatCurrency(group.txTotalAmount)})`}>
                              <IconButton 
                                size="small" 
                                color="secondary" 
                                onClick={() => setQrDialog({ open: true, amount: group.txTotalAmount, flatNumber: detailsDialog.flatData?.flatNumber })}
                              >
                                <QrCodeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                      {group.coupons.map((c) => (
                        <TableRow key={c.id}>
                      <TableCell>
                        <Chip label={c.day} size="small" sx={{ mr: 0.5 }} />
                        <Typography variant="caption">{getMealDisplayName(c.day, c.mealType)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={c.foodType} size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: c.foodType === 'Veg' ? statusBadge.success.bg : c.foodType === 'Chicken' ? statusBadge.warning.bg : c.foodType === 'Mutton' ? statusBadge.purple.bg : statusBadge.error.bg,
                            color: c.foodType === 'Veg' ? statusBadge.success.text : c.foodType === 'Chicken' ? statusBadge.warning.text : c.foodType === 'Mutton' ? statusBadge.purple.text : statusBadge.error.text
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{renderPlatesBreakdown(c)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: brand.gold }}>{formatCurrency(c.totalAmount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {c.createdAt ? formatDateTime(c.createdAt, config?.dateFormat) : '-'}
                        </Typography>
                      </TableCell>
                      {!isAuditor && (
                        <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" color="primary" onClick={() => printIssuedCoupons([c])} title="Print Receipt">
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => {
                            handleDelete(c);
                            setDetailsDialog({ open: false, flatData: null });
                          }} title="Delete Coupon">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>

        {/* Reconciliation Breakdown Dialog */}
        <Dialog
          open={breakdownDialog}
          onClose={() => setBreakdownDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" component="div">Reconciliation Breakdown</Typography>
            <Button onClick={() => setBreakdownDialog(false)} size="small">Close</Button>
          </DialogTitle>
          <DialogContent dividers>
            {!filteredStats?.breakdown || filteredStats.breakdown.length === 0 ? (
              <Typography>No data available.</Typography>
            ) : (
              filteredStats.breakdown.map(d => (
                <Box key={d.day} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'primary.main', borderBottom: '1px solid', borderColor: 'divider', pb: 0.5, mb: 1 }}>
                    {d.day}
                  </Typography>
                  {d.meals.map(m => (
                    <Box key={m.meal} sx={{ ml: 2, mb: 1.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.meal}</Typography>
                      <Table size="small" sx={{ mt: 0.5, mb: 1, bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Food Type</TableCell>
                            <TableCell align="center">Plates</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {m.foods.map(f => (
                            <TableRow key={f.food}>
                              <TableCell>{f.food}</TableCell>
                              <TableCell align="center">
                                <Chip label={f.plates} size="small" />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: brand.gold }}>
                                {formatCurrency(f.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBreakdownDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* QR Code Dialog */}
        <UpiQrDialog
          open={qrDialog.open}
          onClose={() => setQrDialog({ open: false, amount: 0 })}
          amount={qrDialog.amount}
          flatNumber={(qrDialog.flatNumber || '').replace(/[\s-]+/g, ' ').replace(/^(\d+)\s+(\d+)\s*([A-Za-z])$/, '$1/$2$3').replace(/^(\d+)\s+([\d]+[A-Za-z])$/, '$1/$2')}
          config={config}
          mode="food"
        />
      </Box>
    </Fade>
  );
};

export default SalesHistoryTab;
