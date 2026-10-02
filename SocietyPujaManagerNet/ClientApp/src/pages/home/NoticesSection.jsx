import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Fade,
  Skeleton,
  Dialog,
  IconButton,
  Button,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import { brand, surface, text, overlay, border, gradient, status } from '../../theme/colorTokens';
import {
  Notifications as NotifIcon,
  PriorityHigh as UrgentIcon,
  Info as InfoIcon,
  Campaign as GeneralIcon,
  Close as CloseIcon,
  ZoomIn as ZoomIcon,
  Drafts as ReadIcon,
  MailOutlined as UnreadIcon,
  Share as ShareIcon,
  ArrowBack as ArrowBackIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { getNotifications } from '../../services/publicDataService';
import { getMasterConfig } from '../../services/masterConfigService';
import { formatShortDate } from '../../utils/dateUtils';

const LS_KEY = 'notificationReadState';

const getReadState = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch (e) {
    return {};
  }
};

const saveReadState = (state) => {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event('notificationsReadStateChanged'));
};

const renderMessageWithLinks = (text, navigate, onCloseDialog) => {
  if (!text) return '';
  const regex = /(My Flat|DPC Team|Cultural tab|(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}|\b\d{10}\b)/gi;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (!part) return part;
    const partLower = part.toLowerCase();

    // Check if the part is a mobile number
    const isMobile = /^(?:\+91[-\s]?)?[6-9]\d{4}[-\s]?\d{5}$|^\d{10}$/.test(part);
    if (isMobile) {
      // Avoid formatting as a phone number if preceded by an account keyword
      const prevPart = i > 0 ? parts[i - 1].toLowerCase() : '';
      const isAccount = /(?:a\/c|account|acct|acc|ac|ifsc)\s*(?:no\.?|number)?\s*[:\-]?\s*$/i.test(prevPart);
      
      if (isAccount) {
        return <strong key={i}>{part}</strong>;
      }

      const cleanNumber = part.replace(/[^\d+]/g, '');
      return (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', verticalAlign: 'middle' }}>
          <strong>{part}</strong>
          <Tooltip title={`Call ${part}`}>
            <IconButton
              component="a"
              href={`tel:${cleanNumber}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(102,187,106,0.1)',
                color: status.success.main(true),
                width: 24,
                height: 24,
                '&:hover': {
                  backgroundColor: 'rgba(102,187,106,0.2)',
                },
              }}
            >
              <PhoneIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </span>
      );
    }

    if (partLower === 'my flat') {
      return (
        <span
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            if (onCloseDialog) onCloseDialog();
            navigate('/my-flat');
          }}
          style={{
            color: brand.orange,
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
            color: brand.orange,
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
            color: brand.orange,
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

const priorityConfig = {
  urgent: { color: status.error.main(true), bgColor: 'rgba(239,83,80,0.1)', icon: <UrgentIcon />, label: 'Urgent' },
  info: { color: status.info.main(true), bgColor: 'rgba(66,165,245,0.1)', icon: <InfoIcon />, label: 'Info' },
  general: { color: status.success.main(true), bgColor: 'rgba(102,187,106,0.1)', icon: <GeneralIcon />, label: 'General' },
};

const NoticesSection = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [viewingImage, setViewingImage] = useState('');
  const [readState, setReadState] = useState(getReadState());
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    loadNotifications();
    getMasterConfig().then(setAppConfig).catch(() => {});
    const handleReadStateChange = () => {
      setReadState(getReadState());
    };
    window.addEventListener('notificationsReadStateChanged', handleReadStateChange);
    return () => {
      window.removeEventListener('notificationsReadStateChanged', handleReadStateChange);
    };
  }, []);

  useEffect(() => {
    if (!loading && notifications.length > 0 && notificationId) {
      const found = notifications.find((n) =>
        parseInt(n.serialNo, 10) === parseInt(notificationId, 10)
      );
      if (found) {
        const notifMs = getMs(found.updatedAt || found.createdAt);
        const prevReadAt = readState[found.id] || 0;
        if (prevReadAt < notifMs) {
          const updated = { ...readState, [found.id]: Date.now() };
          setReadState(updated);
          saveReadState(updated);
        }
      } else {
        enqueueSnackbar('Notification not found', { variant: 'warning' });
        navigate('/notices', { replace: true });
      }
    }
  }, [notificationId, notifications, loading]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      // Only show active notifications publicly
      setNotifications((data || []).filter((n) => n.active !== false));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const isNotifRead = (notif) => {
    const readAt = readState[notif.id] || 0;
    const notifMs = getMs(notif.updatedAt || notif.createdAt);
    return readAt >= notifMs;
  };

  const toggleReadStatus = (notif) => {
    const currentlyRead = isNotifRead(notif);
    const updated = { ...readState };
    if (currentlyRead) {
      delete updated[notif.id];
    } else {
      updated[notif.id] = Date.now();
    }
    setReadState(updated);
    saveReadState(updated);
  };

  const copyShareLink = (notif) => {
    const paddedSerial = String(notif.serialNo || '').padStart(4, '0');
    const url = `${window.location.origin}${window.location.pathname}#/notices/${paddedSerial}`;
    navigator.clipboard.writeText(url)
      .then(() => {
        enqueueSnackbar('Link copied to clipboard!', { variant: 'success' });
      })
      .catch((err) => {
        console.error('Failed to copy link: ', err);
        enqueueSnackbar('Failed to copy link', { variant: 'error' });
      });
  };

  const handleCloseDetail = () => {
    navigate('/notices');
  };

  const markAllAsRead = () => {
    const now = Date.now();
    const updated = { ...readState };
    notifications.forEach((n) => { updated[n.id] = now; });
    setReadState(updated);
    saveReadState(updated);
  };

  const getMs = (val) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const formatDate = (val) => {
    if (!val) return '';
    const d = val.seconds ? new Date(val.seconds * 1000) : new Date(val);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return formatShortDate(d, appConfig?.dateFormat);
  };

  const showEdited = (notif) => {
    if (!notif.updatedAt) return false;
    const createdMs = getMs(notif.createdAt);
    const updatedMs = getMs(notif.updatedAt);
    return (updatedMs - createdMs) > 30 * 1000;
  };

  const handleImageClick = (imageUrl) => {
    setViewingImage(imageUrl);
    setImageViewerOpen(true);
  };

  if (loading) {
    return (
      <Box>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 4, mb: 2 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      {notificationId ? (
        (() => {
          const notif = notifications.find((n) =>
            parseInt(n.serialNo, 10) === parseInt(notificationId, 10)
          );
          if (!notif) {
            return (
              <Card sx={{ textAlign: 'center', py: 6, borderRadius: '20px' }}>
                <CardContent>
                  <NotifIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" sx={{ color: 'text.primary', mb: 2 }}>
                    Notification Not Found
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/notices')}
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: brand.orange,
                      color: text.white,
                      textTransform: 'none',
                      fontWeight: 600,
                      '&:hover': { backgroundColor: brand.orangeDark }
                    }}
                  >
                    Back to Notices
                  </Button>
                </CardContent>
              </Card>
            );
          }

          const config = priorityConfig[notif.priority] || priorityConfig.general;
          const isRead = isNotifRead(notif);

          return (
            <Fade in timeout={400}>
              <Box>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/notices')}
                  sx={{
                    color: brand.orange,
                    fontWeight: 600,
                    mb: 3,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: overlay.brandLight(isDark),
                    },
                  }}
                >
                  Back to Notices
                </Button>

                <Card
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '20px',
                    backgroundColor: 'background.paper',
                    border: '1px solid rgba(255,255,255,0.06)',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: 6,
                      background: config.color,
                    },
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2)`,
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                      <Box sx={{ flex: 1, minWidth: 240 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1, lineHeight: 1.3 }}>
                          {notif.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.8 }}>
                            {formatDate(notif.createdAt)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
                          onClick={() => copyShareLink(notif)}
                          sx={{
                            borderColor: 'rgba(255,255,255,0.15)',
                            color: 'text.secondary',
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: 'rgba(255,255,255,0.3)',
                              color: 'text.primary',
                              backgroundColor: 'rgba(255,255,255,0.04)',
                            }
                          }}
                        >
                          Share
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => toggleReadStatus(notif)}
                          sx={{
                            borderColor: border.brandMedium(isDark),
                            color: brand.orange,
                            borderRadius: '8px',
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: brand.orange,
                              backgroundColor: overlay.brandLight(isDark),
                            }
                          }}
                        >
                          {isRead ? "Mark as unread" : "Mark as read"}
                        </Button>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 3, opacity: 0.1 }} />

                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.primary',
                        lineHeight: 1.8,
                        fontSize: '1rem',
                        whiteSpace: 'pre-wrap',
                        mb: notif.imageUrl ? 4 : 0,
                      }}
                    >
                      {renderMessageWithLinks(notif.message, navigate)}
                    </Typography>

                    {notif.imageUrl && (
                      <Box
                        sx={{
                          borderRadius: '16px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          maxWidth: '100%',
                          width: 'fit-content',
                          maxHeight: 600,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.005)',
                          },
                        }}
                        onClick={() => handleImageClick(notif.imageUrl)}
                      >
                        <Box
                          component="img"
                          src={notif.imageUrl}
                          alt={notif.title}
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 600,
                            objectFit: 'contain',
                            display: 'block',
                          }}
                        />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            </Fade>
          );
        })()
      ) : (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  background: gradient.brand,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <NotifIcon sx={{ color: text.white, fontSize: 16 }} />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  Notices
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
                  Important updates from {appConfig?.committeeName || 'Committee'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {notifications.filter((n) => !isNotifRead(n)).length > 0 && (
                <Button
                  size="small"
                  variant="text"
                  onClick={markAllAsRead}
                  sx={{
                    color: brand.orange,
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: overlay.brandLight(isDark),
                    },
                  }}
                >
                  Mark all as read
                </Button>
              )}
              <Chip
                label={`${notifications.filter((n) => !isNotifRead(n)).length} Unread / ${notifications.length} Total`}
                size="small"
                sx={{
                  backgroundColor: overlay.brandMedium(isDark),
                  color: brand.orange,
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>

          {notifications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <NotifIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  No notices yet. Stay tuned!
                </Typography>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif, index) => {
              const config = priorityConfig[notif.priority] || priorityConfig.general;
              const isRead = isNotifRead(notif);
              return (
                <Fade in timeout={400 + index * 150} key={notif.id}>
                  <Card
                    onClick={() => navigate(`/notices/${String(notif.serialNo || '').padStart(4, '0')}`)}
                    sx={{
                      mb: 2,
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      backgroundColor: isRead ? 'background.paper' : 'rgba(255, 143, 0, 0.02)',
                      border: isRead ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(255, 143, 0, 0.15)',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: 4,
                        background: config.color,
                        borderRadius: '4px 0 0 4px',
                      },
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: `0 4px 20px ${config.color}20`,
                      },
                    }}
                  >
                    <CardContent sx={{ pl: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                          {!isRead && (
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: brand.orange,
                                flexShrink: 0,
                                boxShadow: `0 0 8px ${brand.orange}`,
                              }}
                            />
                          )}
                          <Typography variant="subtitle1" sx={{ fontWeight: isRead ? 600 : 700, lineHeight: 1.3 }}>
                            {notif.title}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0, ml: 1 }}>
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                              fontWeight: 600,
                              fontSize: '0.7rem',
                              height: 24,
                            }}
                          />
                          <Tooltip title="Copy share link">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyShareLink(notif);
                              }}
                              sx={{
                                color: 'text.secondary',
                                padding: '4px',
                                '&:hover': {
                                  color: brand.orange,
                                  backgroundColor: overlay.brandLight(isDark),
                                },
                              }}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleReadStatus(notif);
                              }}
                              sx={{
                                color: isRead ? 'text.secondary' : brand.orange,
                                padding: '4px',
                                '&:hover': {
                                  backgroundColor: overlay.brandLight(isDark),
                                },
                              }}
                            >
                              {isRead ? <ReadIcon fontSize="small" /> : <UnreadIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          lineHeight: 1.7,
                          ml: 0,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {renderMessageWithLinks(notif.message, navigate)}
                      </Typography>

                      {notif.imageUrl && (
                        <Box
                          sx={{
                            ml: 0,
                            mt: 2,
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                            cursor: 'pointer',
                            maxWidth: 400,
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.01)',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                            },
                            '&:hover .zoom-overlay': {
                              opacity: 1,
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageClick(notif.imageUrl);
                          }}
                        >
                          <Box
                            component="img"
                            src={notif.imageUrl}
                            alt={notif.title}
                            sx={{
                              width: '100%',
                              height: 'auto',
                              maxHeight: 300,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <Box
                            className="zoom-overlay"
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'rgba(0,0,0,0.4)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s ease',
                            }}
                          >
                            <ZoomIcon sx={{ color: text.white, fontSize: 32 }} />
                          </Box>
                        </Box>
                      )}

                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          mt: 1.5,
                          display: 'block',
                          ml: 0,
                          opacity: 0.7,
                        }}
                      >
                        {formatDate(notif.updatedAt || notif.createdAt)} {notif.updatedAt ? '(Edited)' : ''}
                      </Typography>
                    </CardContent>
                  </Card>
                </Fade>
              );
            })
          )}
        </Box>
      )}

      <Dialog
        open={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        maxWidth="lg"
        slotProps={{ paper: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.95)',
            borderRadius: '16px',
            overflow: 'hidden',
          },
        } }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setImageViewerOpen(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: text.white,
              zIndex: 1,
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          {viewingImage && (
            <Box
              component="img"
              src={viewingImage}
              alt="Notification attachment"
              sx={{
                width: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default NoticesSection;
