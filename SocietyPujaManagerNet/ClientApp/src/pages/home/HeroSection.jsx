import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Grid, Fade, Button, Chip, Divider, Dialog, DialogTitle, DialogContent, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, CircularProgress, useTheme } from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Celebration as CelebrationIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  Close as CloseIcon,
  VolunteerActivism as DonationIcon,
  EmojiEvents as TrophyIcon,
  Fastfood as FoodIcon,
  Download as DownloadIcon,
  Feedback as FeedbackIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { getFlatDetails } from '../../services/publicDataService';
import { getSelectedFlat } from '../../components/FlatSelectionDialog';
import { getMasterConfig } from '../../services/masterConfigService';
import { formatShortDate, formatDate } from '../../utils/dateUtils';
import UpiPaymentCard from '../../components/UpiPaymentCard';
import PujaCountdown from '../../components/PujaCountdown';
import BannerSlot from '../../components/BannerSlot';
import { useNavigate } from 'react-router-dom';
import { brand, surface, text, overlay, border, gradient, status, secondary } from '../../theme/colorTokens';

const HeroSection = ({ onSelectFlat, onNavigateTab }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [loading, setLoading] = useState(true);
  const [selectedFlat, setSelectedFlat] = useState(getSelectedFlat());

  // Additional states for flat subscription status and donations
  const [flatData, setFlatData] = useState(null);
  const [flatDataLoading, setFlatDataLoading] = useState(false);
  const [subscriptionAmount, setSubscriptionAmount] = useState(1500);
  const [upiConfig, setUpiConfig] = useState({ pa: '', pn: '' });
  const [showUpiPay, setShowUpiPay] = useState(false);

  const [appConfig, setAppConfig] = useState(null);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [donationFlat, setDonationFlat] = useState(selectedFlat ? (selectedFlat.flatNumber || (typeof selectedFlat === 'string' ? selectedFlat : '')) : '');
  const [donorName, setDonorName] = useState('');

  const loadFlatData = useCallback(async (flat, existingConfig = null) => {
    if (!flat) {
      setFlatData(null);
      return;
    }
    setFlatDataLoading(true);
    try {
      const flatLookup = flat.flatNumberForLookup || flat.flatNumber || (typeof flat === 'string' ? flat : '');
      if (!flatLookup) {
        setFlatData(null);
        return;
      }
      // Use existing config if provided (avoids duplicate getMasterConfig call)
      const [data, config] = await Promise.all([
        getFlatDetails(flatLookup),
        existingConfig ? Promise.resolve(existingConfig) : getMasterConfig(),
      ]);
      setFlatData(data || null);
      if (config?.subscriptionAmount) {
        setSubscriptionAmount(config.subscriptionAmount);
      }
      setUpiConfig({
        pa: config?.upiPayeeAddress || '',
        pn: config?.upiPayeeName || '',
      });
    } catch (error) {
      console.error('Error loading flat data in HeroSection:', error);
    } finally {
      setFlatDataLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    const handleFlatChange = () => {
      const flat = getSelectedFlat();
      setSelectedFlat(flat);
      loadFlatData(flat);
    };
    window.addEventListener('flatSelectionChanged', handleFlatChange);
    return () => {
      window.removeEventListener('flatSelectionChanged', handleFlatChange);
    };
  }, [loadFlatData]);

  useEffect(() => {
    if (selectedFlat) {
      setDonationFlat(selectedFlat.flatNumber);
    } else {
      setDonationFlat('');
    }
  }, [selectedFlat]);


  // Combined load: single getMasterConfig call shared between stats and flat data
  const loadAll = async () => {
    try {
      const config = await getMasterConfig();

      if (config) {
        if (config.subscriptionAmount) {
          setSubscriptionAmount(config.subscriptionAmount);
        }
        setUpiConfig({
          pa: config.upiPayeeAddress || '',
          pn: config.upiPayeeName || '',
        });
        setAppConfig(config);
      }
      // Load flat data with already-fetched config (no duplicate read)
      if (selectedFlat) {
        loadFlatData(selectedFlat, config);
      }
    } catch (error) {
      console.error('Error loading stats, donations and config:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const downloadDonationReceipt = async (donation) => {
    try {
      const { generateImageFromHTML } = await import('../../utils/print/core');
      const { getReceiptHTML } = await import('../../utils/print/templates/receiptTemplate');
      const receiptHtmlStr = getReceiptHTML(donation, appConfig, true, 'Donation Receipt');
      const canvas = await generateImageFromHTML(receiptHtmlStr);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Donation_Receipt_${(donation.donorName || donation.residentName || 'receipt').replace(/\s+/g, '_')}.jpg`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const hasFeedback = flatData?.feedbacks && flatData.feedbacks.length > 0;

  return (
    <Box>
      {/* Banner Ad — Hero Top */}
      <BannerSlot slot="hero-top" />

      {/* Hero Banner */}
      <Fade in timeout={600}>
        <Box
          sx={{
            position: 'relative',
            textAlign: 'center',
            py: selectedFlat ? { xs: 2.5, md: 3.5 } : { xs: 5, md: 7 },
            px: { xs: 2, sm: 3 },
            borderRadius: '24px',
            mb: selectedFlat ? 2 : 4,
            overflow: 'hidden',
            background: isDark
              ? `
                radial-gradient(ellipse at 30% 20%, rgba(255,143,0,0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(206,147,216,0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(230,81,0,0.08) 0%, transparent 60%),
                linear-gradient(135deg, rgba(17,24,39,0.95) 0%, rgba(13,17,23,0.95) 100%)
              `
              : `
                radial-gradient(ellipse at 30% 20%, rgba(255,143,0,0.12) 0%, transparent 50%),
                radial-gradient(ellipse at 70% 80%, rgba(206,147,216,0.08) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(255,179,0,0.06) 0%, transparent 60%),
                ${gradient.heroLight}
              `,
            border: isDark ? '1px solid rgba(255,143,0,0.15)' : '1px solid rgba(230,81,0,0.2)',
            boxShadow: isDark ? 'none' : '0 4px 20px rgba(255,143,0,0.08)',
          }}
        >
          {/* Floating decorative elements */}
          <Box
            sx={{
              position: 'absolute',
              top: '10%',
              left: '5%',
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,143,0,0.08) 0%, transparent 70%)',
              filter: 'blur(30px)',
              animation: 'heroFloat 8s ease-in-out infinite',
              '@keyframes heroFloat': {
                '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                '50%': { transform: 'translate(20px, -20px) scale(1.15)' },
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: '10%',
              right: '8%',
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(206,147,216,0.08) 0%, transparent 70%)',
              filter: 'blur(30px)',
              animation: 'heroFloat 10s ease-in-out infinite reverse',
            }}
          />

          {/* Logo, title and badge (only show if no flat is selected) */}
          {!selectedFlat && (
            <>
              {/* Logo */}
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '22px',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                  boxShadow: '0 8px 40px rgba(255,143,0,0.35)',
                  animation: 'heroGlow 3s ease-in-out infinite',
                  '@keyframes heroGlow': {
                    '0%, 100%': { boxShadow: '0 8px 40px rgba(255,143,0,0.35)' },
                    '50%': { boxShadow: '0 8px 60px rgba(255,143,0,0.55)' },
                  },
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <img src="/logo.png" alt={`${appConfig?.societyName || ''} Logo`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>

              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2rem', md: '3rem' },
                  background: gradient.brandTextFull,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {appConfig?.societyName?.toUpperCase() || ''}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 400,
                  fontSize: { xs: '0.9rem', md: '1.1rem' },
                  mb: 1.5,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                Evergreen Living
              </Typography>

              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(255,143,0,0.12) 0%, rgba(230,81,0,0.08) 100%)',
                  border: '1px solid rgba(255,143,0,0.2)',
                  mb: 3,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <CelebrationIcon sx={{ color: brand.gold, fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: brand.gold, fontWeight: 600 }}>
                  {appConfig?.committeeName || 'Committee'} {appConfig?.year || ''}
                </Typography>
              </Box>

              {/* Puja Countdown Timer & Celebration State (When no flat selected) */}
              <PujaCountdown
                config={appConfig}
                onNavigateTab={onNavigateTab}
              />
            </>
          )}

          {/* If Flat Selected, show payment status/thank you directly inside Hero Banner */}
          {selectedFlat && flatData && flatData.resident && (
            <Box sx={{ position: 'relative', zIndex: 1, mb: 1, width: '100%' }}>
              {/* Header inside Hero Banner */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255, 143, 0, 0.1)',
                    border: '1px solid rgba(255, 143, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ApartmentIcon sx={{ color: brand.orange, fontSize: 18 }} />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                    Flat {selectedFlat.flatNumber}
                  </Typography>
                  <Chip
                    icon={flatData.resident.subscriptionStatus === 'paid' ? <CheckIcon /> : <PendingIcon />}
                    label={flatData.resident.subscriptionStatus === 'paid' ? 'PAID' : 'PENDING'}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      height: 24,
                      backgroundColor: flatData.resident.subscriptionStatus === 'paid' ? 'rgba(102,187,106,0.15)' : 'rgba(255,167,38,0.15)',
                      color: flatData.resident.subscriptionStatus === 'paid' ? status.success.main(isDark) : status.warning.main(isDark),
                      '& .MuiChip-icon': { color: flatData.resident.subscriptionStatus === 'paid' ? status.success.main(isDark) : status.warning.main(isDark), fontSize: 16 },
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={onSelectFlat}
                    sx={{ borderRadius: '10px', py: 0, px: 1, height: 20, minWidth: 'auto', fontSize: '0.65rem', color: brand.orange, borderColor: border.brandMedium(isDark), ml: 'auto' }}
                  >
                    Change
                  </Button>
                </Box>
              </Box>

              {/* Status Specific Content */}
              {flatData.resident.subscriptionStatus === 'paid' ? (
                /* Paid: Thank you block (COMPACT) */
                <Fade in timeout={500}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(102, 187, 106, 0.08) 0%, rgba(56, 142, 60, 0.03) 100%)',
                      border: '1px solid rgba(102, 187, 106, 0.2)',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckIcon sx={{ color: status.success.main(isDark), fontSize: 20 }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: status.success.main(isDark) }}>
                        Thank You for Your Support! 🙏
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>Amount:</strong> {formatCurrency(flatData.resident.subscriptionAmount || subscriptionAmount)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>Date:</strong> {formatShortDate(flatData.resident.transactionDate || flatData.resident.paymentDate, appConfig?.dateFormat)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        <strong>Mode:</strong> {flatData.resident.paymentMode || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ) : (
                /* Unpaid: Payment options */
                <Fade in timeout={500}>
                  <Box sx={{ mt: 1, textAlign: 'left' }}>
                    <UpiPaymentCard
                      flatNumber={selectedFlat.flatNumber}
                      amount={subscriptionAmount}
                      mode="subscription"
                      pa={upiConfig.pa}
                      pn={upiConfig.pn}
                      societyName={appConfig?.societyName}
                      committeeName={appConfig?.committeeName}
                      year={appConfig?.year}
                      tn={appConfig?.upiPayeeDescription}
                      mc={appConfig?.upiMerchantCode || '8699'}
                      bankAccountNumber={appConfig?.bankAccountNumber}
                      bankIfscCode={appConfig?.bankIfscCode}
                      enabledUpiApps={appConfig?.enabledUpiApps}
                    />
                  </Box>
                </Fade>
              )}

              {/* Puja Countdown Timer & Celebration State — Between Subscription & Donation Cards */}
              <Box sx={{ mt: 2, mb: 1.5 }}>
                <PujaCountdown
                  config={appConfig}
                  compact
                  onNavigateTab={onNavigateTab}
                />
              </Box>

              <Grid container spacing={1.5} sx={{ mt: 0.5, textAlign: "left" }}>
                {/* Donation UPI Card — always visible and standalone */}
                {selectedFlat && (
                  <Grid size={12}>
                    <Fade in timeout={700}>
                      <Box>
                        <UpiPaymentCard
                          flatNumber={selectedFlat.flatNumber}
                          mode="donation"
                          pa={upiConfig.pa}
                          pn={upiConfig.pn}
                          societyName={appConfig?.societyName}
                          committeeName={appConfig?.committeeName}
                          year={appConfig?.year}
                          tn={appConfig?.upiPayeeDescription}
                          mc={appConfig?.upiMerchantCode || '8699'}
                          bankAccountNumber={appConfig?.bankAccountNumber}
                          bankIfscCode={appConfig?.bankIfscCode}
                          enabledUpiApps={appConfig?.enabledUpiApps}
                        />
                      </Box>
                    </Fade>
                  </Grid>
                )}

                {/* Paid Donations (Only show if there are any) */}
                {flatData.donations && flatData.donations.length > 0 && (
                  <Grid size={12}>
                    <Fade in timeout={600}>
                      <Card sx={{ borderRadius: '12px' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <DonationIcon sx={{ color: secondary.main(isDark) }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Paid Donations
                            </Typography>
                            <Chip
                              label={flatData.donations.length}
                              size="small"
                              sx={{ ml: 'auto', backgroundColor: 'rgba(206,147,216,0.12)', color: secondary.main(isDark), fontWeight: 600 }}
                            />
                          </Box>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Date</TableCell>
                                  <TableCell>Amount</TableCell>
                                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Mode</TableCell>
                                  <TableCell align="right">Receipt</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {flatData.donations.map((donation) => (
                                  <TableRow key={donation.id}>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        {formatDate(donation.transactionDate || donation.createdAt, appConfig?.dateFormat)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: secondary.main(isDark) }}>
                                        {formatCurrency(donation.amount)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                        {donation.paymentMode}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Tooltip title="Download Receipt">
                                        <IconButton size="small" onClick={() => downloadDonationReceipt(donation)} sx={{ color: brand.orange }}>
                                          <DownloadIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                )}



                {/* Submitted Feedbacks */}
                {hasFeedback && (
                  <Grid size={12}>
                    <Fade in timeout={1000}>
                      <Card>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <FeedbackIcon sx={{ color: brand.orange }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              My Feedbacks
                            </Typography>
                            <Chip
                              label={flatData.feedbacks?.length || 0}
                              size="small"
                              sx={{ ml: 'auto', backgroundColor: overlay.brandMedium(isDark), color: brand.orange, fontWeight: 600 }}
                            />
                          </Box>

                          {!flatData.feedbacks || flatData.feedbacks.length === 0 ? (
                            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                              No feedbacks submitted for this flat yet.
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {flatData.feedbacks.map((item) => (
                                <Box
                                  key={item.id}
                                  sx={{
                                    p: 2,
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Chip
                                        label={item.category}
                                        size="small"
                                        sx={{
                                          fontSize: '0.7rem',
                                          fontWeight: 600,
                                          backgroundColor: overlay.brandLight(isDark),
                                          color: brand.orange,
                                        }}
                                      />
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {formatShortDate(item.createdAt, appConfig?.dateFormat)}
                                      </Typography>
                                    </Box>

                                    <Chip
                                      label={item.replyMessage ? 'Replied' : 'Pending Review'}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        borderColor: item.replyMessage ? 'rgba(102,187,106,0.4)' : 'rgba(255,167,38,0.4)',
                                        color: item.replyMessage ? status.success.main(isDark) : status.warning.main(isDark),
                                        backgroundColor: item.replyMessage ? 'rgba(102,187,106,0.04)' : 'rgba(255,167,38,0.04)',
                                      }}
                                    />
                                  </Box>

                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary', mb: item.replyMessage ? 2 : 0, lineHeight: 1.5 }}>
                                    {item.message}
                                  </Typography>

                                  {item.replyMessage && (
                                    <Box
                                      sx={{
                                        p: 1.5,
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(102,187,106,0.03)',
                                        borderLeft: `3px solid ${status.success.main(isDark)}`,
                                        border: '1px solid rgba(102,187,106,0.1)',
                                        borderLeftWidth: '3px',
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="caption" sx={{ color: status.success.main(isDark), fontWeight: 600 }}>
                                          Reply from {appConfig?.committeeName ? `${appConfig.committeeName} Team` : 'DPC Team'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                          {item.repliedAt ? formatDate(item.repliedAt, appConfig?.dateFormat) : ''}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '0.85rem', color: 'text.primary', lineHeight: 1.4 }}>
                                        {item.replyMessage}
                                      </Typography>
                                    </Box>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          {/* Warning: Flat selected but not found in system */}
          {selectedFlat && !flatDataLoading && !flatData && !loading && (
            <Fade in timeout={500}>
              <Box
                sx={{
                  position: 'relative',
                  zIndex: 1,
                  textAlign: 'center',
                  p: 3,
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255,167,38,0.08) 0%, rgba(239,83,80,0.05) 100%)',
                  border: '1px solid rgba(255,167,38,0.25)',
                }}
              >
                <WarningIcon sx={{ color: status.warning.main(isDark), fontSize: 40, mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: status.warning.main(isDark), mb: 0.5 }}>
                  Flat {selectedFlat.flatNumber} Not Found
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
                  This flat does not exist in our system yet. Please select a different flat or contact the committee for assistance.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<ApartmentIcon />}
                  onClick={onSelectFlat}
                  sx={{
                    borderRadius: '12px',
                    px: 3,
                    py: 1,
                    fontWeight: 700,
                  }}
                >
                  Change Flat
                </Button>
              </Box>
            </Fade>
          )}

          {/* Loading indicator when flat data is being fetched */}
          {selectedFlat && flatDataLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, position: 'relative', zIndex: 1 }}>
              <CircularProgress sx={{ color: brand.orange }} size={32} />
            </Box>
          )}

          {/* CTA Buttons */}
          {!selectedFlat && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <Button
                variant="contained"
                startIcon={<ApartmentIcon />}
                onClick={onSelectFlat}
                sx={{
                  borderRadius: '14px',
                  px: 3.5,
                  py: 1.3,
                  fontSize: '0.95rem',
                  fontWeight: 700,
                }}
              >
                Select Your Flat
              </Button>
              <Button
                variant="outlined"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/dpc')}
                sx={{
                  borderRadius: '14px',
                  px: 3.5,
                  py: 1.3,
                }}
              >
                View {appConfig?.committeeName || 'Committee'}
              </Button>
            </Box>
          )}
        </Box>
      </Fade>

      {/* Banner Ad — Hero Bottom */}
      <BannerSlot slot="hero-bottom" />

      {/* Donate Now Dialog */}
      <Dialog
        open={donationDialogOpen}
        onClose={() => setDonationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              backgroundColor: surface.paper(isDark),
              border: `1px solid ${border.divider(isDark)}`,
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DonationIcon sx={{ color: secondary.main(isDark) }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Contribute a Donation
            </Typography>
          </Box>
          <IconButton onClick={() => setDonationDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
              Your contribution will help us host cultural programs, decorate the pandal, and distribute bhog. Please fill in details below to generate your UPI QR code.
            </Typography>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Flat Number (Optional)"
                  placeholder="e.g. 10/4B"
                  value={donationFlat}
                  onChange={(e) => setDonationFlat(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Your Name (Optional)"
                  placeholder="e.g. Amit Sharma"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.06)' }} />

            <UpiPaymentCard
              flatNumber={donationFlat || 'Guest'}
              mode="donation"
              pa={upiConfig.pa}
              pn={upiConfig.pn}
              societyName={appConfig?.societyName}
              committeeName={appConfig?.committeeName}
              year={appConfig?.year}
              tn={appConfig?.upiPayeeDescription}
              mc={appConfig?.upiMerchantCode || '8699'}
              bankAccountNumber={appConfig?.bankAccountNumber}
              bankIfscCode={appConfig?.bankIfscCode}
              enabledUpiApps={appConfig?.enabledUpiApps}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HeroSection;
