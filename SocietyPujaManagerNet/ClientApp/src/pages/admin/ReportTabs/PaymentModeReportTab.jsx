import React from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { status } from '../../../theme/colorTokens';

const PaymentModeReportTab = ({ paymentModeSummary, fmt, printReport, exportCSV }) => {
  const handleExportCSV = () => {
    const exportData = paymentModeSummary.map(r => ({
      'Payment Mode': r.mode || '',
      'Transactions': r.count || 0,
      'Total Amount': r.amount || 0
    }));
    exportCSV(exportData, 'payment_modes_report', ['Payment Mode', 'Transactions', 'Total Amount']);
  };
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => printReport('Payment Mode Analysis', 'payment-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={handleExportCSV} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
        </Box>
        <div id="payment-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Payment Mode</TableCell><TableCell>Transactions</TableCell><TableCell>Total Amount</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {paymentModeSummary.map(row => (
                  <TableRow key={row.mode}>
                    <TableCell><Chip label={row.mode} size="small" /></TableCell>
                    <TableCell>{row.count}</TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600, color: (theme) => status.success.main(theme.palette.mode === 'dark') }}>{fmt(row.amount)}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentModeReportTab;
