import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableFooter } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { status } from '../../../theme/colorTokens';

const IncomeSubCategoryReportTab = ({ incomeSubCategorySummary, fmt, printReport, exportCSV }) => {
  // Flatten for CSV export
  const csvData = useMemo(() => {
    const data = [];
    incomeSubCategorySummary.forEach(cat => {
      data.push({ category: cat.category, subCategory: 'TOTAL', count: cat.count, amount: cat.amount });
      cat.subCategories.forEach(sub => {
        data.push({ category: cat.category, subCategory: sub.subCategory, count: sub.count, amount: sub.amount });
      });
    });
    return data;
  }, [incomeSubCategorySummary]);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => printReport('Income Sub-Category Report', 'sub-income-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={() => exportCSV(csvData, 'income_subcategory_summary.csv', ['category', 'subCategory', 'count', 'amount'])} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
        </Box>
        <div id="sub-income-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Category</TableCell><TableCell>Sub-Category</TableCell><TableCell>Transactions</TableCell><TableCell>Amount</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {incomeSubCategorySummary.map(cat => (
                  <React.Fragment key={cat.category}>
                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}>
                      <TableCell colSpan={4}><Typography sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: (theme) => status.success.main(theme.palette.mode === 'dark') }}><strong>{cat.category}</strong></Typography></TableCell>
                    </TableRow>
                    {cat.subCategories.map(sub => (
                      <TableRow key={`${cat.category}-${sub.subCategory}`}>
                        <TableCell></TableCell>
                        <TableCell><Chip label={sub.subCategory} size="small" variant="outlined" sx={{ ml: 2 }} /></TableCell>
                        <TableCell>{sub.count}</TableCell>
                        <TableCell><Typography sx={{ color: (theme) => status.success.main(theme.palette.mode === 'dark') }}>{fmt(sub.amount)}</Typography></TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
                      <TableCell colSpan={2} align="right"><Typography sx={{ fontWeight: 'bold' }}><strong>Total</strong></Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 'bold' }}><strong>{cat.count}</strong></Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 'bold', color: (theme) => status.success.main(theme.palette.mode === 'dark') }}><strong>{fmt(cat.amount)}</strong></Typography></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {incomeSubCategorySummary.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No income found for the selected period.</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
              {incomeSubCategorySummary.length > 0 && (
                <TableFooter>
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}>
                    <TableCell colSpan={2} align="right"><Typography sx={{ fontWeight: 'bold' }}><strong>Overall Total</strong></Typography></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 'bold' }}><strong>{incomeSubCategorySummary.reduce((sum, cat) => sum + (cat.count || 0), 0)}</strong></Typography></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 'bold', color: (theme) => status.success.main(theme.palette.mode === 'dark') }}><strong>{fmt(incomeSubCategorySummary.reduce((sum, cat) => sum + (cat.amount || 0), 0))}</strong></Typography></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default IncomeSubCategoryReportTab;
