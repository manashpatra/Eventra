import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Chip,
  Divider,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  CircularProgress,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Fastfood as FastfoodIcon,
  VolunteerActivism as DonationIcon,
  Business as SponsorIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountIcon,
  Assessment as ReportIcon,
  AccountBalanceWallet as ExpenseIcon,
  CurrencyRupee as CashIcon,
  QrCodeScanner as QrCodeScannerIcon,
  Feedback as FeedbackIcon,
  Notifications as NotificationsIcon,
  Science as TestIcon,
  History as HistoryIcon,
  Event as EventIcon,
  Campaign as CampaignIcon,
  Store as StoreIcon,
  Contacts as LeadIcon,
  Payments as CashInHandIcon,
  SystemUpdate as SystemUpdateIcon,
  Public as PublicIcon,
  NotificationsActive as NotificationsActiveIcon,
  MenuBook as SouvenirIcon,
  QrCode2 as QrCodeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getMasterConfig } from '../services/masterConfigService';

import InstallPrompt from '../components/InstallPrompt';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelectionDialog from '../components/LanguageSelectionDialog';
import DonationPaymentDialog from '../components/DonationPaymentDialog';
import { LanguageProvider } from '../contexts/LanguageContext';
import packageJson from '../../package.json';
import { brand, surface, overlay, gradient, shadow, border, getRoleColor, text } from '../theme/colorTokens';

