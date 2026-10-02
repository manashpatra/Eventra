import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Link,
  Badge,
  Tooltip,
  IconButton,
  Snackbar,
  Button,
  Paper,
  Slide,
} from '@mui/material';
import {
  Home as HomeIcon,
  Fastfood as FastfoodIcon,
  Notifications as NotifIcon,
  Groups as GroupsIcon,
  Feedback as FeedbackIcon,
  Assessment as ReportIcon,
  ContactPhone as ContactIcon,
  Event as EventIcon,
  NotificationsActive as NotificationsActiveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import FlatSelectionDialog, { getSelectedFlat } from '../components/FlatSelectionDialog';
import BannerSlot from '../components/BannerSlot';
import { getNotifications } from '../services/publicDataService';
import { getMasterConfig } from '../services/masterConfigService';

import InstallPrompt from '../components/InstallPrompt';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import LanguageSelectionDialog from '../components/LanguageSelectionDialog';
import { LanguageProvider } from '../contexts/LanguageContext';
import packageJson from '../../package.json';
import { useAuth } from '../contexts/AuthContext';
import { brand, surface, overlay, gradient, border, ticker } from '../theme/colorTokens';

const TransitionDown = (props) => {
  return <Slide {...props} direction="down" />;
};

const getReadNotifIds = () => {
  try {
    return JSON.parse(localStorage.getItem('readNotificationIds') || '[]');
  } catch (e) {
    return [];
  }
};

const renderMessageWithLinks = (text, navigate, onCloseDialog) => {
  if (!text) return '';
  const regex = /(My Flat|DPC Team|Cultural tab)/gi;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const partLower = part.toLowerCase();
    if (partLower === 'my flat') {
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onCloseDialog) onCloseDialog();
            navigate('/home');
          }}
          style={{
            color: '#FF8F00',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {part}
        </span>
      );
    } else if (partLower === 'dpc team') {
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onCloseDialog) onCloseDialog();
            navigate('/dpc');
          }}
          style={{
            color: '#FF8F00',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {part}
        </span>
      );
    } else if (partLower === 'cultural tab') {
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onCloseDialog) onCloseDialog();
            navigate('/cultural');
          }}
          style={{
            color: '#FF8F00',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

const tabConfig = [
  { label: 'Home', icon: <HomeIcon />, path: 'home', aliases: ['my-flat', 'myflat'] },
  { label: 'My Food ', icon: <FastfoodIcon />, path: 'my-food', aliases: ['myfood'] },
  { label: 'Notices', icon: <NotifIcon />, path: 'notices', aliases: ['notifications'] },
  { label: 'Cultural', icon: <EventIcon />, path: 'cultural', aliases: ['events'] },
  { label: 'DPC', icon: <GroupsIcon />, path: 'dpc' },
  { label: 'Society', icon: <ContactIcon />, path: 'society' },
  { label: 'Feedback', icon: <FeedbackIcon />, path: 'feedback' },
  { label: 'Reports', icon: <ReportIcon />, path: 'reports' },
];

const HomeLayout = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [flatDialogOpen, setFlatDialogOpen] = useState(false);
  const [selectedFlat, setSelectedFlatState] = useState(getSelectedFlat());
  const [urgentAnnouncements, setUrgentAnnouncements] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appConfig, setAppConfig] = useState(null);
  
  // Get active tab index from url path
  const segments = location.pathname.split('/').filter(Boolean);
  const matchedIdx = tabConfig.findIndex((t) =>
    segments.includes(t.path) || (t.aliases && t.aliases.some((a) => segments.includes(a)))
  );
  const activeTab = matchedIdx >= 0 ? matchedIdx : 0;

  const hasFlatInPath = location.pathname.startsWith('/my-flat/') || location.pathname.startsWith('/myflat/');

  useEffect(() => {
    if (hasFlatInPath) {
      setFlatDialogOpen(false);
    }
  }, [hasFlatInPath]);

  useEffect(() => {
    loadUrgentAnnouncements();
    getMasterConfig().then(setAppConfig).catch(() => {});
    const handleFlatChange = () => {
      const flat = getSelectedFlat();
      setSelectedFlatState(flat);
      if (flat) {
        setFlatDialogOpen(false);
      }
    };

    const handleNotificationsUpdate = () => {
      loadUrgentAnnouncements();
    };

    // Auto-open selection dialog on first load if no flat is selected and not viewing a specific notification or identifying flat from route
    const flat = getSelectedFlat();
    const hasNotificationId = window.location.hash.includes('/notices/') && 
                              window.location.hash.split('/').pop() !== 'notices';
    const hasFlatInRoute = (window.location.hash.includes('/my-flat/') && window.location.hash.split('/my-flat/')[1]) ||
                           (window.location.hash.includes('/myflat/') && window.location.hash.split('/myflat/')[1]) ||
                           (window.location.hash.includes('/home/') && window.location.hash.split('/home/')[1]);
    if (!flat && !hasNotificationId && !hasFlatInRoute) {
      setFlatDialogOpen(true);
    }

    const handleKeyDown = (event) => {
      // Shortcut to access login page: Alt + L or Ctrl + Shift + L
      if ((event.altKey && event.key.toLowerCase() === 'l') ||
        (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'l')) {
        event.preventDefault();
        navigate('/login');
      }
    };

    window.addEventListener('flatSelectionChanged', handleFlatChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('notificationsReadStateChanged', handleNotificationsUpdate);
    window.addEventListener('notificationsChanged', handleNotificationsUpdate);
    return () => {
      window.removeEventListener('flatSelectionChanged', handleFlatChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('notificationsReadStateChanged', handleNotificationsUpdate);
      window.removeEventListener('notificationsChanged', handleNotificationsUpdate);
    };
  }, [navigate]);

  const loadUrgentAnnouncements = async () => {
    try {
      const data = await getNotifications();
      const activeNotifs = (data || []).filter((n) => n.active !== false);
      const urgentList = activeNotifs.filter((n) => n.priority === 'urgent');

      if (urgentList.length > 0) {
        setUrgentAnnouncements(urgentList);
      } else if (activeNotifs.length > 0) {
        setUrgentAnnouncements(activeNotifs);
      } else {
        setUrgentAnnouncements([
          {
            id: 'welcome-default',
            title: `🌸 Welcome to ${appConfig?.societyName || 'Urban Greens'} Durga Puja Celebrations 2026-27! Wishing everyone a blessed festival! 🙏`,
            serialNo: 1,
            isDefault: true,
          }
        ]);
      }

      const readIds = getReadNotifIds();
      const unread = activeNotifs.filter((n) => !readIds.includes(n.id));
      setUnreadCount(unread.length);
    } catch (e) {
      console.warn('Could not load announcements for ticker:', e);
      setUrgentAnnouncements([
        {
          id: 'welcome-default',
          title: `🌸 Welcome to ${appConfig?.societyName || 'Urban Greens'} Durga Puja Celebrations 2026-27! Wishing everyone a blessed festival! 🙏`,
          serialNo: 1,
          isDefault: true,
        }
      ]);
    }
  };

  const handleTabChange = (_, newValue) => {
    navigate('/' + tabConfig[newValue].path);
  };

  const handleFlatSelected = (flat) => {
    setSelectedFlatState(flat);
    window.dispatchEvent(new Event('flatSelectionChanged'));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Top AppBar */}
      <AppBar
        position="sticky"
        sx={{
          backgroundColor: isDark ? 'rgba(10, 14, 26, 0.85)' : 'rgba(255, 255, 255, 0.88)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark ? 'none' : `0 1px 3px ${overlay.shadowXXLight}`,
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {/* Logo */}
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              flexShrink: 0,
              cursor: 'pointer',
            }}
            onClick={(e) => {
              if (e.detail === 3) {
                navigate('/login');
              } else {
                navigate('/home');
              }
            }}
          >
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </Box>
          <Box sx={{ cursor: 'pointer', flexShrink: 0, display: { xs: 'none', sm: 'block' } }} onClick={(e) => {
            if (e.detail === 3) {
              navigate('/login');
            } else {
              navigate('/home');
            }
          }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                background: 'linear-gradient(135deg, #FFB300, #FF8F00)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}
            >
              {appConfig?.societyName?.toUpperCase() || 'HOME'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.65rem',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              {appConfig?.committeeName || ''} {appConfig?.year || ''}
            </Typography>
          </Box>

          {/* Install PWA Prompt removed from header */}

          {/* Urgent / Festive Notice Ticker inside AppBar */}
          {urgentAnnouncements.length > 0 && (() => {
            const hasUrgent = urgentAnnouncements.some((n) => n.priority === 'urgent');
            return (
              <Box
                sx={{
                  flex: 1,
                  ml: { xs: 1, sm: 3 },
                  mr: { xs: 1, sm: 2 },
                  height: 32,
                  backgroundColor: hasUrgent
                    ? (isDark ? '#FFEBEE' : '#FEE2E2')
                    : (isDark ? 'rgba(255,143,0,0.1)' : '#FFF7ED'),
                  border: hasUrgent
                    ? (isDark ? '1px solid #EF5350' : '1px solid #F87171')
                    : (isDark ? '1px solid rgba(255,143,0,0.3)' : '1px solid rgba(230,81,0,0.35)'),
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  '&:hover .ticker-scroll': {
                    animationPlayState: 'paused',
                  }
                }}
              >
                {/* Tag */}
                <Box
                  sx={{
                    backgroundColor: hasUrgent ? '#EF5350' : (isDark ? '#FF8F00' : '#E65100'),
                    bgcolor: hasUrgent ? '#EF5350' : (isDark ? '#FF8F00' : '#E65100'),
                    color: '#FFFFFF',
                    px: 1.5,
                    height: '100%',
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    fontWeight: 800,
                    fontSize: '0.65rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderTopLeftRadius: '20px',
                    borderBottomLeftRadius: '20px',
                    boxShadow: '2px 0 6px rgba(0,0,0,0.2)',
                    zIndex: 2,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {hasUrgent ? 'Notice' : 'Update'}
                </Box>

                {/* Scrolling Text Container */}
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    className="ticker-scroll"
                    sx={{
                      display: 'inline-block',
                      pl: '100%',
                      animation: 'tickerAnimationAppbar 25s linear infinite',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: hasUrgent
                        ? (isDark ? '#EF5350' : '#B91C1C')
                        : (isDark ? '#FFB300' : '#7C2D12'),
                      cursor: 'pointer',
                      '&:hover': {
                        animationPlayState: 'paused',
                      },
                      '@keyframes tickerAnimationAppbar': {
                        '0%': { transform: 'translate3d(0, 0, 0)' },
                        '100%': { transform: 'translate3d(-100%, 0, 0)' },
                      },
                    }}
                  >
                    {urgentAnnouncements.map((n, i) => (
                      <span
                        key={i}
                        onClick={() => {
                          if (n.isDefault) {
                            navigate('/notices');
                          } else {
                            navigate(`/notices/${String(n.serialNo || '').padStart(4, '0')}`);
                          }
                        }}
                        style={{
                          marginRight: '48px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = hasUrgent
                            ? 'rgba(239, 83, 80, 0.12)'
                            : (isDark ? 'rgba(255, 143, 0, 0.15)' : 'rgba(230, 81, 0, 0.12)');
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <strong>{n.title}</strong>
                      </span>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })()}

          {/* Spacer if no ticker */}
          {urgentAnnouncements.length === 0 && <Box sx={{ flexGrow: 1 }} />}

          {/* Theme Toggle & Language Switcher — Right Aligned */}
          <Box sx={{ ml: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ThemeToggle />
            <LanguageSwitcher />
          </Box>

        </Toolbar>

        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            minHeight: 44,
            '& .MuiTabs-indicator': {
              background: gradient.brandHorizontal,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
            '& .MuiTab-root': {
              minHeight: 44,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'text.secondary',
              py: 1,
              '&.Mui-selected': {
                color: isDark ? brand.orange : brand.orangeDark,
                fontWeight: 600,
              },
            },
          }}
        >
          {tabConfig.map((tab, index) => {
            let iconElement = tab.icon;
            if (tab.path === 'notifications' && unreadCount > 0) {
              iconElement = (
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: 16,
                      minWidth: 16,
                      padding: '0 4px',
                    }
                  }}
                >
                  {tab.icon}
                </Badge>
              );
            }
            if (isMobile) {
              return (
                <Tooltip title={tab.label} key={index} enterTouchDelay={50}>
                  <Tab
                    label={null}
                    icon={iconElement}
                    iconPosition="top"
                    sx={{
                      minWidth: 48,
                      '& .MuiSvgIcon-root': { fontSize: 18, mr: 0 },
                      px: 1,
                    }}
                  />
                </Tooltip>
              );
            }
            return (
              <Tab
                key={index}
                label={tab.label}
                icon={iconElement}
                iconPosition="start"
                sx={{
                  minWidth: 'auto',
                  '& .MuiSvgIcon-root': { fontSize: 18, mr: 0.5 },
                  px: 2,
                }}
              />
            );
          })}
        </Tabs>
      </AppBar>

      {/* Page Content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 1.25, sm: 3 },
          maxWidth: 1200,
          mx: 'auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Box>

      {/* Banner Ad — Footer */}
      <BannerSlot slot="footer" />

      {/* Footer */}
      <Box
        sx={{
          textAlign: 'center',
          py: 2,
          px: 2,
          borderTop: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
        }}
      >
        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: isDark ? 0.7 : 0.9, display: 'block', lineHeight: 1.6 }}>
          v{packageJson.version} <Box component="span" sx={{ mx: 0.5 }}>•</Box> ©{' '}
          <Link
            component={RouterLink}
            to="/dpc"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' },
            }}
          >
            <Box component="span" className="notranslate">
              {appConfig?.year || ''} {appConfig?.committeeName || 'Committee'}
            </Box>
          </Link>{' '}
          <Link
            component={RouterLink}
            to="/login"
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <Box component="span" className="notranslate">Admin</Box>
          </Link>
          <Box component="span" sx={{ display: { xs: 'block', sm: 'inline' } }}>
            •{' '}Developed & Maintained by{' '}
            <Link
              href="https://www.linkedin.com/in/imvkumar/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                color: '#FFB300',
                textDecoration: 'none',
                fontWeight: 'bold',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Vivek Kumar
            </Link>
          </Box>
        </Typography>
      </Box>

      {/* Flat Selection Dialog */}
      <FlatSelectionDialog
        open={flatDialogOpen}
        onClose={() => setFlatDialogOpen(false)}
        onSelect={handleFlatSelected}
        allowClose={true}
      />

      {/* Floating Install Prompt for Public Pages */}
      <InstallPrompt variant="floating" />

      {/* Language Selection Dialog — first visit only */}
      <LanguageSelectionDialog />

    </Box>
  );
};

// Wrap HomeLayout with LanguageProvider for public mode
const HomeLayoutWithLanguage = () => (
  <LanguageProvider mode="public">
    <HomeLayout />
  </LanguageProvider>
);

export default HomeLayoutWithLanguage;
