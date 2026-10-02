import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { brand, mealType, border } from '../../../theme/colorTokens';

const FoodCouponReportTab = ({ dayCouponSummary, fmt, printReport, exportCSV }) => {
  const [filterFoodType, setFilterFoodType] = useState('all');

  const displayRows = useMemo(() => {
    if (filterFoodType === 'all') return dayCouponSummary;
    return dayCouponSummary.filter(r => {
      if (filterFoodType === 'Veg') return (r.veg || 0) > 0;
      if (filterFoodType === 'Khichuri') return (r.khichuri || 0) > 0;
      if (filterFoodType === 'Lucchi') return (r.lucchi || 0) > 0;
      if (filterFoodType === 'Chicken') return (r.chicken || 0) > 0;
      if (filterFoodType === 'Mutton') return (r.mutton || 0) > 0;
      if (filterFoodType === 'Non-Veg') return (r.nonVegOther || 0) > 0;
      return true;
    });
  }, [dayCouponSummary, filterFoodType]);

  const totals = useMemo(() => {
    let veg = 0, khichuri = 0, lucchi = 0, chicken = 0, mutton = 0, nonVeg = 0, dineOut = 0, parcel = 0, amount = 0;
    displayRows.forEach(r => {
      veg += r.veg || 0;
      khichuri += r.khichuri || 0;
      lucchi += r.lucchi || 0;
      chicken += r.chicken || 0;
      mutton += r.mutton || 0;
      nonVeg += r.nonVegOther || 0;
      dineOut += r.dineOut || 0;
      parcel += r.parcel || 0;
      amount += r.amount || 0;
    });
    return { veg, khichuri, lucchi, chicken, mutton, nonVeg, dineOut, parcel, amount };
  }, [displayRows]);

  const handleExportCSV = () => {
    const exportData = [
      ...displayRows.map(r => ({
        day: r.day || '',
        meal: r.meal || '',
        veg: r.veg || 0,
        khichuri: r.khichuri || 0,
        lucchi: r.lucchi || 0,
        chicken: r.chicken || 0,
        mutton: r.mutton || 0,
        nonVegGeneric: r.nonVegOther || 0,
        dineOut: r.dineOut || 0,
        parcel: r.parcel || 0,
        amount: r.amount || 0,
      })),
      {
        day: 'TOTAL',
        meal: 'Total',
        veg: totals.veg,
        khichuri: totals.khichuri,
        lucchi: totals.lucchi,
        chicken: totals.chicken,
        mutton: totals.mutton,
        nonVegGeneric: totals.nonVeg,
        dineOut: totals.dineOut,
        parcel: totals.parcel,
        amount: totals.amount,
      }
    ];

    if (exportCSV) {
      exportCSV(
        exportData,
        `food_coupon_summary_${filterFoodType.toLowerCase()}.csv`,
        ['day', 'meal', 'veg', 'khichuri', 'lucchi', 'chicken', 'mutton', 'nonVegGeneric', 'dineOut', 'parcel', 'amount']
      );
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter Food Type</InputLabel>
              <Select value={filterFoodType} onChange={(e) => setFilterFoodType(e.target.value)} label="Filter Food Type">
                <MenuItem value="all">All Food Types</MenuItem>
                <MenuItem value="Veg">Veg</MenuItem>
                <MenuItem value="Khichuri">Khichuri</MenuItem>
                <MenuItem value="Lucchi">Lucchi</MenuItem>
                <MenuItem value="Chicken">Chicken</MenuItem>
                <MenuItem value="Mutton">Mutton</MenuItem>
                <MenuItem value="Non-Veg">Non-Veg</MenuItem>
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" onClick={() => printReport(`Food Coupon Report (${filterFoodType})`, 'food-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            {exportCSV && (
              <Button size="small" variant="outlined" onClick={handleExportCSV} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
                <DownloadIcon sx={{ fontSize: 18 }} />
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
              </Button>
            )}
          </Box>
        </Box>
        <div id="food-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Meal</TableCell>
                <TableCell>Veg</TableCell>
                <TableCell>Khichuri</TableCell>
                <TableCell>Lucchi</TableCell>
                <TableCell>Chicken</TableCell>
                <TableCell>Mutton</TableCell>
                <TableCell>Non-Veg</TableCell>
                <TableCell>Dine-out</TableCell>
                <TableCell>Parcel</TableCell>
                <TableCell>Revenue</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {displayRows.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell><Chip label={row.day} size="small" /></TableCell>
                    <TableCell>{row.meal}</TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType.Veg.color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Veg' ? 800 : 600 }}>{row.veg}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType.Khichuri.color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Khichuri' ? 800 : 600 }}>{row.khichuri}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType.Lucchi.color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Lucchi' ? 800 : 600 }}>{row.lucchi}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType.Chicken.color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Chicken' ? 800 : 600 }}>{row.chicken}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType.Mutton.color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Mutton' ? 800 : 600 }}>{row.mutton}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: (theme) => mealType['Non-Veg'].color(theme.palette.mode === 'dark'), fontWeight: filterFoodType === 'Non-Veg' ? 800 : 600 }}>{row.nonVegOther || 0}</Typography></TableCell>
                    <TableCell>{row.dineOut}</TableCell>
                    <TableCell>{row.parcel}</TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600, color: brand.gold }}>{fmt(row.amount)}</Typography></TableCell>
                  </TableRow>
                ))}
                {displayRows.length === 0 && (
                  <TableRow><TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No food coupons found for selected food type filter.</Typography>
                  </TableCell></TableRow>
                )}
                {displayRows.length > 0 && (
                  <TableRow sx={{ '& td': { fontWeight: 800, borderTop: (theme) => `2px solid ${border.divider(theme.palette.mode === 'dark')}` } }}>
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell sx={{ color: (theme) => mealType.Veg.color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.veg}</TableCell>
                    <TableCell sx={{ color: (theme) => mealType.Khichuri.color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.khichuri}</TableCell>
                    <TableCell sx={{ color: (theme) => mealType.Lucchi.color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.lucchi}</TableCell>
                    <TableCell sx={{ color: (theme) => mealType.Chicken.color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.chicken}</TableCell>
                    <TableCell sx={{ color: (theme) => mealType.Mutton.color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.mutton}</TableCell>
                    <TableCell sx={{ color: (theme) => mealType['Non-Veg'].color(theme.palette.mode === 'dark'), fontWeight: 800 }}>{totals.nonVeg}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{totals.dineOut}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{totals.parcel}</TableCell>
                    <TableCell sx={{ color: brand.gold, fontWeight: 800 }}>{fmt(totals.amount)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCouponReportTab;
