import React, { useState, useMemo, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Fade, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Collapse, Button, IconButton, TextField, Drawer, Menu, MenuItem
} from '@mui/material';
import {
  Fastfood as FastfoodIcon,
  CurrencyRupee as RupeeIcon,
  Payments as CashIcon,
  AccountBalance as BankIcon,
  Restaurant as RestaurantIcon,
  LocalDining as DineOutIcon,
  TakeoutDining as ParcelIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  ArrowDropDown as ArrowDropDownIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formatDate, getLocalISODate } from '../../../utils/dateUtils';
import { getMealDisplayName } from '../../../utils/textFormatters';
import { printHTML } from '../../../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles, getPrintFooterHTML } from '../../../utils/print/shared';
import {
  brand,
  secondary,
  statusBadge,
  printTheme,
} from '../../../theme/colorTokens';

const SummaryCard = ({ title, value, subtitle, icon, color, bg }) => (
  <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, ${color}88)` } }}>
    <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
        <Box sx={{ width: { xs: 34, sm: 42 }, height: { xs: 34, sm: 42 }, borderRadius: { xs: '8px', sm: '12px' }, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {React.cloneElement(icon, { sx: { color, fontSize: { xs: 18, sm: 22 } } })}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.68rem', sm: '0.75rem' }, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mb: 0.25 }}>
            {title}
          </Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.2rem', lg: '1.35rem' }, lineHeight: 1.2, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontSize: { xs: '0.62rem', sm: '0.72rem' }, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const FoodDashboardTab = ({ coupons, config, historyLoading, loadHistoryData, historyLoaded, showFilters, setShowFilters }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [printAnchorEl, setPrintAnchorEl] = useState(null);

  const handlePrintMenuOpen = (event) => setPrintAnchorEl(event.currentTarget);
  const handlePrintMenuClose = () => setPrintAnchorEl(null);

  // Auto-load data if not yet loaded
  useEffect(() => {
    if (!historyLoaded && !historyLoading) {
      loadHistoryData();
    }
  }, [historyLoaded, historyLoading, loadHistoryData]);

  const formatCurrency = (amount, decimals = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount || 0);
  };

  // Compute dashboard analytics from coupons
  const analytics = useMemo(() => {
    if (!coupons || coupons.length === 0) return null;

    let filteredCoupons = coupons;
    if (startDate) {
      filteredCoupons = filteredCoupons.filter(c => c.createdAt && c.createdAt >= startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredCoupons = filteredCoupons.filter(c => c.createdAt && new Date(c.createdAt) <= end);
    }

    if (filteredCoupons.length === 0) return null;

    const totalAmount = filteredCoupons.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
    const cashAmount = filteredCoupons.filter(c => c.paymentMode?.toLowerCase() === 'cash').reduce((sum, c) => sum + (c.totalAmount || 0), 0)
      + filteredCoupons.filter(c => c.paymentMode === 'Cash + UPI').reduce((sum, c) => sum + (Number(c.mixedCashAmount) || 0), 0);
    const bankAmount = totalAmount - cashAmount;
    const totalDineOut = filteredCoupons.reduce((sum, c) => sum + (c.normalDineOutCount || 0) + (c.additionalDineOutCount || 0), 0);
    const totalParcel = filteredCoupons.reduce((sum, c) => sum + (c.normalParcelCount || 0) + (c.additionalParcelCount || 0), 0);
    const totalPlates = totalDineOut + totalParcel;

    // Per-Day, Per-Meal breakdown
    const dayMap = {};
    filteredCoupons.forEach(c => {
      const day = c.day || 'Unknown';
      const meal = c.mealType || 'Unknown';
      const food = c.foodType || 'Veg';
      const plates = (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
      const dineOut = (c.normalDineOutCount || 0) + (c.additionalDineOutCount || 0);
      const parcel = (c.normalParcelCount || 0) + (c.additionalParcelCount || 0);
      const amount = c.totalAmount || 0;

      if (!dayMap[day]) dayMap[day] = {};
      if (!dayMap[day][meal]) dayMap[day][meal] = { 
        plates: 0, dineOut: 0, parcel: 0, amount: 0, 
        veg: 0, vegDineOut: 0, vegParcel: 0,
        nonVeg: 0, nonVegDineOut: 0, nonVegParcel: 0,
        foodTypes: {} 
      };

      dayMap[day][meal].plates += plates;
      dayMap[day][meal].dineOut += dineOut;
      dayMap[day][meal].parcel += parcel;
      dayMap[day][meal].amount += amount;

      if (food.toLowerCase() === 'veg' || food.toLowerCase() === 'khichuri' || food.toLowerCase() === 'lucchi') {
        dayMap[day][meal].veg += plates;
        dayMap[day][meal].vegDineOut += dineOut;
        dayMap[day][meal].vegParcel += parcel;
      } else {
        dayMap[day][meal].nonVeg += plates;
        dayMap[day][meal].nonVegDineOut += dineOut;
        dayMap[day][meal].nonVegParcel += parcel;
      }

      if (!dayMap[day][meal].foodTypes[food]) dayMap[day][meal].foodTypes[food] = { plates: 0, amount: 0, dineOut: 0, parcel: 0 };
      dayMap[day][meal].foodTypes[food].plates += plates;
      dayMap[day][meal].foodTypes[food].amount += amount;
      dayMap[day][meal].foodTypes[food].dineOut += dineOut;
      dayMap[day][meal].foodTypes[food].parcel += parcel;
    });

    // Sort days by date from config
    const mealOrder = ['Breakfast', 'Lunch', 'Dinner'];
    const days = Object.keys(dayMap).map(day => {
      const dayConfig = config?.foodDays?.find(d => d.dayName === day);
      const meals = Object.keys(dayMap[day]).map(meal => ({
        meal,
        ...dayMap[day][meal],
      })).sort((a, b) => {
        const aIdx = mealOrder.indexOf(a.meal);
        const bIdx = mealOrder.indexOf(b.meal);
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });

      const dayTotals = meals.reduce((acc, m) => ({
        plates: acc.plates + m.plates,
        dineOut: acc.dineOut + m.dineOut,
        parcel: acc.parcel + m.parcel,
        amount: acc.amount + m.amount,
        veg: acc.veg + m.veg,
        vegDineOut: acc.vegDineOut + m.vegDineOut,
        vegParcel: acc.vegParcel + m.vegParcel,
        nonVeg: acc.nonVeg + m.nonVeg,
        nonVegDineOut: acc.nonVegDineOut + m.nonVegDineOut,
        nonVegParcel: acc.nonVegParcel + m.nonVegParcel,
      }), { plates: 0, dineOut: 0, parcel: 0, amount: 0, veg: 0, vegDineOut: 0, vegParcel: 0, nonVeg: 0, nonVegDineOut: 0, nonVegParcel: 0 });

      return { day, dayDate: dayConfig?.date || dayConfig?.dayDate || '', meals, totals: dayTotals };
    }).sort((a, b) => {
      if (a.dayDate && b.dayDate) return new Date(a.dayDate) - new Date(b.dayDate);
      return 0;
    });

    // Per-meal aggregate summary
    const mealSummary = {};
    filteredCoupons.forEach(c => {
      const meal = c.mealType || 'Unknown';
      const plates = (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
      const dineOut = (c.normalDineOutCount || 0) + (c.additionalDineOutCount || 0);
      const parcel = (c.normalParcelCount || 0) + (c.additionalParcelCount || 0);
      const food = c.foodType || 'Veg';

      if (!mealSummary[meal]) mealSummary[meal] = { plates: 0, dineOut: 0, parcel: 0, amount: 0, veg: 0, nonVeg: 0 };
      mealSummary[meal].plates += plates;
      mealSummary[meal].dineOut += dineOut;
      mealSummary[meal].parcel += parcel;
      mealSummary[meal].amount += c.totalAmount || 0;
      if (food.toLowerCase() === 'veg' || food.toLowerCase() === 'khichuri' || food.toLowerCase() === 'lucchi') {
        mealSummary[meal].veg += plates;
      } else {
        mealSummary[meal].nonVeg += plates;
      }
    });

    const mealSummaryArr = Object.keys(mealSummary).map(meal => ({
      meal,
      ...mealSummary[meal],
    })).sort((a, b) => {
      const aIdx = mealOrder.indexOf(a.meal);
      const bIdx = mealOrder.indexOf(b.meal);
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
    });

    return {
      totalCoupons: filteredCoupons.length,
      totalAmount, cashAmount, bankAmount,
      totalDineOut, totalParcel, totalPlates,
      days, mealSummary: mealSummaryArr,
    };
  }, [coupons, config, startDate, endDate]);

  const handlePrint = (mode = 'ADMIN') => {
    handlePrintMenuClose();
    if (!analytics) return;
    const headerHtml = getPrintHeaderHTML(config || {});
    
    const isVendor = mode === 'VENDOR_VEG' || mode === 'VENDOR_NONVEG';
    const isVeg = mode === 'VENDOR_VEG';
    const captionLabel = mode === 'ADMIN'
      ? 'For Admin'
      : mode === 'VENDOR_VEG'
        ? 'For Veg Vendor'
        : 'For Non-Veg Vendor';

    const isVegFood = (f) => f && (f.toLowerCase() === 'veg' || f.toLowerCase() === 'khichuri' || f.toLowerCase() === 'lucchi');

    let daysHtml = analytics.days.map(d => {
      const mealsRows = d.meals.map(m => {
        let foods = Object.keys(m.foodTypes || {});
        if (isVendor) {
          foods = foods.filter(f => isVeg ? isVegFood(f) : !isVegFood(f));
          if (foods.length === 0) return '';
        }

        if (foods.length === 0) {
          if (isVendor) return '';
          return `
            <tr>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; font-weight: 600;">${getMealDisplayName(d.day, m.meal)}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">-</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center; font-weight: bold;">${m.plates}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${m.dineOut}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${m.parcel}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; font-weight: bold;">${formatCurrency(m.amount)}</td>
            </tr>
          `;
        }

        const mealRowspan = foods.length;

        const rows = foods.map((f, idx) => `
          <tr>
            ${idx === 0 ? `<td rowspan="${mealRowspan}" style="padding: 6px; border: 1px solid ${printTheme.borderTable}; vertical-align: top; font-weight: 600; background: ${printTheme.priceBg};">${getMealDisplayName(d.day, m.meal)}</td>` : ''}
            <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; font-weight: 600;">${f}</td>
            <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center; font-weight: bold;">${m.foodTypes[f].plates}</td>
            <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${m.foodTypes[f].dineOut}</td>
            <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${m.foodTypes[f].parcel}</td>
            ${!isVendor ? `<td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; font-weight: bold;">${formatCurrency(m.foodTypes[f].amount)}</td>` : ''}
          </tr>
        `).join('');

        return rows;
      }).join('');

      if (!mealsRows.trim()) return '';

      return `
        <div class="day-section" style="break-inside: avoid; page-break-inside: avoid; margin-top: 18px;">
          <h3 style="margin-top: 0; color: ${brand.orangeDark}; border-bottom: 2px solid ${printTheme.borderTable}; padding-bottom: 5px; font-size: 15px; break-after: avoid; page-break-after: avoid;">
            ${d.day} <span style="font-size: 12px; color: ${printTheme.textSecondary}; font-weight: normal;">${d.dayDate ? formatDate(d.dayDate, config?.dateFormat) : ''}</span>
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13px;">
            <thead>
              <tr>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg}; width: 22%;">Meal</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Menu Item</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center; background: ${printTheme.priceBg}; width: 14%;">Total Plates</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center; background: ${printTheme.priceBg}; width: 14%;">Dine Out</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center; background: ${printTheme.priceBg}; width: 14%;">Parcel</th>
                ${!isVendor ? `<th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; background: ${printTheme.priceBg}; width: 18%;">Collection</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${mealsRows}
              <tr style="font-weight: bold; background: ${printTheme.priceBg}; font-size: 13px;">
                <td colspan="2" style="padding: 6px; border: 1px solid ${printTheme.borderTable};">Total (${d.day})</td>
                ${isVendor
                  ? `<td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${isVeg ? d.totals.veg : d.totals.nonVeg}</td>
                     <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${isVeg ? d.totals.vegDineOut : d.totals.nonVegDineOut}</td>
                     <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${isVeg ? d.totals.vegParcel : d.totals.nonVegParcel}</td>`
                  : `<td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${d.totals.plates}</td>
                     <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${d.totals.dineOut}</td>
                     <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${d.totals.parcel}</td>
                     <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; color: ${brand.orangeDark};">${formatCurrency(d.totals.amount)}</td>`
                }
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    let filterStr = '';
    if (startDate || endDate) {
      filterStr = `<div style="text-align:center; font-size:13px; color:${printTheme.textSecondary}; margin-bottom:15px;">Period: ${startDate ? formatDate(startDate) : 'Start'} to ${endDate ? formatDate(endDate) : 'Present'}</div>`;
    }

    const summaryCardsHtml = !isVendor ? `
      <div><strong>Total Collection:</strong> ${formatCurrency(analytics.totalAmount)}</div>
      <div><strong>Cash Collection:</strong> ${formatCurrency(analytics.cashAmount)}</div>
      <div><strong>Bank Collection:</strong> ${formatCurrency(analytics.bankAmount)}</div>
    ` : '';

    const totalVeg = analytics.days.reduce((sum, d) => sum + d.totals.veg, 0);
    const totalNonVeg = analytics.days.reduce((sum, d) => sum + d.totals.nonVeg, 0);
    const totalVegDineOut = analytics.days.reduce((sum, d) => sum + d.totals.vegDineOut, 0);
    const totalVegParcel = analytics.days.reduce((sum, d) => sum + d.totals.vegParcel, 0);
    const totalNonVegDineOut = analytics.days.reduce((sum, d) => sum + d.totals.nonVegDineOut, 0);
    const totalNonVegParcel = analytics.days.reduce((sum, d) => sum + d.totals.nonVegParcel, 0);

    const platesSummaryHtml = isVendor
      ? `<div><strong>Total ${isVeg ? 'Veg' : 'Non-Veg'} Plates:</strong> ${isVeg ? totalVeg : totalNonVeg} (Dine: ${isVeg ? totalVegDineOut : totalNonVegDineOut} | Parcel: ${isVeg ? totalVegParcel : totalNonVegParcel})</div>`
      : `<div><strong>Total Plates:</strong> ${analytics.totalPlates} (Veg: ${totalVeg} | Non-Veg: ${totalNonVeg})</div>
         <div><strong>Distribution:</strong> Dine-Out: ${analytics.totalDineOut} | Parcel: ${analytics.totalParcel}</div>`;

    const docTitle = `Food Collection & Plates Dashboard`;

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} — ${captionLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: ${printTheme.text}; margin: 0; }
            ${getPrintHeaderStyles()}
            .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0 2px 0; color: ${brand.orangeDark}; text-transform: uppercase; }
            .report-subtitle { text-align: center; font-size: 13px; font-weight: bold; color: ${brand.orangeDark}; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
            .summary { background: ${printTheme.summaryBg}; padding: 12px; border-radius: 8px; margin: 12px 0; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; font-size: 14px; break-inside: avoid; page-break-inside: avoid; }
            .summary > div { min-width: 150px; }
            .day-section { break-inside: avoid; page-break-inside: avoid; margin-top: 18px; }
            .day-section h3 { break-after: avoid; page-break-after: avoid; }
            table { page-break-inside: auto; }
            tr { break-inside: avoid; page-break-inside: avoid; }
            @media print {
              body { padding: 10px; }
              .day-section { break-inside: avoid; page-break-inside: avoid; }
              tr { break-inside: avoid; page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="report-title">${docTitle}</div>
          <div class="report-subtitle">(${captionLabel})</div>
          ${filterStr}
          <div class="summary">
            ${platesSummaryHtml}
            ${summaryCardsHtml}
          </div>
          ${daysHtml}
          ${getPrintFooterHTML(config)}
        </body>
      </html>
    `;
    printHTML(fullHTML);
  };

  if (historyLoading || !historyLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: brand.orange }} />
      </Box>
    );
  }

  const filterUI = (
    <Drawer anchor="right" open={showFilters} onClose={() => setShowFilters(false)}>
      <Box sx={{ width: { xs: '85vw', sm: 320 }, maxWidth: 320, p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Filters</Typography>
          <IconButton onClick={() => setShowFilters(false)} size="small" sx={{ bgcolor: 'action.hover' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <DatePicker
            label="Purchase Start Date"
            value={startDate ? new Date(startDate) : null}
            onChange={(newValue) => setStartDate(newValue ? getLocalISODate(newValue) : '')}
            format="dd/MM/yyyy"
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
          <DatePicker
            label="Purchase End Date"
            value={endDate ? new Date(endDate) : null}
            onChange={(newValue) => setEndDate(newValue ? getLocalISODate(newValue) : '')}
            format="dd/MM/yyyy"
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {(startDate || endDate) && (
              <Button variant="outlined" color="error" fullWidth onClick={() => { setStartDate(''); setEndDate(''); setShowFilters(false); }}>
                Clear
              </Button>
            )}
            <Button variant="contained" fullWidth onClick={() => setShowFilters(false)}>
              Apply
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Fade in={true}>
      <Box>
        {filterUI}

        {!analytics ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FastfoodIcon sx={{ fontSize: 56, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>No food coupon data found</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Try adjusting your date filters or check back later.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap', gap: 1 }}>
              {/* Active Filter Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                {(startDate || endDate) && (
                  <Chip
                    label={`${startDate ? formatDate(startDate, config?.dateFormat) : 'Start'} – ${endDate ? formatDate(endDate, config?.dateFormat) : 'Now'}`}
                    size="small"
                    onDelete={() => { setStartDate(''); setEndDate(''); }}
                    sx={{ fontSize: '0.72rem', fontWeight: 600, bgcolor: statusBadge.warning.bg, color: brand.orange }}
                  />
                )}
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  startIcon={<PrintIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                  endIcon={<ArrowDropDownIcon />}
                  onClick={handlePrintMenuOpen}
                  sx={{
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    py: { xs: 0.5, sm: 0.75 },
                    px: { xs: 1, sm: 1.5 },
                    height: { xs: 30, sm: 34 },
                    textTransform: 'none',
                  }}
                >
                  Print Dashboard
                </Button>
                <Menu
                  anchorEl={printAnchorEl}
                  open={Boolean(printAnchorEl)}
                  onClose={handlePrintMenuClose}
                >
                  <MenuItem onClick={() => handlePrint('ADMIN')}>For Admin</MenuItem>
                  <MenuItem onClick={() => handlePrint('VENDOR_VEG')}>For Veg Vendor</MenuItem>
                  <MenuItem onClick={() => handlePrint('VENDOR_NONVEG')}>For Non-Veg Vendor</MenuItem>
                </Menu>
              </Box>
            </Box>
            
            {/* Overall Summary Cards */}
            <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }} sx={{ mb: { xs: 2.5, sm: 4 } }}>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Total Coupons"
                  value={analytics.totalCoupons}
                  icon={<FastfoodIcon />}
                  color={brand.orange}
                  bg={statusBadge.warning.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Total Revenue"
                  value={formatCurrency(analytics.totalAmount)}
                  icon={<RupeeIcon />}
                  color={statusBadge.success.text}
                  bg={statusBadge.success.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Cash Collection"
                  value={formatCurrency(analytics.cashAmount)}
                  icon={<CashIcon />}
                  color={statusBadge.teal.text}
                  bg={statusBadge.teal.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Bank Collection"
                  value={formatCurrency(analytics.bankAmount)}
                  icon={<BankIcon />}
                  color={statusBadge.info.text}
                  bg={statusBadge.info.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Dine-Out"
                  value={analytics.totalDineOut}
                  icon={<DineOutIcon />}
                  color={statusBadge.warning.text}
                  bg={statusBadge.warning.bg}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                <SummaryCard
                  title="Parcel"
                  value={analytics.totalParcel}
                  icon={<ParcelIcon />}
                  color={statusBadge.purple.text}
                  bg={statusBadge.purple.bg}
                />
              </Grid>
            </Grid>

            {/* Per-Meal Aggregate Summary */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Meal-wise Summary
            </Typography>
            <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2.5, sm: 4 } }}>
              {analytics.mealSummary.map(m => (
                <Grid key={m.meal} size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ position: 'relative', overflow: 'hidden', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: m.meal === 'Breakfast' ? `linear-gradient(90deg, ${brand.goldDeep}, ${brand.goldDark})` : m.meal === 'Lunch' ? `linear-gradient(90deg, ${brand.orange}, ${brand.orangeDark})` : `linear-gradient(90deg, ${secondary.dark(true)}, ${brand.deepPurple})` } }}>
                    <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } } }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '0.85rem', sm: '0.925rem' } }}>
                        {m.meal === 'Breakfast' ? '🌅' : m.meal === 'Lunch' ? '☀️' : '🌙'} {m.meal}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Total Plates</Typography>
                          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.25rem' } }}>{m.plates}</Typography>
                        </Grid>
                        <Grid size={6}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>Revenue</Typography>
                          <Typography sx={{ fontWeight: 800, color: brand.gold, fontSize: { xs: '1rem', sm: '1.25rem' } }}>{formatCurrency(m.amount)}</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>Veg</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.success.text, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{m.veg}</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>Non-Veg</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.error.text, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{m.nonVeg}</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>Dine-Out</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.warning.text, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{m.dineOut}</Typography>
                        </Grid>
                        <Grid size={3}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem' }}>Parcel</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.purple.text, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{m.parcel}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Per-Day Breakdown */}
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Day-wise Breakdown
            </Typography>
            {analytics.days.map(dayData => (
              <Card key={dayData.day} sx={{ mb: { xs: 1.5, sm: 2 }, overflow: 'hidden', position: 'relative', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${brand.orange}, ${brand.orangeDark})` } }}>
                <CardContent sx={{ p: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.25, sm: 2 } }, pl: { xs: 1.75, sm: 3 } }}>
                  {/* Day Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        {dayData.day}
                      </Typography>
                      {dayData.dayDate && (
                        <Chip label={formatDate(dayData.dayDate, config?.dateFormat)} size="small" sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20, bgcolor: statusBadge.warning.bg, color: brand.orange }} />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.72rem', sm: '0.75rem' } }}>
                        <strong>{dayData.totals.plates}</strong> plates
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: brand.gold, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
                        {formatCurrency(dayData.totals.amount)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Meals Table */}
                  <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <Table size="small" sx={{ minWidth: { xs: 520, sm: '100%' }, bgcolor: 'background.default', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Meal</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Veg</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Non-Veg</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Dine-Out</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Parcel</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Total</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dayData.meals.map(m => {
                          const isVegFood = (f) => f && (f.toLowerCase() === 'veg' || f.toLowerCase() === 'khichuri' || f.toLowerCase() === 'lucchi');
                          const vegTypes = Object.entries(m.foodTypes || {}).filter(([f]) => isVegFood(f));
                          const nonVegTypes = Object.entries(m.foodTypes || {}).filter(([f]) => !isVegFood(f));
                          
                          return (
                            <TableRow key={m.meal}>
                              <TableCell sx={{ fontWeight: 600, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 }, whiteSpace: 'nowrap' }}>
                                {m.meal === 'Breakfast' ? '🌅' : m.meal === 'Lunch' ? '☀️' : '🌙'} {getMealDisplayName(dayData.day, m.meal)}
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.success.text, mb: vegTypes.length > 0 ? 0.5 : 0 }}>{m.veg}</Typography>
                                {vegTypes.map(([f, data]) => (
                                  <Typography key={f} variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                    {f}: {data.plates}
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.error.text, mb: nonVegTypes.length > 0 ? 0.5 : 0 }}>{m.nonVeg}</Typography>
                                {nonVegTypes.map(([f, data]) => (
                                  <Typography key={f} variant="caption" sx={{ display: 'block', color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1.2 }}>
                                    {f}: {data.plates}
                                  </Typography>
                                ))}
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: statusBadge.warning.text }}>{m.dineOut}</Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: statusBadge.purple.text }}>{m.parcel}</Typography>
                              </TableCell>
                              <TableCell align="center" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>
                                <Chip label={m.plates} size="small" sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ verticalAlign: 'top', pt: 1, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 }, whiteSpace: 'nowrap' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: brand.gold }}>{formatCurrency(m.amount)}</Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {/* Day Total Row */}
                        <TableRow sx={{ bgcolor: 'rgba(255,143,0,0.04)' }}>
                          <TableCell sx={{ fontWeight: 800, py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}>Total</TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}><Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.success.text }}>{dayData.totals.veg}</Typography></TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}><Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.error.text }}>{dayData.totals.nonVeg}</Typography></TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}><Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.warning.text }}>{dayData.totals.dineOut}</Typography></TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}><Typography variant="body2" sx={{ fontWeight: 700, color: statusBadge.purple.text }}>{dayData.totals.parcel}</Typography></TableCell>
                          <TableCell align="center" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 } }}><Chip label={dayData.totals.plates} size="small" color="warning" sx={{ fontWeight: 800 }} /></TableCell>
                          <TableCell align="right" sx={{ py: { xs: 0.75, sm: 1 }, px: { xs: 0.75, sm: 1.5 }, whiteSpace: 'nowrap' }}><Typography variant="body2" sx={{ fontWeight: 800, color: brand.gold }}>{formatCurrency(dayData.totals.amount)}</Typography></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Food type sub-breakdown per meal */}
                  {dayData.meals.map(m => (
                    Object.keys(m.foodTypes).length > 1 && (
                      <Box key={`${dayData.day}-${m.meal}-types`} sx={{ mt: 1, ml: { xs: 0.5, sm: 2 }, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mr: 0.5 }}>
                          {getMealDisplayName(dayData.day, m.meal)}:
                        </Typography>
                        {Object.entries(m.foodTypes).map(([food, data]) => (
                          <Chip
                            key={food}
                            label={`${food}: ${data.plates} plates (${formatCurrency(data.amount)})`}
                            size="small"
                            sx={{
                              fontSize: '0.65rem', fontWeight: 600, height: 22,
                              bgcolor: food === 'Veg' ? statusBadge.success.bg : food === 'Chicken' ? statusBadge.warning.bg : food === 'Mutton' ? statusBadge.purple.bg : statusBadge.error.bg,
                              color: food === 'Veg' ? statusBadge.success.text : food === 'Chicken' ? brand.orange : food === 'Mutton' ? secondary.dark(true) : statusBadge.error.text,
                            }}
                          />
                        ))}
                      </Box>
                    )
                  ))}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </Box>
    </Fade>
  );
};

export default FoodDashboardTab;