const DRAWER_WIDTH = 280;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Standard', 'Cultural', 'Collection', 'Food Seller'] },
  { text: 'Coupons', icon: <FastfoodIcon />, path: '/food-coupons', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Food Seller'] },
  { text: 'Subscriptions', icon: <PeopleIcon />, path: '/subscriptions', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Donations', icon: <DonationIcon />, path: '/donations', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Souvenirs', icon: <SouvenirIcon />, path: '/souvenirs', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Sponsors', icon: <SponsorIcon />, path: '/sponsorships', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'Collection'] },
  { text: 'Vendors', icon: <StoreIcon />, path: '/vendors', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Standard', 'Cultural', 'Collection'] },
  { text: 'Expenses', icon: <ExpenseIcon />, path: '/expenses', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Cash', icon: <CashInHandIcon />, path: '/cash-in-hand', allowedRoles: ['Super Admin', 'Admin', 'Treasurer'] },
  { text: 'Reports', icon: <ReportIcon />, path: '/admin-reports', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Leads', icon: <LeadIcon />, path: '/leads', allowedRoles: ['Super Admin', 'Admin', 'Collection', 'Treasurer'] },
  { text: 'Events', icon: <EventIcon />, path: '/manage-events', allowedRoles: ['Super Admin', 'Admin', 'Cultural'] },
  { text: 'Feedbacks', icon: <FeedbackIcon />, path: '/feedback-inbox', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Standard', 'Cultural'] },
  { text: 'Notice', icon: <NotificationsIcon />, path: '/publish-notices', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Standard'] },
  { text: 'Audit', icon: <HistoryIcon />, path: '/audit-trail', allowedRoles: ['Super Admin'] },
  { text: 'Ads', icon: <CampaignIcon />, path: '/banner-ads', allowedRoles: ['Super Admin'] },
  { text: 'Withdrawal', icon: <CashIcon />, path: '/withdrawals', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'Auditor'] },
  { text: 'Labs', icon: <TestIcon />, path: '/test', allowedRoles: ['Super Admin'] },
  { text: 'Scanner', icon: <QrCodeScannerIcon />, path: '/scanner', allowedRoles: ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Food Seller'] },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings', allowedRoles: ['Super Admin'] },
];

const DashboardLayout = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? saved === 'true' : true;
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [donationQrOpen, setDonationQrOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    getMasterConfig().then(setAppConfig).catch(() => { });
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const isSidebarCollapsed = collapsed && !isMobile;
  const drawerWidth = isSidebarCollapsed ? 80 : 280;

  const handleMenuClick = (path) => {
    navigate(path);
    if (isMobile) setMobileOpen(false);
  };

  const handleProfileMenu = (event) => {
    setAnchorEl((prev) => (prev ? null : event.currentTarget));
  };
  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenDonationQr = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleCloseMenu();
    setTimeout(() => {
      setDonationQrOpen(true);
    }, 50);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    await logout();
    navigate('/login');
  };



  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo/Brand Area */}
      <Box
        sx={{
          p: isSidebarCollapsed ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
          gap: isSidebarCollapsed ? 0 : 2,
          background: gradient.brandTint(isDark),
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: '14px',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: shadow.logoShadow,
            flexShrink: 0,
          }}
        >
          <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </Box>
        {!isSidebarCollapsed && (
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: '1rem',
                background: gradient.brandText,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {appConfig?.societyName?.toUpperCase() || 'HOME'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
              {appConfig?.committeeName || ''} {appConfig?.year || ''}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, py: 2, px: isSidebarCollapsed ? 1 : 1.5 }}>
        {menuItems
          .filter(item => item.allowedRoles?.includes(user?.role) && (item.path !== '/scanner' || appConfig?.onlineFoodCouponEnabled))
          .map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const displayText = item.text;
            const displayIcon = item.icon;

            const buttonContent = (
              <ListItemButton
                onClick={() => handleMenuClick(item.path)}
                sx={{
                  borderRadius: '12px',
                  py: 1.2,
                  px: isSidebarCollapsed ? 0 : 2,
                  justifyContent: isSidebarCollapsed ? 'center' : 'flex-start',
                  transition: 'all 0.2s ease',
                  backgroundColor: isActive
                    ? overlay.brandMedium(isDark)
                    : 'transparent',
                  borderLeft: isActive
                    ? `3px solid ${isDark ? brand.orange : brand.orangeDark}`
                    : '3px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? overlay.brandStrong(isDark)
                      : overlay.neutralLight(isDark),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? brand.orange : 'text.secondary',
                    minWidth: isSidebarCollapsed ? 0 : 40,
                    justifyContent: 'center',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {displayIcon}
                </ListItemIcon>
                {!isSidebarCollapsed && (
                  <ListItemText
                    primary={displayText}
                    sx={{
                      '& .MuiTypography-root': {
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? brand.orange : 'text.primary',
                        fontSize: '0.9rem',
                      },
                    }}
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                {isSidebarCollapsed ? (
                  <Tooltip title={displayText} placement="right" arrow>
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: 'width 0.2s ease-in-out'
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true, disableRestoreFocus: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              transition: 'width 0.2s ease-in-out',
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* App Bar */}
        <AppBar position="sticky" sx={{ width: '100%', color: 'text.primary' }}>
          <Toolbar sx={{ gap: 1, minHeight: { xs: 50, sm: 56 } }}>
            <IconButton
              edge="start"
              onClick={isMobile ? handleDrawerToggle : toggleCollapsed}
              sx={{ color: 'text.primary', mr: 1 }}
            >
              {isMobile ? <MenuIcon /> : (isSidebarCollapsed ? <MenuIcon /> : <MenuOpenIcon />)}
            </IconButton>

            <Typography
              variant="h6"
              sx={{
                flex: 1,
                fontWeight: 600,
                fontSize: '1.1rem',
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {menuItems.find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))?.text || 'Dashboard'}
            </Typography>

            {/* Scanner Button */}
            {appConfig?.onlineFoodCouponEnabled && user && ['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Food Seller'].includes(user.role) && (
              <Tooltip title="Scanner">
                <IconButton
                  onClick={() => navigate('/scanner')}
                  sx={{
                    color: location.pathname === '/scanner' ? brand.orange : 'text.primary',
                    backgroundColor: location.pathname === '/scanner' ? overlay.brandLight(isDark) : 'transparent',
                    '&:hover': {
                      backgroundColor: location.pathname === '/scanner' ? overlay.brandMedium(isDark) : overlay.neutralLight(isDark),
                    },
                  }}
                >
                  <QrCodeScannerIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Language Switcher */}
            <LanguageSwitcher />


            {/* Profile Menu */}
            <Tooltip title={user?.displayName || user?.email || 'Account'}>
              <IconButton onClick={handleProfileMenu}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    background: gradient.brand,
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    transition: 'all 0.2s ease-in-out',
                    outline: Boolean(anchorEl) ? `2px solid ${brand.orange}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                >
                  {(user?.displayName || user?.email || 'U')[0].toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              disableRestoreFocus
              transitionDuration={{ enter: 150, exit: 0 }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{
                paper: {
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: isDark
                      ? 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.6))'
                      : 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.12))',
                    minWidth: 185,
                    maxWidth: 250,
                    borderRadius: '10px',
                    mt: 1.25,
                    p: 0.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: surface.menu(isDark),
                    backgroundImage: 'none',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 18,
                      width: 10,
                      height: 10,
                      backgroundColor: surface.menu(isDark),
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 1,
                      borderTop: '1px solid',
                      borderLeft: '1px solid',
                      borderColor: 'divider',
                    },
                  },
                },
              }}
            >
              {/* User Profile Header (clean full-contrast Box) */}
              <Box sx={{ px: 1.25, py: 0.75, outline: 'none' }}>
                <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.35 }}>
                    {user?.role && (
                      <Chip
                        label={user.role}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.58rem',
                          height: 18,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          backgroundColor: getRoleColor(user.role).bg,
                          color: getRoleColor(user.role).text,
                          border: `1px solid ${getRoleColor(user.role).border}`,
                          borderRadius: '4px',
                          px: 0.35,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: 'text.primary',
                        fontSize: '0.82rem',
                        lineHeight: 1.2,
                        cursor: 'default',
                        maxWidth: '100%',
                      }}
                      noWrap
                    >
                      {user?.displayName && user.displayName !== user.email
                        ? user.displayName
                        : user?.email ? user.email.split('@')[0] : (user?.displayName || 'User')}
                    </Typography>
                    {user?.email && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.72rem',
                          lineHeight: 1.2,
                          cursor: 'default',
                          maxWidth: '100%',
                        }}
                        noWrap
                      >
                        {user.email}
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 0.35 }} />

              {/* Added Install App to Profile Menu */}
              <InstallPrompt variant="menuitem" onClick={handleCloseMenu} />

              {/* Theme Toggle */}
              <ThemeToggle variant="menuitem" onClick={handleCloseMenu} />

              {/* Donation & Payment Details QR */}
              <MenuItem
                onClick={handleOpenDonationQr}
                sx={{
                  py: 0.45,
                  px: 1.25,
                  borderRadius: '6px',
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <QrCodeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.primary' }}>
                  Donation QR
                </Typography>
              </MenuItem>

              <MenuItem
                onClick={() => { handleCloseMenu(); navigate('/home'); }}
                sx={{
                  py: 0.45,
                  px: 1.25,
                  borderRadius: '6px',
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <PublicIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'text.primary' }}>
                  Public View
                </Typography>
              </MenuItem>

              <Divider sx={{ my: 0.35 }} />

              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 0.45,
                  px: 1.25,
                  borderRadius: '6px',
                  minHeight: 32,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'error.main',
                  transition: 'all 0.15s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(239, 83, 80, 0.08)',
                  },
                }}
              >
                <LogoutIcon sx={{ fontSize: 18, color: 'error.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem', color: 'inherit' }}>
                  Logout
                </Typography>
              </MenuItem>

              <Box sx={{ display: 'flex', justifyContent: 'center', pt: 0.75, pb: 0.25 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600, letterSpacing: '0.02em' }}>
                  v{packageJson.version}
                </Typography>
              </Box>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Page Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 1.25, sm: 2 },
            pt: { xs: 1, sm: 1 },
            overflow: 'auto',
          }}
        >
          <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
              <CircularProgress color="primary" />
            </Box>
          }>
            <Outlet />
          </Suspense>
        </Box>
      </Box>

      {/* Donation Payment QR Dialog */}
      <DonationPaymentDialog
        open={donationQrOpen}
        onClose={() => setDonationQrOpen(false)}
        config={appConfig}
      />
    </Box>
  );
};

// Wrap DashboardLayout with LanguageProvider for admin mode
const DashboardLayoutWithLanguage = () => (
  <LanguageProvider mode="admin">
    <DashboardLayout />
    <LanguageSelectionDialog />
  </LanguageProvider>
);

export default DashboardLayoutWithLanguage;
