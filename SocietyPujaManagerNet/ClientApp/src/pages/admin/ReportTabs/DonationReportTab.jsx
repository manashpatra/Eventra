import React, { useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { formatDate } from '../../../utils/dateUtils';
import { status, border } from '../../../theme/colorTokens';

const DonationReportTab = ({ filteredDonations, config, fmt, printReport, exportCSV }) => {
  const sortedDonations = useMemo(() => {
    return [...filteredDonations].sort((a, b) => {
      const dateA = new Date(a.transactionDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.transactionDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredDonations]);

  const totalAmount = useMemo(() => {
    return sortedDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
  }, [sortedDonations]);

  const handleExportCSV = () => {
    const exportData = [
      ...sortedDonations.map(d => ({
        donorName: d.donorName || d.residentName || '',
        flatNumber: d.flatNumber || '',
        amount: d.amount || 0,
        transactionDate: formatDate(d.transactionDate || d.createdAt, config?.dateFormat),
        paymentMode: d.paymentMode || '',
        remarks: d.remarks || '',
      })),
      {
        donorName: `TOTAL (${sortedDonations.length} Donations)`,
        flatNumber: '',
        amount: totalAmount,
        transactionDate: '',
        paymentMode: '',
        remarks: '',
      }
    ];

    exportCSV(
      exportData,
      'donation_report.csv',
      ['donorName', 'flatNumber', 'amount', 'transactionDate', 'paymentMode', 'remarks']
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
            <Button size="small" variant="outlined" onClick={() => printReport('Donation Report', 'donation-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={handleExportCSV} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
        </Box>
        <div id="donation-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Donor Name</TableCell><TableCell style={{ whiteSpace: 'nowrap' }}>Flat</TableCell>
                <TableCell style={{ whiteSpace: 'nowrap' }}>Date</TableCell><TableCell>Mode</TableCell><TableCell>Remarks</TableCell><TableCell style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>Amount</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {sortedDonations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell><Typography sx={{ fontWeight: 500 }}>{r.donorName || r.residentName}</Typography></TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{r.flatNumber ? <Chip label={r.flatNumber} size="small" /> : '-'}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap' }}>{formatDate(r.transactionDate || r.createdAt, config?.dateFormat)}</TableCell>
                    <TableCell>{r.paymentMode}</TableCell>
                    <TableCell>{r.remarks || '-'}</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', textAlign: 'right' }}><Typography sx={{ fontWeight: 600, color: (theme) => status.success.main(theme.palette.mode === 'dark') }}>{fmt(r.amount)}</Typography></TableCell>
                  </TableRow>
                ))}
                {sortedDonations.length === 0 && (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No donations found</Typography>
                  </TableCell></TableRow>
                )}
                {sortedDonations.length > 0 && (
                  <TableRow sx={{ '& td': { fontWeight: 800, borderTop: (theme) => `2px solid ${border.divider(theme.palette.mode === 'dark')}` } }}>
                    <TableCell colSpan={5} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total ({sortedDonations.length} Donations)</TableCell>
                    <TableCell style={{ whiteSpace: 'nowrap', textAlign: 'right', fontWeight: 'bold' }}><Typography sx={{ fontWeight: 800, color: (theme) => status.success.main(theme.palette.mode === 'dark') }}>{fmt(totalAmount)}</Typography></TableCell>
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

export default DonationReportTab;
