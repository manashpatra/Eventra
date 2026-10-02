import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Chip, FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material';
import { formatDate } from '../../../utils/dateUtils';
import { matchesFlatOrName } from '../../../utils/flatHelper';
import { brand, overlay, status, border } from '../../../theme/colorTokens';

const PaidSubscriptionsReportTab = ({ filteredPaidResidents, filterBlock, setFilterBlock, config, fmt, printReport, exportCSV }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const displayResidents = useMemo(() => {
    if (!searchTerm) return filteredPaidResidents;
    return filteredPaidResidents.filter(r => matchesFlatOrName(r, searchTerm));
  }, [filteredPaidResidents, searchTerm]);

  const totalAmount = useMemo(() => {
    return displayResidents.reduce((acc, r) => acc + (r.subscriptionAmount || 0), 0);
  }, [displayResidents]);

  const handleExportCSV = () => {
    const exportData = [
      ...displayResidents.map(r => ({
        flatNumber: r.flatNumber || '',
        name: r.name || '',
        block: r.block || '',
        subscriptionAmount: r.subscriptionAmount || 0,
        paymentDate: formatDate(r.transactionDate || r.paymentDate, config?.dateFormat),
        paymentMode: r.paymentMode || '',
      })),
      {
        flatNumber: 'TOTAL',
        name: `Total (${displayResidents.length} Residents)`,
        block: '',
        subscriptionAmount: totalAmount,
        paymentDate: '',
        paymentMode: '',
      }
    ];

    exportCSV(
      exportData,
      'paid_subscriptions.csv',
      ['flatNumber', 'name', 'block', 'subscriptionAmount', 'paymentDate', 'paymentMode']
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search Flat or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ width: { xs: 140, sm: 180 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: 80, sm: 120 } }}>
              <InputLabel>Block</InputLabel>
              <Select value={filterBlock} onChange={(e) => setFilterBlock(e.target.value)} label="Block">
                <MenuItem value="all">All</MenuItem>
                {(config?.blocks || []).map(b => <MenuItem key={b} value={String(b)}>Block {b}</MenuItem>)}
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" onClick={() => printReport('Subscription Report', 'paid-report')} sx={{ minWidth: 0, px: { xs: 0.75, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={handleExportCSV} sx={{ minWidth: 0, px: { xs: 0.75, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
          </Box>
        </Box>
        <div id="paid-report">
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell>Flat</TableCell><TableCell>Resident Name</TableCell>
                <TableCell>Date</TableCell><TableCell>Mode</TableCell><TableCell>Amount</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {displayResidents.map((r, index) => {
                  const currentBlock = r.block || 'Other';
                  const previousBlock = index > 0 ? (displayResidents[index - 1].block || 'Other') : null;
                  const showBlockHeader = currentBlock !== previousBlock;

                  return (
                    <React.Fragment key={r.id}>
                      {showBlockHeader && (
                        <TableRow>
                          <TableCell 
                            colSpan={5} 
                            style={{ 
                              textAlign: 'center', 
                              backgroundColor: overlay.brandGlowLight, 
                              color: brand.orangeDeep, 
                              fontWeight: 'bold', 
                              padding: '10px',
                              WebkitPrintColorAdjust: 'exact', 
                              printColorAdjust: 'exact' 
                            }}
                          >
                            BLOCK {currentBlock}
                          </TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell><Chip label={r.flatNumber} size="small" /></TableCell>
                        <TableCell><Typography sx={{ fontWeight: 500 }}>{r.name}</Typography></TableCell>
                        <TableCell>{formatDate(r.transactionDate || r.paymentDate, config?.dateFormat)}</TableCell>
                        <TableCell>{r.paymentMode}</TableCell>
                        <TableCell><Typography sx={{ fontWeight: 600, color: (theme) => status.success.main(theme.palette.mode === 'dark') }}>{fmt(r.subscriptionAmount)}</Typography></TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
                {displayResidents.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No paid subscriptions found</Typography>
                  </TableCell></TableRow>
                )}
                {displayResidents.length > 0 && (
                  <TableRow sx={{ '& td': { fontWeight: 800, borderTop: (theme) => `2px solid ${border.divider(theme.palette.mode === 'dark')}` } }}>
                    <TableCell colSpan={4} style={{ fontWeight: 'bold' }}>
                      Total ({displayResidents.length} Paid Subscriptions)
                    </TableCell>
                    <TableCell style={{ fontWeight: 'bold' }}>
                      <Typography sx={{ fontWeight: 800, color: (theme) => status.success.main(theme.palette.mode === 'dark') }} style={{ fontWeight: 'bold' }}>
                        {fmt(totalAmount)}
                      </Typography>
                    </TableCell>
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

export default PaidSubscriptionsReportTab;
