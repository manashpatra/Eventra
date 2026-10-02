import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, TableFooter } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { status } from '../../../theme/colorTokens';

const ExpenseSubCategoryReportTab = ({ filteredExpenses, config, fmt, printReport, exportCSV }) => {
  // Aggregate expenses by Category and Sub-category
  const subCategorySummary = useMemo(() => {
    const getCategoryName = (idOrName) => {
      const cat = config?.expenseCategories?.find(c => c.id === idOrName || c.name === idOrName || c.category === idOrName);
      return cat ? (cat.name || cat.category) : idOrName;
    };
    
    const getSubCategoryName = (catIdOrName, subIdOrName) => {
      const cat = config?.expenseCategories?.find(c => c.id === catIdOrName || c.name === catIdOrName || c.category === catIdOrName);
      if (!cat) return subIdOrName;
      const sub = cat.subCategories?.find(s => s.id === subIdOrName || s.name === subIdOrName || s === subIdOrName);
      return sub ? (sub.name || sub) : subIdOrName;
    };

    const cats = {};
    filteredExpenses.forEach(e => {
      const catName = getCategoryName(e.category || 'General');
      const subName = getSubCategoryName(e.category || 'General', e.subCategory || 'Other');
      
      if (!cats[catName]) {
        cats[catName] = { category: catName, count: 0, amount: 0, subCategories: {} };
      }
      cats[catName].count++;
      cats[catName].amount += e.amount || 0;

      if (!cats[catName].subCategories[subName]) {
        cats[catName].subCategories[subName] = { subCategory: subName, count: 0, amount: 0 };
      }
      cats[catName].subCategories[subName].count++;
      cats[catName].subCategories[subName].amount += e.amount || 0;
    });

    return Object.values(cats).map(cat => ({
      ...cat,
      subCategories: Object.values(cat.subCategories).sort((a, b) => b.amount - a.amount)
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, config]);

  // Flatten for CSV export
  const csvData = useMemo(() => {
    const data = [];
    subCategorySummary.forEach(cat => {
      data.push({ category: cat.category, subCategory: 'TOTAL', count: cat.count, amount: cat.amount });
      cat.subCategories.forEach(sub => {
        data.push({ category: cat.category, subCategory: sub.subCategory, count: sub.count, amount: sub.amount });
      });
    });
    return data;
  }, [subCategorySummary]);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => printReport('Expense Sub-Category Report', 'sub-expense-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={() => exportCSV(csvData, 'expense_subcategory_summary.csv', ['category', 'subCategory', 'count', 'amount'])} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
        </Box>
        <div id="sub-expense-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Category</TableCell><TableCell>Sub-Category</TableCell><TableCell>Transactions</TableCell><TableCell>Amount</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {subCategorySummary.map(cat => (
                  <React.Fragment key={cat.category}>
                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}>
                      <TableCell colSpan={4}><Typography sx={{ fontWeight: 'bold', fontSize: '1.05rem', color: (theme) => status.info.main(theme.palette.mode === 'dark') }}><strong>{cat.category}</strong></Typography></TableCell>
                    </TableRow>
                    {cat.subCategories.map(sub => (
                      <TableRow key={`${cat.category}-${sub.subCategory}`}>
                        <TableCell></TableCell>
                        <TableCell><Chip label={sub.subCategory} size="small" variant="outlined" sx={{ ml: 2 }} /></TableCell>
                        <TableCell>{sub.count}</TableCell>
                        <TableCell><Typography sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark') }}>{fmt(sub.amount)}</Typography></TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)' }}>
                      <TableCell colSpan={2} align="right"><Typography sx={{ fontWeight: 'bold' }}><strong>Total</strong></Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 'bold' }}><strong>{cat.count}</strong></Typography></TableCell>
                      <TableCell><Typography sx={{ fontWeight: 'bold', color: (theme) => status.error.main(theme.palette.mode === 'dark') }}><strong>{fmt(cat.amount)}</strong></Typography></TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
                {subCategorySummary.length === 0 && (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No expenses found for the selected period.</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
              {subCategorySummary.length > 0 && (
                <TableFooter>
                  <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}>
                    <TableCell colSpan={2} align="right"><Typography sx={{ fontWeight: 'bold' }}><strong>Overall Total</strong></Typography></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 'bold' }}><strong>{subCategorySummary.reduce((sum, cat) => sum + (cat.count || 0), 0)}</strong></Typography></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 'bold', color: (theme) => status.error.main(theme.palette.mode === 'dark') }}><strong>{fmt(subCategorySummary.reduce((sum, cat) => sum + (cat.amount || 0), 0))}</strong></Typography></TableCell>
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

export default ExpenseSubCategoryReportTab;
