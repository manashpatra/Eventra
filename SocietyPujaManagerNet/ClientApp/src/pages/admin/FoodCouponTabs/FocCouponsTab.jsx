import React, { useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Tooltip, IconButton, TextField, InputAdornment, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon, AccountBalanceWallet as WalletIcon, Print as PrintIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../contexts/AuthContext';
import { createExpense } from '../../../services/expenseService';
import { printHTML } from '../../../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles, getPrintFooterHTML } from '../../../utils/print/shared';
import { formatDateTime } from '../../../utils/dateUtils';
import { matchesFlatOrName } from '../../../utils/flatHelper';
import { getMealDisplayName } from '../../../utils/textFormatters';
import { brand, printTheme } from '../../../theme/colorTokens';

const FocCouponsTab = ({ coupons, config, historyLoading, loadHistoryData, isAuditor }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'Super Admin';
  const [isSettling, setIsSettling] = useState(false);
  const [expenseConfirmOpen, setExpenseConfirmOpen] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const focCoupons = useMemo(() => {
    return coupons.filter(c => c.paymentMode === 'FOC');
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    let filtered = [...focCoupons];
    if (searchTerm) {
      filtered = filtered.filter((c) => matchesFlatOrName(c, searchTerm));
    }
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return filtered;
  }, [focCoupons, searchTerm]);

  const stats = useMemo(() => {
    const totalAmount = filteredCoupons.reduce((sum, c) => sum + (c.focValue || 0), 0);
    const totalPlates = filteredCoupons.reduce((sum, c) => sum + (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0), 0);
    
    const byTeam = {};
    filteredCoupons.forEach(c => {
      const team = c.flatNumber || 'Unknown';
      if (!byTeam[team]) {
        byTeam[team] = { plates: 0, amount: 0 };
      }
      byTeam[team].plates += (c.normalDineOutCount || 0) + (c.normalParcelCount || 0) + (c.additionalDineOutCount || 0) + (c.additionalParcelCount || 0);
      byTeam[team].amount += (c.focValue || 0);
    });

    return { totalCoupons: filteredCoupons.length, totalAmount, totalPlates, byTeam };
  }, [filteredCoupons]);

  const handleSettleExpense = async () => {
    if (stats.totalAmount <= 0) {
      enqueueSnackbar('No FOC amount to settle.', { variant: 'warning' });
      return;
    }
    
    try {
      setIsSettling(true);
      const hkCost = stats.byTeam['House Keeping']?.amount || 0;
      const secCost = stats.byTeam['Security']?.amount || 0;
      
      const remarksStr = [];
      if (hkCost > 0) remarksStr.push(`House Keeping(${hkCost})`);
      if (secCost > 0) remarksStr.push(`Security(${secCost})`);
      
      const fullRemarks = remarksStr.length > 0 
        ? `${remarksStr.join(' + ')} FOC Food Coupons`
        : `Facility FOC Food Coupons`;
        
      await createExpense({
        payeeName: 'DPC Account',
        category: 'Durga Puja Food',
        subCategory: 'Security & Housekeeping',
        amount: stats.totalAmount,
        paymentMode: 'Netbanking',
        remarks: fullRemarks,
        expenseDate: new Date().toISOString()
      });
      enqueueSnackbar('Expense successfully recorded!', { variant: 'success' });
      setExpenseConfirmOpen(false);
    } catch (error) {
      console.error('Failed to create expense:', error);
      enqueueSnackbar('Failed to record expense. Please try again.', { variant: 'error' });
    } finally {
      setIsSettling(false);
    }
  };

  const handlePrint = () => {
    const headerHtml = getPrintHeaderHTML(config || {});
    
    let subTotalsHtml = '';
    if (Object.keys(stats.byTeam).length > 0) {
      subTotalsHtml = `
        <div style="margin: 20px 0; padding: 15px; background: ${printTheme.priceBg}; border-radius: 8px;">
          <h3 style="margin-top: 0; color: ${brand.orangeDark}; font-size: 14px;">Sub-Totals by Facility Team</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left;">Facility Team</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">Plates</th>
                <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats.byTeam).map(([team, data]) => `
                <tr>
                  <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${team}</td>
                  <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: center;">${data.plates}</td>
                  <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right;">${formatCurrency(data.amount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const getPlatesStr = (c) => {
      let s = [];
      if(c.normalDineOutCount) s.push('Dine: '+c.normalDineOutCount);
      if(c.normalParcelCount) s.push('Parcel: '+c.normalParcelCount);
      return s.join(', ');
    };

    let itemsHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Facility Team</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Day & Meal</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Plates</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Food Type</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; background: ${printTheme.priceBg};">FOC Value</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Issued By</th>
            <th style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: left; background: ${printTheme.priceBg};">Issued Date</th>
          </tr>
        </thead>
        <tbody>
          ${filteredCoupons.map(c => `
            <tr>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; font-weight: bold;">${c.flatNumber}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${c.day} - ${getMealDisplayName(c.day, c.mealType)}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${getPlatesStr(c)}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${c.foodType}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable}; text-align: right; color: ${printTheme.headingRed};">${formatCurrency(c.focValue)}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${c.issuedBy || 'System'}</td>
              <td style="padding: 6px; border: 1px solid ${printTheme.borderTable};">${formatDateTime(c.createdAt, config?.dateFormat)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FOC Coupons Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: ${printTheme.text}; margin: 0; }
            ${getPrintHeaderStyles()}
            .report-title { text-align: center; font-size: 18px; font-weight: bold; margin: 15px 0; color: ${brand.orangeDark}; text-transform: uppercase; border-bottom: 2px solid ${brand.orangeDark}; padding-bottom: 8px; }
            .summary { background: ${printTheme.summaryBg}; padding: 12px; border-radius: 8px; margin: 12px 0; display: flex; justify-content: space-between; font-size: 14px; }
            @media print{ body{padding:10px} }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="report-title">Free of Cost (FOC) Issued Coupons</div>
          <div class="summary">
            <div><strong>Total Coupons:</strong> ${stats.totalCoupons}</div>
            <div><strong>Total Plates:</strong> ${stats.totalPlates}</div>
            <div><strong>Cost Borne by ${config?.societyName || 'DPC'}:</strong> ${formatCurrency(stats.totalAmount)}</div>
          </div>
          ${subTotalsHtml}
          <h3 style="margin-top: 20px; font-size: 14px;">Detailed Logs</h3>
          ${itemsHtml}
          ${getPrintFooterHTML(config)}
        </body>
      </html>
    `;
    printHTML(fullHTML);
  };

  const renderPlatesBreakdown = (item) => {
    const parts = [];
    if (item.normalDineOutCount) parts.push(`Dine: ${item.normalDineOutCount}`);
    if (item.normalParcelCount) parts.push(`Parcel: ${item.normalParcelCount}`);
    if (item.additionalDineOutCount) parts.push(`Dine(A): ${item.additionalDineOutCount}`);
    if (item.additionalParcelCount) parts.push(`Parcel(A): ${item.additionalParcelCount}`);
    return parts.join(', ');
  };

  if (historyLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <TextField
              placeholder="Search facility team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                }
              }}
            />
            <Tooltip title="Print FOC Report">
              <IconButton onClick={handlePrint} color="primary" sx={{ p: 0.5 }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton onClick={loadHistoryData} color="primary" sx={{ p: 0.5 }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            {isSuperAdmin && (
              <Tooltip title="Record Expense">
                <span>
                  <IconButton
                    onClick={() => setExpenseConfirmOpen(true)}
                    color="secondary"
                    disabled={isSettling || stats.totalAmount <= 0}
                    sx={{ p: 0.5, ml: 0.5 }}
                  >
                    {isSettling ? <CircularProgress size={20} color="inherit" /> : <WalletIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>

          <Grid container spacing={1} sx={{ mb: 2 }}>
            <Grid size={{ xs: 4 }}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Total Coupons</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.totalCoupons}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Total Plates</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.totalPlates}</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Paper sx={{ p: 1, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>Cost</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatCurrency(stats.totalAmount)}</Typography>
              </Paper>
            </Grid>
          </Grid>

          {Object.keys(stats.byTeam).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                Sub-Totals by Facility Team
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(stats.byTeam).map(([team, data]) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={team}>
                    <Paper sx={{ p: 1, borderLeft: '4px solid', borderColor: 'primary.main', bgcolor: 'rgba(0,0,0,0.02)' }} variant="outlined">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{team}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Plates: <strong>{data.plates}</strong></Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Amt: <strong>{formatCurrency(data.amount)}</strong></Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Facility Team</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Day & Meal</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Plates</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Food Type</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>FOC Value</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Issued By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>Issued Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="text.secondary">No FOC coupons found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map((coupon) => (
                    <React.Fragment key={coupon.id}>
                      <TableRow hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{coupon.flatNumber}</Typography>
                        </TableCell>
                        <TableCell>
                          {coupon.day} - {getMealDisplayName(coupon.day, coupon.mealType)}
                        </TableCell>
                        <TableCell>{renderPlatesBreakdown(coupon)}</TableCell>
                        <TableCell>{coupon.foodType}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'error.main' }}>
                          {formatCurrency(coupon.focValue)}
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="body2" color="text.secondary">{coupon.issuedBy || 'System'}</Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatDateTime(coupon.createdAt, config?.dateFormat)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ display: { xs: 'table-row', sm: 'none' } }}>
                        <TableCell colSpan={5} sx={{ borderBottom: '1px solid rgba(224, 224, 224, 1)', pt: 0.5, pb: 1, bgcolor: 'rgba(0,0,0,0.01)' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                            <strong>Issued By:</strong> {coupon.issuedBy || 'System'} &nbsp;|&nbsp; <strong>Date:</strong> {formatDateTime(coupon.createdAt, config?.dateFormat)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Record Expense */}
      <Dialog open={expenseConfirmOpen} onClose={() => !isSettling && setExpenseConfirmOpen(false)}>
        <DialogTitle>Confirm Expense Recording</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to record an expense for <strong>{formatCurrency(stats.totalAmount)}</strong> for the FOC coupons?
            This will create a new entry in the Expenses section under "Durga Puja Food" &rarr; "Security & Housekeeping".
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpenseConfirmOpen(false)} color="inherit" disabled={isSettling}>
            Cancel
          </Button>
          <Button onClick={handleSettleExpense} color="secondary" variant="contained" disabled={isSettling} startIcon={isSettling && <CircularProgress size={16} />}>
            Confirm & Record
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FocCouponsTab;
