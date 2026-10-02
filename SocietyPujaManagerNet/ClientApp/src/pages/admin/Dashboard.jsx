import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Card, CardContent, Typography, IconButton, LinearProgress, Skeleton, Chip, Fade, CircularProgress, Tooltip } from '@mui/material';
import {
  People as PeopleIcon,
  CurrencyRupee as RupeeIcon,
  Fastfood as FastfoodIcon,
  VolunteerActivism as DonationIcon,
  Business as SponsorIcon,
  TrendingUp as TrendingUpIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Feedback as FeedbackIcon,
  Autorenew as RefreshIcon,
  MenuBook as SouvenirIcon,
} from '@mui/icons-material';
import { getMasterConfig } from '../../services/masterConfigService';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardStats, refreshDashboardStats } from '../../services/dashboardStatsService';
import {
  brand,
  secondary,
  status,
  statusBadge,
  printTheme,
  sponsorshipPalette,
  leadsPalette,
} from '../../theme/colorTokens';

const getCategoryColor = (cat) => {
  const map = {
    Suggestion: statusBadge.info.text,
    Complaint: statusBadge.error.text,
    Appreciation: statusBadge.success.text,
    'Food Related': statusBadge.warning.text,
    'Event Related': statusBadge.purple.text,
  };
  return map[cat] || statusBadge.slate.text;
};

const feedbackCategories = [
  { id: 'Appreciation', label: 'Appreciations', color: statusBadge.success.text },
  { id: 'Suggestion', label: 'Suggestions', color: statusBadge.info.text },
  { id: 'Complaint', label: 'Complaints', color: statusBadge.error.text },
  { id: 'Food Related', label: 'Food Related', color: statusBadge.warning.text },
  { id: 'Event Related', label: 'Event Related', color: statusBadge.purple.text }
];

