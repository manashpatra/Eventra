import React, { useState, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, MenuItem, FormControl, InputLabel, Select, Grid, Chip } from '@mui/material';
import { Print as PrintIcon, Download as DownloadIcon } from '@mui/icons-material';
import { formatDate } from '../../../utils/dateUtils';
import { sponsorshipPalette, border } from '../../../theme/colorTokens';

const SponsorshipReportTab = ({ filteredSponsorships, config, fmt, printReport, exportCSV }) => {
  const [typeFilter, setTypeFilter] = useState('All');

  const displaySponsorships = useMemo(() => {
    if (typeFilter === 'All') return filteredSponsorships;
    return filteredSponsorships.filter(s => (s.sponsorType || 'External') === typeFilter);
  }, [filteredSponsorships, typeFilter]);

  const summary = useMemo(() => {
    let totalGross = 0;
    let externalTotal = 0;
    let externalCount = 0;
    let internalTotal = 0;
    let internalCount = 0;
    let totalCam = 0;
    let totalCount = 0;

    displaySponsorships.forEach(s => {
      if (s.status !== 'Received') return;
      const gross = s.amount || 0;
      const isExt = (s.sponsorType || 'External') === 'External';
      totalGross += gross;
      totalCount++;
      if (isExt) {
        externalTotal += gross;
        externalCount++;
        totalCam += Math.round(gross * 0.10);
      } else {
        internalTotal += gross;
        internalCount++;
      }
    });

    const totalNet = totalGross - totalCam;

    return {
      totalGross,
      totalCount,
      externalTotal,
      externalCount,
      internalTotal,
      internalCount,
      totalCam,
      totalNet,
    };
  }, [displaySponsorships]);

  const handleExportCSV = () => {
    const dataToExport = displaySponsorships.map(s => {
      const isExt = (s.sponsorType || 'External') === 'External';
      const isReceived = s.status === 'Received';
      const gross = isReceived ? (s.amount || 0) : 0;
      const cam = isExt && isReceived ? Math.round((s.amount || 0) * 0.10) : 0;
      const net = gross - cam;
      return {
        sponsorName: s.sponsorName || '',
        sponsorType: s.sponsorType || 'External',
        status: s.status || 'Received',
        organization: s.organization || s.contactPerson || '-',
        contactNumber: s.contactNumber || s.mobile || '-',
        transactionDate: formatDate(s.transactionDate || s.createdAt, config?.dateFormat),
        paymentMode: s.paymentMode || '-',
        invoiceDescription: s.invoiceDescription || '',
        grossAmount: s.amount || 0,
        camProvision10Pct: cam,
        netAmount: net,
        remarks: s.remarks || '-',
      };
    });

    if (displaySponsorships.length > 0) {
      dataToExport.push({
        sponsorName: 'TOTAL',
        sponsorType: `Total (${summary.totalCount} Sponsors)`,
        status: '',
        organization: '',
        contactNumber: '',
        transactionDate: '',
        paymentMode: '',
        invoiceDescription: '',
        grossAmount: summary.totalGross,
        camProvision10Pct: summary.totalCam,
        netAmount: summary.totalNet,
        remarks: '',
      });
    }

    exportCSV(
      dataToExport,
      'sponsorship_report.csv',
      ['sponsorName', 'sponsorType', 'status', 'organization', 'contactNumber', 'transactionDate', 'paymentMode', 'grossAmount', 'camProvision10Pct', 'netAmount', 'remarks']
    );
  };

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Filter Sponsor Type</InputLabel>
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} label="Filter Sponsor Type">
                <MenuItem value="All">All Sponsors ({filteredSponsorships.length})</MenuItem>
                <MenuItem value="External">External</MenuItem>
                <MenuItem value="Internal">Internal</MenuItem>
              </Select>
            </FormControl>
            <Button size="small" variant="outlined" onClick={() => printReport('Sponsorship Report', 'sponsorship-report')} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <PrintIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Print</Box>
            </Button>
            <Button size="small" variant="outlined" onClick={handleExportCSV} sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, ml: 0.5 }}>Export</Box>
            </Button>
          </Box>
        </Box>

        {/* Summary Grid Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid rgba(77,208,225,0.2)', backgroundColor: 'rgba(77,208,225,0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Total Gross Amount</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: sponsorshipPalette.gross }}>{fmt(summary.totalGross)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>({summary.totalCount} sponsors)</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid rgba(66,165,245,0.2)', backgroundColor: 'rgba(66,165,245,0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>External Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: sponsorshipPalette.external }}>{fmt(summary.externalTotal)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>({summary.externalCount} external)</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid rgba(255,167,38,0.2)', backgroundColor: 'rgba(255,167,38,0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>CAM Provision (10% Ext)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: sponsorshipPalette.cam }}>{fmt(summary.totalCam)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Dedicated for CAM</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid rgba(171,71,188,0.2)', backgroundColor: 'rgba(171,71,188,0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Internal Total</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: sponsorshipPalette.internal }}>{fmt(summary.internalTotal)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>({summary.internalCount} internal)</Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, sm: 2.4 }}>
            <Box sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid rgba(102,187,106,0.2)', backgroundColor: 'rgba(102,187,106,0.05)', textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Net Sponsorship Fund</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: sponsorshipPalette.net }}>{fmt(summary.totalNet)}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>(Gross - CAM)</Typography>
            </Box>
          </Grid>
        </Grid>

        <div id="sponsorship-report">
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, backgroundColor: 'rgba(255,255,255,0.03)' } }}>
                  <TableCell>Sponsor Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Invoice Desc.</TableCell>
                  <TableCell align="right">Gross Amount</TableCell>
                  <TableCell align="right">CAM (10%)</TableCell>
                  <TableCell align="right">Net Amount</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displaySponsorships.map(r => {
                  const isExt = (r.sponsorType || 'External') === 'External';
                  const isCancelled = r.status === 'Cancelled';
                  const isReceived = r.status === 'Received';
                  const originalGross = r.amount || 0;
                  const cam = isExt && isReceived ? Math.round(originalGross * 0.10) : 0;
                  const net = isReceived ? originalGross - cam : 0;
                  return (
                    <TableRow key={r.id} sx={{ opacity: isCancelled ? 0.6 : 1 }}>
                      <TableCell>
                        <Typography sx={{ fontWeight: 500 }}>{r.sponsorName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                          {r.organization || r.contactPerson || r.contactNumber || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.sponsorType || 'External'}
                          size="small"
                          color={isExt ? 'primary' : 'secondary'}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.7rem', height: 22 }}
                        />
                      </TableCell>
                      <TableCell>
                        {isCancelled ? (
                          <Chip label="Cancelled" size="small" color="error" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        ) : (
                          <Chip label="Received" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(r.transactionDate || r.createdAt, config?.dateFormat)}</TableCell>
                      <TableCell>{r.paymentMode || '-'}</TableCell>
                      <TableCell><Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.invoiceDescription || '-'}</Typography></TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: isCancelled ? 'text.secondary' : sponsorshipPalette.gross, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          {fmt(originalGross)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: (isExt && isReceived) ? 600 : 400, color: (isExt && isReceived) ? sponsorshipPalette.cam : 'text.secondary' }}>
                          {(isExt && isReceived) ? fmt(cam) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 600, color: isCancelled ? 'text.secondary' : sponsorshipPalette.net, textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          {fmt(net)}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.remarks || '-'}</TableCell>
                    </TableRow>
                  );
                })}
                {displaySponsorships.length === 0 && (
                  <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No sponsors found</Typography>
                  </TableCell></TableRow>
                )}
                {displaySponsorships.length > 0 && (
                  <TableRow sx={{ '& td': { fontWeight: 800, borderTop: (theme) => `2px solid ${border.divider(theme.palette.mode === 'dark')}` } }}>
                    <TableCell colSpan={6}>Total ({summary.totalCount} Active Sponsors)</TableCell>
                    <TableCell align="right" sx={{ color: sponsorshipPalette.gross }}>{fmt(summary.totalGross)}</TableCell>
                    <TableCell align="right" sx={{ color: sponsorshipPalette.cam }}>{fmt(summary.totalCam)}</TableCell>
                    <TableCell align="right" sx={{ color: sponsorshipPalette.net }}>{fmt(summary.totalNet)}</TableCell>
                    <TableCell></TableCell>
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

export default SponsorshipReportTab;
