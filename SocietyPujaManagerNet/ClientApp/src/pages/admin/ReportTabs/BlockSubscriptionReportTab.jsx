import React from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { statusBadge } from '../../../theme/colorTokens';

const BlockSubscriptionReportTab = ({ blockSummary, fmt, printReport, exportCSV }) => {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => printReport('Block-wise Subscription Report', 'block-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={() => exportCSV(blockSummary, 'block_report.csv', ['block', 'total', 'paid', 'pending', 'amount'])} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
        </Box>
        <div id="block-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Block</TableCell><TableCell>Total Flats</TableCell><TableCell>Paid</TableCell>
                <TableCell>Pending</TableCell><TableCell>Amount Collected</TableCell><TableCell>%</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {blockSummary.map(b => (
                  <TableRow key={b.block}>
                    <TableCell><Chip label={`Block ${b.block}`} size="small" /></TableCell>
                    <TableCell>{b.total}</TableCell>
                    <TableCell><Typography sx={{ color: statusBadge.success.text, fontWeight: 600 }}>{b.paid}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: statusBadge.warning.text, fontWeight: 600 }}>{b.pending}</Typography></TableCell>
                    <TableCell><Typography sx={{ fontWeight: 600 }}>{fmt(b.amount)}</Typography></TableCell>
                    <TableCell><Chip label={`${b.total > 0 ? ((b.paid / b.total) * 100).toFixed(1) : '0.0'}%`} size="small"
                      sx={{ backgroundColor: statusBadge.success.bg, color: statusBadge.success.text }} /></TableCell>
                  </TableRow>
                ))}
                {blockSummary.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No data available</Typography>
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default BlockSubscriptionReportTab;