const StatCard = ({ title, value, subtitle, icon, color, gradient, delay, onClick }) => (
  <Fade in={true} timeout={600 + delay * 150}>
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: gradient,
        },
      }}
    >
      <CardContent sx={{ p: { xs: 2, lg: 1.5, xl: 2 }, '&:last-child': { pb: { xs: 2, lg: 1.5, xl: 2 } } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ minWidth: 0, flex: 1, mr: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                mb: 0.5,
                fontSize: { xs: '0.875rem', lg: '0.78rem', xl: '0.85rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={title}
            >
              {title}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                color: 'text.primary',
                fontSize: { xs: '1.25rem', lg: '1.15rem', xl: '1.35rem' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                sx={{
                  color,
                  mt: 0.5,
                  display: 'block',
                  fontWeight: 500,
                  fontSize: { xs: '0.75rem', lg: '0.7rem', xl: '0.75rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={subtitle}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5, flexShrink: 0 }}>
            {onClick && (
              <IconButton size="small" sx={{ color: 'text.secondary', p: 0.25, '&:hover': { color: 'text.primary', background: 'rgba(255,255,255,0.05)' } }}>
                <ArrowForwardIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <Box
              sx={{
                width: { xs: 40, lg: 34, xl: 40 },
                height: { xs: 40, lg: 34, xl: 40 },
                borderRadius: '10px',
                background: `${color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: onClick ? 0 : 'auto',
              }}
            >
              {React.cloneElement(icon, { sx: { color, fontSize: { xs: 22, lg: 18, xl: 22 } } })}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  </Fade>
);

const MetricCard = ({ title, value, icon, color, bg }) => (
  <Card sx={{ position: 'relative', overflow: 'hidden', height: '100%', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${color}, ${color}88)` } }}>
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { sx: { color, fontSize: 20 } })}
      </Box>
      <Box sx={{ overflow: 'hidden' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color, fontSize: { xs: '0.9rem', sm: '1.05rem' }, lineHeight: 1.2, mb: 0.25 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, fontWeight: 500 }}>{title}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAuditor = user?.role === 'Auditor';
  const isFinanceUser = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Treasurer' || isAuditor;
  const isStandard = user?.role === 'Standard';
  const isCultural = user?.role === 'Cultural';
  const isSponsorUser = user?.role === 'Collection';
  const canViewLeads = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Collection' || user?.role === 'Treasurer';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subscription: { totalFlats: 0, paidCount: 0, pendingCount: 0, totalCollected: 0, cashCollected: 0, bankCollected: 0, collectionPercentage: 0 },
    donation: { totalDonations: 0, totalAmount: 0, cashAmount: 0, bankAmount: 0 },
    souvenir: { totalSouvenirs: 0, totalAmount: 0, cashAmount: 0, bankAmount: 0 },
    sponsorship: { totalSponsorships: 0, totalAmount: 0, cashAmount: 0, bankAmount: 0, totalCamAmount: 0 },
    foodCoupon: { totalCoupons: 0, totalAmount: 0, cashAmount: 0, bankAmount: 0, totalDineOut: 0, totalParcel: 0 },
    expense: { totalExpenses: 0, totalAmount: 0, cashAmount: 0, bankAmount: 0 },
    leads: { totalLeads: 0, pendingCount: 0, closedCount: 0, paidCount: 0, totalPromisedAmount: 0, paidAmount: 0 },
    chequeTransaction: { totalTransactions: 0, chequeToCashAmount: 0, chequeToVendorAmount: 0 },
  });

  const [feedbackCounts, setFeedbackCounts] = useState({});
  const [sponsorshipLeadsSummary, setSponsorshipLeadsSummary] = useState({ totalLeads: 0, pendingLeads: 0, expectedAmount: 0, receivedAmount: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Try to load pre-computed stats (1 Firestore read instead of ~800+)
      const [cachedStats, configData] = await Promise.all([
        getDashboardStats(),
        getMasterConfig(),
      ]);

      if (cachedStats) {
        // Pre-computed stats exist — use them directly
        setStats({
          subscription: cachedStats.subscription || stats.subscription,
          donation: cachedStats.donation || stats.donation,
          souvenir: cachedStats.souvenir || stats.souvenir,
          sponsorship: cachedStats.sponsorship || stats.sponsorship,
          foodCoupon: cachedStats.foodCoupon || stats.foodCoupon,
          expense: cachedStats.expense || stats.expense,
          leads: cachedStats.leads || stats.leads,
          chequeTransaction: cachedStats.chequeTransaction || stats.chequeTransaction,
        });
        setFeedbackCounts(cachedStats.feedbackCounts || {});
        setSponsorshipLeadsSummary(cachedStats.sponsorshipLeadsSummary || { totalLeads: 0, pendingLeads: 0, expectedAmount: 0, receivedAmount: 0 });
      } else {
        // First-ever load or legacy format — compute fresh stats and persist
        const freshStats = await refreshDashboardStats();
        if (freshStats) {
          setStats({
            subscription: freshStats.subscription || stats.subscription,
            donation: freshStats.donation || stats.donation,
            souvenir: freshStats.souvenir || stats.souvenir,
            sponsorship: freshStats.sponsorship || stats.sponsorship,
            foodCoupon: freshStats.foodCoupon || stats.foodCoupon,
            expense: freshStats.expense || stats.expense,
            leads: freshStats.leads || stats.leads,
            chequeTransaction: freshStats.chequeTransaction || stats.chequeTransaction,
          });
          setFeedbackCounts(freshStats.feedbackCounts || {});
          setSponsorshipLeadsSummary(freshStats.sponsorshipLeadsSummary || { totalLeads: 0, pendingLeads: 0, expectedAmount: 0, receivedAmount: 0 });
        }
      }
      setConfig(configData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const freshStats = await refreshDashboardStats();
      if (freshStats) {
        setStats({
          subscription: freshStats.subscription || stats.subscription,
          donation: freshStats.donation || stats.donation,
          souvenir: freshStats.souvenir || stats.souvenir,
          sponsorship: freshStats.sponsorship || stats.sponsorship,
          foodCoupon: freshStats.foodCoupon || stats.foodCoupon,
          expense: freshStats.expense || stats.expense,
          leads: freshStats.leads || stats.leads,
          chequeTransaction: freshStats.chequeTransaction || stats.chequeTransaction,
        });
        setFeedbackCounts(freshStats.feedbackCounts || {});
        setSponsorshipLeadsSummary(freshStats.sponsorshipLeadsSummary || { totalLeads: 0, pendingLeads: 0, expectedAmount: 0, receivedAmount: 0 });
      }
    } catch (error) {
      console.error('Error refreshing stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount, decimals = 0) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  };

  const renderCurrency = (amount, decimals = 0) => {
    const formatted = formatCurrency(amount, decimals);
    if (decimals === 0 || !formatted.includes('.')) return formatted;
    const parts = formatted.split('.');
    return (
      <>
        {parts[0]}<span style={{ fontSize: '0.65em', opacity: 0.85, fontWeight: 700 }}>.{parts[1]}</span>
      </>
    );
  };

  const totalCollection =
    stats.subscription.totalCollected + stats.donation.totalAmount + (stats.souvenir.totalAmount || 0) + stats.sponsorship.totalAmount + stats.foodCoupon.totalAmount;
  const cashCollection =
    (stats.subscription.cashCollected || 0) +
    (stats.donation.cashAmount || 0) +
    (stats.souvenir.cashAmount || 0) +
    (stats.sponsorship.cashAmount || 0) +
    (stats.foodCoupon.cashAmount || 0);
  const bankCollection =
    (stats.subscription.bankCollected || 0) +
    (stats.donation.bankAmount || 0) +
    (stats.souvenir.bankAmount || 0) +
    (stats.sponsorship.bankAmount || 0) +
    (stats.foodCoupon.bankAmount || 0);

  const cashExpense = stats.expense.cashAmount || 0;
  const bankExpense = stats.expense.bankAmount || 0;

  const chequeToCashAmount = stats.chequeTransaction?.chequeToCashAmount || 0;
  const camAmount = stats.sponsorship.totalCamAmount || 0;

  const netBalance = totalCollection - (stats.expense.totalAmount || 0) - camAmount;
  const netCashBalance = cashCollection - cashExpense + chequeToCashAmount;
  const netBankBalance = bankCollection - bankExpense - chequeToCashAmount;

  if (loading) {
    return (
      <Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={160} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Fade in={true} timeout={400}>
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              Jai Maa Durga! 🙏
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              Overview for {config?.committeeName || 'Committee'} {config?.year || ''}
            </Typography>
          </Box>
          <Tooltip title="Refresh Stats">
            <IconButton 
              color="primary"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              {refreshing ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Fade>

      {/* Total Collection Banner */}
      {isFinanceUser && (
        <Fade in={true} timeout={500}>
          <Card
            sx={{
              mb: 4,
              background: 'linear-gradient(135deg, rgba(255,143,0,0.12) 0%, rgba(230,81,0,0.06) 100%)',
              border: '1px solid rgba(255,143,0,0.2)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} sx={{ mb: 1, mt: 0.5 }}>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    TOTAL COLLECTION
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      background: `linear-gradient(135deg, ${brand.gold}, ${brand.orange})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {renderCurrency(totalCollection, 2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    TOTAL EXPENSE
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      color: statusBadge.error.text
                    }}
                  >
                    {renderCurrency(stats.expense.totalAmount || 0, 2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    BANK BALANCE
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      color: netBankBalance >= 0 ? statusBadge.info.text : statusBadge.error.text
                    }}
                  >
                    {renderCurrency(netBankBalance, 2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    CASH IN HAND
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      color: netCashBalance >= 0 ? statusBadge.teal.text : statusBadge.error.text
                    }}
                  >
                    {renderCurrency(netCashBalance, 2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    CAM AMOUNT
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      color: statusBadge.warning.text
                    }}
                  >
                    {renderCurrency(camAmount, 2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem', lg: '0.65rem', xl: '0.8rem' }, letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                    NET BALANCE
                  </Typography>
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem', lg: '1.15rem', xl: '1.5rem' },
                      whiteSpace: 'nowrap',
                      color: netBalance >= 0 ? statusBadge.success.text : statusBadge.error.text
                    }}
                  >
                    {renderCurrency(netBalance, 2)}
                  </Typography>
                </Grid>
              </Grid>

              {/* Collection Progress */}
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Subscription Collection Progress
                    </Typography>
                    <Chip
                      icon={<TrendingUpIcon />}
                      label={`${stats.subscription.collectionPercentage}% Subscriptions`}
                      size="small"
                      sx={{
                        backgroundColor: statusBadge.success.bg,
                        color: statusBadge.success.text,
                        '& .MuiChip-icon': { color: statusBadge.success.text },
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      <span style={{ color: statusBadge.error.text }}>{stats.subscription.pendingCount}</span> pending{' / '}
                      <span style={{ color: statusBadge.success.text }}>{stats.subscription.paidCount}</span> paid{' of '}
                      <span style={{ color: statusBadge.info.text }}>{stats.subscription.totalFlats}</span> flats
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.subscription.collectionPercentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: 'rgba(255,143,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${brand.orange}, ${brand.gold})`,
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}


      {/* Stats Grid */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 2, lg: 2 }} sx={{ mb: 4 }}>
        {isFinanceUser && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <StatCard
                title="Subscription Collected"
                value={formatCurrency(stats.subscription.totalCollected)}
                subtitle={`${stats.subscription.paidCount} paid / ${stats.subscription.pendingCount} pending`}
                icon={<RupeeIcon />}
                color={statusBadge.success.text}
                gradient={`linear-gradient(90deg, ${statusBadge.success.text}, ${status.success.dark(true)})`}
                delay={0}
                onClick={() => navigate('/subscriptions')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <StatCard
                title="Donations"
                value={formatCurrency(stats.donation.totalAmount)}
                subtitle={`${stats.donation.totalDonations} donations`}
                icon={<DonationIcon />}
                color={statusBadge.donation.text}
                gradient={`linear-gradient(90deg, ${statusBadge.donation.text}, ${secondary.dark(true)})`}
                delay={1}
                onClick={() => navigate('/donations')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <StatCard
                title="Souvenirs"
                value={formatCurrency(stats.souvenir.totalAmount)}
                subtitle={`${stats.souvenir.totalSouvenirs} entries`}
                icon={<SouvenirIcon />}
                color={statusBadge.souvenir.text}
                gradient={`linear-gradient(90deg, ${statusBadge.souvenir.text}, ${statusBadge.info.text})`}
                delay={1}
                onClick={() => navigate('/souvenirs')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <StatCard
                title="Sponsors"
                value={formatCurrency(stats.sponsorship.totalAmount)}
                subtitle={`${stats.sponsorship.totalSponsorships} sponsors`}
                icon={<SponsorIcon />}
                color={statusBadge.expense.text}
                gradient={`linear-gradient(90deg, ${statusBadge.expense.text}, ${printTheme.receiptCyan})`}
                delay={2}
                onClick={() => navigate('/sponsorships')}
              />
            </Grid>
          </>
        )}

        {!isStandard && !isCultural && !isSponsorUser && (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
              <StatCard
                title="Food Coupons Sold"
                value={isFinanceUser ? formatCurrency(stats.foodCoupon.totalAmount) : stats.foodCoupon.totalCoupons}
                subtitle={isFinanceUser ? `${stats.foodCoupon.totalCoupons} coupons` : undefined}
                icon={<FastfoodIcon />}
                color={brand.orange}
                gradient={`linear-gradient(90deg, ${brand.orange}, ${brand.orangeDark})`}
                delay={3}
                onClick={() => navigate('/food-coupons/dashboard')}
              />
            </Grid>
        )}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {canViewLeads && (
          <>
            {/* Sponsor Leads First */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Fade in={true} timeout={600}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Sponsorship Overview</Typography>
                      <IconButton size="small" onClick={() => navigate('/sponsorships')} sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    {(() => {
                      const { totalLeads, pendingLeads, expectedAmount, receivedAmount } = sponsorshipLeadsSummary;

                      return (
                        <Grid container spacing={1.5}>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <MetricCard title="Assigned Leads" value={totalLeads} icon={<PeopleIcon />} color={sponsorshipPalette.external} bg={statusBadge.info.bg} />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <MetricCard title="Pending Leads" value={pendingLeads} icon={<SponsorIcon />} color={sponsorshipPalette.cam} bg={statusBadge.warning.bg} />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <MetricCard title="Target Amount" value={formatCurrency(expectedAmount)} icon={<RupeeIcon />} color={sponsorshipPalette.internal} bg={statusBadge.purple.bg} />
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <MetricCard title="Collected Amount" value={formatCurrency(receivedAmount)} icon={<DonationIcon />} color={sponsorshipPalette.net} bg={statusBadge.success.bg} />
                          </Grid>
                        </Grid>
                      );
                    })()}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>

            {/* General Leads Below */}
            <Grid size={{ xs: 12, lg: 6 }}>
              <Fade in={true} timeout={800}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Leads Overview</Typography>
                      <IconButton size="small" onClick={() => navigate('/leads')} sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}>
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <MetricCard title="Total Leads" value={stats.leads.totalLeads} icon={<PeopleIcon />} color={leadsPalette.total.color} bg={leadsPalette.total.bg} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <MetricCard title="Pending Follow-ups" value={stats.leads.pendingCount} icon={<PeopleIcon />} color={leadsPalette.pending.color} bg={leadsPalette.pending.bg} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <MetricCard title="Total Amount" value={formatCurrency(stats.leads.totalPromisedAmount)} icon={<RupeeIcon />} color={leadsPalette.amount.color} bg={leadsPalette.amount.bg} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <MetricCard title="Converted Amount" value={formatCurrency(stats.leads.paidAmount)} icon={<DonationIcon />} color={leadsPalette.converted.color} bg={leadsPalette.converted.bg} />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          </>
        )}
        {!isSponsorUser && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <Fade in={true} timeout={1200}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Feedback Overview</Typography>
                    <IconButton size="small" onClick={() => navigate('/feedback-inbox')} sx={{ color: 'text.secondary', p: 0.5, '&:hover': { color: 'text.primary' } }}>
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Grid container spacing={1.5} sx={{ justifyContent: "center" }}>
                    {feedbackCategories.map((cat) => (
                      <Grid key={cat.id} size={{ xs: 6, sm: 4, md: 2.4 }} sx={{ flexGrow: 1 }}>
                        <MetricCard
                          title={cat.label}
                          value={feedbackCounts[cat.id] || 0}
                          icon={<FeedbackIcon />}
                          color={cat.color}
                          bg={`${cat.color}25`}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;
