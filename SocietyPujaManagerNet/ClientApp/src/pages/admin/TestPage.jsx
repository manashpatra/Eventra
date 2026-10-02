import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, CardContent, Grid, TextField, Button, MenuItem, Select, InputLabel, FormControl, Snackbar, Alert, Divider, Stack, Fade, useTheme, useMediaQuery,  } from '@mui/material';
import {
  Science as TestIcon,
  Devices as DevicesIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';
import UpiPaymentCard from '../../components/UpiPaymentCard';
import { useAuth } from '../../contexts/AuthContext';
import { buildUpiUrl, isMobileDevice, UPI_APPS, getIntentUrl } from '../../utils/upiHelper';
import { getMasterConfig } from '../../services/masterConfigService';
import { gradient, shadow, text } from '../../theme/colorTokens';

const TestPage = () => {
  const theme = useTheme();
  const isMobileSize = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, offlineMode } = useAuth();

  // Snackbar State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ----------------------------------------------------
  // TAB 1: UPI Tester State
  // ----------------------------------------------------
  const [upiParams, setUpiParams] = useState({
    pa: '7278676944@apl',
    pn: 'Vivek Kumar',
    tn: 'DPC 2026-27',
    mc: '', // Cleared so personal UPI testing doesn't fail
    amount: '1',
    flatNumber: '10-4-B',
    mode: 'subscription',
  });

  const [appConfig, setAppConfig] = useState(null);

  const [deviceDetails, setDeviceDetails] = useState({
    userAgent: '',
    isTouchDevice: false,
    screenWidth: 0,
    screenHeight: 0,
    isMobileSniffed: false,
  });

  // Fetch current Master Config to default UPI details if available
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await getMasterConfig();
        if (config) {
          setAppConfig(config);
          setUpiParams(prev => ({
            ...prev,
          }));
        } else {
          setUpiParams(prev => ({
            ...prev,
          }));
        }
      } catch (err) {
        console.error('Failed to load master config for UPI defaults:', err);
        setUpiParams(prev => ({
          ...prev,
        }));
      }
    };
    fetchConfig();

    // Populate device sniffing details
    if (typeof window !== 'undefined') {
      setDeviceDetails({
        userAgent: navigator.userAgent,
        isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        isMobileSniffed: isMobileDevice(),
      });
    }
  }, []);

  // Remove autoGuid effect

  const upiUrl = useMemo(() => {
    return buildUpiUrl({
      amount: upiParams.amount,
      flatNumber: upiParams.flatNumber,
      mode: upiParams.mode,
      pa: upiParams.pa,
      pn: upiParams.pn,
      tn: upiParams.tn || undefined,
      mc: upiParams.mc || undefined,
    });
  }, [upiParams]);

  const handleCopyUpiUrl = () => {
    navigator.clipboard.writeText(upiUrl).then(() => {
      showToast('UPI deep link URL copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Failed to copy UPI URL:', err);
      showToast('Failed to copy UPI URL', 'error');
    });
  };


  // ----------------------------------------------------
  // TAB 3: Seeder & Database Status
  // ----------------------------------------------------


  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: { xs: 1, sm: 2 } }}>
      {/* Header and Title */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            background: gradient.danger,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadow.danger,
          }}
        >
          <TestIcon sx={{ color: text.white, fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
            Super User Test Panel
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
            Inspect system configurations, simulate roles, and generate test data/UPI codes.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Fade in timeout={400}>
          <Grid container spacing={3}>
            {/* Form Input Card */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                    UPI Intent Configuration
                  </Typography>

                  <Stack spacing={3}>
                    <TextField
                      label="UPI ID (Payee VPA)"
                      value={upiParams.pa}
                      onChange={(e) => setUpiParams({ ...upiParams, pa: e.target.value })}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Payee Name"
                      value={upiParams.pn}
                      onChange={(e) => setUpiParams({ ...upiParams, pn: e.target.value })}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      label="Transaction Note (TN)"
                      value={upiParams.tn}
                      onChange={(e) => setUpiParams({ ...upiParams, tn: e.target.value })}
                      fullWidth
                      size="small"
                      placeholder="e.g. Puja Subscription"
                    />
                    <TextField
                      label="Merchant Code (MC)"
                      value={upiParams.mc}
                      onChange={(e) => setUpiParams({ ...upiParams, mc: e.target.value })}
                      fullWidth
                      size="small"
                      placeholder="e.g. 0000"
                    />
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Amount (INR)"
                          type="number"
                          value={upiParams.amount}
                          onChange={(e) => setUpiParams({ ...upiParams, amount: e.target.value })}
                          fullWidth
                          size="small"
                          placeholder="Optional"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          label="Flat Number"
                          value={upiParams.flatNumber}
                          onChange={(e) => setUpiParams({ ...upiParams, flatNumber: e.target.value })}
                          fullWidth
                          size="small"
                        />
                      </Grid>
                    </Grid>



                    <FormControl fullWidth size="small">
                      <InputLabel>Mode</InputLabel>
                      <Select
                        value={upiParams.mode}
                        label="Mode"
                        onChange={(e) => setUpiParams({ ...upiParams, mode: e.target.value })}
                      >
                        <MenuItem value="subscription">Subscription</MenuItem>
                        <MenuItem value="donation">Donation</MenuItem>
                        <MenuItem value="food">Food Coupons</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  {/* Sniffed Device Card */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                      <DevicesIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Detected Client Environment
                      </Typography>
                    </Stack>
                    <Grid container spacing={2} sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                      <Grid size={6}>
                        <strong>Touch Supported:</strong> {deviceDetails.isTouchDevice ? 'Yes' : 'No'}
                      </Grid>
                      <Grid size={6}>
                        <strong>Mobile Classified:</strong> {deviceDetails.isMobileSniffed ? 'Yes (Mobile UI)' : 'No (Desktop QR)'}
                      </Grid>
                      <Grid size={12}>
                        <strong>Viewport:</strong> {deviceDetails.screenWidth}px × {deviceDetails.screenHeight}px
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* QR Preview Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>
                  Live Generated Preview (UpiPaymentCard)
                </Typography>
                <UpiPaymentCard
                  flatNumber={upiParams.flatNumber}
                  amount={upiParams.amount}
                  mode={upiParams.mode}
                  pa={upiParams.pa}
                  pn={upiParams.pn}
                  tn={upiParams.tn || undefined}
                  mc={upiParams.mc || undefined}
                  societyName={appConfig?.societyName}
                  committeeName={appConfig?.committeeName}
                  year={appConfig?.year}
                  isTestPage={true}
                  bankAccountNumber={appConfig?.bankAccountNumber}
                  bankIfscCode={appConfig?.bankIfscCode}
                  enabledUpiApps={appConfig?.enabledUpiApps}
                />
                <Button
                  variant="contained"
                  fullWidth
                  href={upiUrl}
                  startIcon={<PaymentIcon />}
                  sx={{ mt: 2, borderRadius: '12px' }}
                >
                  Generic UPI
                </Button>


                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    px: 2,
                    color: 'text.secondary',
                    wordBreak: 'break-all',
                    fontSize: '0.72rem',
                    lineHeight: 1.4,
                    textAlign: 'center',
                  }}
                >

                  <strong>Generated Intent URLs:</strong>
                  {UPI_APPS.map(app => (
                    <Box key={app.id} sx={{ mt: 1, textAlign: 'left', p: 1, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box>
                        <strong>{app.name}:</strong> <br />
                        <span style={{ fontSize: '0.65rem' }}>{getIntentUrl(app, upiUrl, true)}</span>
                      </Box>
                      <Button
                        component="a"
                        href={getIntentUrl(app, upiUrl, true)}
                        variant="outlined"
                        size="small"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                      >
                        Test {app.name} Link
                      </Button>
                    </Box>
                  ))}
                </Typography>

              </Box>
            </Grid>
          </Grid>
        </Fade>

      </Box>

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            fontWeight: 600,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TestPage;
