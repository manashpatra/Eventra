import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Grid, Switch, FormControlLabel, Alert, Snackbar, IconButton, Chip, Paper, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, Menu, ListItemIcon, ListItemText } from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { getNotifications, saveNotification, deleteNotification } from '../../services/publicDataService';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getMasterConfig } from '../../services/masterConfigService';
import { formatDateTime } from '../../utils/dateUtils';
import SleekLoader from '../../components/SleekLoader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useProcessing } from '../../contexts/ProcessingContext';
import { brand, status, statusBadge, border } from '../../theme/colorTokens';

const generateFriendlyId = (title) => {
  if (!title) return '';
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special characters
    .trim()
    .replace(/[\s_]+/g, '-')     // replace spaces/underscores with hyphens
    .replace(/-+/g, '-');        // collapse multiple hyphens

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return slug ? `${slug}-${randomSuffix}` : randomSuffix;
};

const processNotifs = (notifList) => {
  const list = notifList || [];
  let maxSerial = 0;
  list.forEach((item) => {
    if (item.serialNo && Number(item.serialNo) > maxSerial) {
      maxSerial = Number(item.serialNo);
    }
  });

  const missingSerials = list
    .filter((item) => !item.serialNo)
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  missingSerials.forEach((item) => {
    maxSerial += 1;
    item.serialNo = maxSerial;
  });
  return list;
};

const PublishNotices = () => {
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Notification management state
  const [notifications, setNotifications] = useState([]);
  const [notifEditIndex, setNotifEditIndex] = useState(-1);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', priority: 'general', imageUrl: '', active: true, serialNo: '' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const handleMenuOpen = (event, notice) => {
    setAnchorEl(event.currentTarget);
    setActionNotice(notice);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setActionNotice(null);
  };

  const getMs = (val) => {
    if (!val) return 0;
    if (val.seconds) return val.seconds * 1000;
    return new Date(val).getTime() || 0;
  };

  const showEdited = (notif) => {
    if (!notif.updatedAt) return false;
    const createdMs = getMs(notif.createdAt);
    const updatedMs = getMs(notif.updatedAt);
    return (updatedMs - createdMs) > 30 * 1000;
  };

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [notifList, conf] = await Promise.all([
          getNotifications(),
          getMasterConfig()
        ]);
        setNotifications(processNotifs(notifList));
        setConfig(conf);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (notifEditIndex === -1) {
      const usedSerials = new Set(notifications.map((n) => Number(n.serialNo)).filter(Boolean));
      let next = 1;
      while (usedSerials.has(next)) next++;
      setNotifForm((prev) => ({ ...prev, serialNo: String(next) }));
    }
  }, [notifications, notifEditIndex]);



  if (loading) return <SleekLoader message="Loading Notices..." />;

  return (
    <Box>
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
          {/* Add / Edit Form */}
          <Card sx={{ mb: 3, backgroundColor: 'rgba(255,143,0,0.04)', border: '1px solid rgba(255,143,0,0.15)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                {notifEditIndex >= 0 ? `Editing Notice Number ${notifForm.serialNo || ''}` : 'Create New Notice'}
              </Typography>
              <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 2 }}>
                {(() => {
                  const isDuplicateSerial = notifEditIndex < 0 &&
                    notifForm.serialNo !== '' &&
                    notifications.some((n) => Number(n.serialNo) === Number(notifForm.serialNo));
                  return (
                    <TextField
                      fullWidth
                      label="Notice Serial No."
                      type="number"
                      value={notifForm.serialNo}
                      size="small"
                      required
                      placeholder="e.g. 5"
                      disabled={notifEditIndex >= 0}
                      error={isDuplicateSerial}
                      helperText={isDuplicateSerial ? `Notice #${notifForm.serialNo} already exists` : ''}
                      onChange={(e) => setNotifForm({ ...notifForm, serialNo: e.target.value })}
                    />
                  );
                })()}
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    label="Notice Title"
                    value={notifForm.title}
                    size="small"
                    required
                    placeholder="e.g. Anandamela Registrations Open"
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority Level</InputLabel>
                    <Select
                      value={notifForm.priority}
                      onChange={(e) => setNotifForm({ ...notifForm, priority: e.target.value })}
                      label="Priority Level"
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="info">Info</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="Image URL"
                      value={notifForm.imageUrl}
                      size="small"
                      placeholder="e.g. https://image.link/banner.jpg"
                      onChange={(e) => setNotifForm({ ...notifForm, imageUrl: e.target.value })}
                      disabled={uploadingImage}
                    />
                    <Button
                      component="label"
                      variant="outlined"
                      sx={{ minWidth: 'auto', px: 2 }}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? '...' : <UploadIcon fontSize="small" />}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setUploadingImage(true);
                            try {
                              const url = await uploadFile(`notifications/${uuidv4()}_${file.name}`, file);
                              setNotifForm((prev) => ({ ...prev, imageUrl: url }));
                              setSnackbar({ open: true, message: 'Image uploaded successfully!', severity: 'success' });
                            } catch (error) {
                              console.error('Error uploading image:', error);
                              setSnackbar({ open: true, message: 'Failed to upload image.', severity: 'error' });
                            } finally {
                              setUploadingImage(false);
                            }
                          }
                        }}
                      />
                    </Button>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifForm.active !== false}
                        onChange={(e) => setNotifForm({ ...notifForm, active: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Active Status</Typography>}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    label="Notice Message"
                    value={notifForm.message}
                    size="small"
                    required
                    multiline
                    minRows={12}
                    placeholder="Type details of the notice here..."
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    slotProps={{
                      input: {
                        style: {
                          minHeight: '300px',
                          alignItems: 'flex-start',
                          resize: 'vertical',
                          overflowY: 'auto'
                        }
                      }
                    }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
                {notifEditIndex >= 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setNotifForm({ title: '', message: '', priority: 'general', imageUrl: '', active: true, serialNo: '' });
                      setNotifEditIndex(-1);
                    }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  startIcon={notifEditIndex >= 0 ? <EditIcon /> : <AddIcon />}
                  disabled={!notifForm.title || !notifForm.message}
                  onClick={async () => {
                    // Duplicate serial check on save
                    if (notifEditIndex < 0 && notifForm.serialNo !== '') {
                      const dup = notifications.some((n) => Number(n.serialNo) === Number(notifForm.serialNo));
                      if (dup) {
                        setSnackbar({ open: true, message: `Notice #${notifForm.serialNo} already exists. Choose a different serial number.`, severity: 'error' });
                        return;
                      }
                    }
                    startProcessing('Saving notice...');
                    try {
                      let maxSerial = 0;
                      notifications.forEach((item) => {
                        if (item.serialNo && Number(item.serialNo) > maxSerial) {
                          maxSerial = Number(item.serialNo);
                        }
                      });

                      const newNotif = {
                        ...notifForm,
                        id: notifEditIndex >= 0 ? notifications[notifEditIndex].id : generateFriendlyId(notifForm.title),
                        serialNo: Number(notifForm.serialNo) || (maxSerial + 1),
                        createdAt: notifEditIndex >= 0 ? notifications[notifEditIndex].createdAt : new Date().toISOString(),
                        updatedAt: notifEditIndex >= 0 ? new Date().toISOString() : undefined,
                      };

                      const saved = await saveNotification(newNotif);
                      const list = [...notifications];
                      if (notifEditIndex >= 0) {
                        list[notifEditIndex] = saved;
                      } else {
                        list.unshift(saved);
                      }
                      setNotifications(list);
                      setNotifForm({ title: '', message: '', priority: 'general', imageUrl: '', active: true, serialNo: '' });
                      setNotifEditIndex(-1);
                      setSnackbar({ open: true, message: `Notice "${saved.title}" saved successfully!`, severity: 'success' });
                      window.dispatchEvent(new Event('notificationsChanged'));
                    } catch (error) {
                      console.error('Error saving notice:', error);
                      setSnackbar({ open: true, message: 'Failed to save notice', severity: 'error' });
                    } finally {
                      stopProcessing();
                    }
                  }}
                >
                  {notifEditIndex >= 0 ? 'Update' : 'Post'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 800, md: 1000 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Message Summary</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography sx={{ color: 'text.secondary' }}>No active notices published. Add one above.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.map((notif, idx) => (
                    <TableRow key={notif.id} sx={{ backgroundColor: notifEditIndex === idx ? 'rgba(255,143,0,0.06)' : 'transparent' }}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={notif.priority}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                textTransform: 'uppercase',
                                backgroundColor: notif.priority === 'urgent' ? statusBadge.error.bg : notif.priority === 'info' ? statusBadge.info.bg : statusBadge.success.bg,
                                color: notif.priority === 'urgent' ? statusBadge.error.text : notif.priority === 'info' ? statusBadge.info.text : statusBadge.success.text,
                                height: 20,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: brand.orange, fontWeight: 600, fontSize: '0.75rem' }}>
                              • NOTICE ID: {String(notif.serialNo || '').padStart(4, '0')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              • {formatDateTime(notif.updatedAt || notif.createdAt, config?.dateFormat)}{showEdited(notif) && ' (edited)'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{notif.title}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Switch
                            size="small"
                            checked={notif.active !== false}
                            onChange={async (e) => {
                              try {
                                const updatedNotif = { ...notif, active: e.target.checked };
                                await saveNotification(updatedNotif);
                                const list = [...notifications];
                                list[idx] = updatedNotif;
                                setNotifications(list);
                                setSnackbar({ open: true, message: `Notice status updated!`, severity: 'success' });
                                window.dispatchEvent(new Event('notificationsChanged'));
                              } catch (err) {
                                console.error(err);
                                setSnackbar({ open: true, message: `Failed to update status.`, severity: 'error' });
                              }
                            }}
                          />
                          <Chip
                            label={notif.active !== false ? "Active" : "Inactive"}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              backgroundColor: (theme) => notif.active !== false ? statusBadge.success.bg : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                              color: notif.active !== false ? statusBadge.success.text : 'text.secondary',
                              height: 20,
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem', maxWidth: 300, whiteSpace: 'pre-wrap' }}>
                        {notif.message.length > 120 ? `${notif.message.substring(0, 120)}...` : notif.message}
                      </TableCell>
                      <TableCell>
                        {notif.imageUrl ? (
                          <Box
                            component="img"
                            src={notif.imageUrl}
                            sx={{ width: 48, height: 32, borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        ) : (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>None</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>

                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => {
                              setNotifForm({
                                title: notif.title,
                                message: notif.message,
                                priority: notif.priority || 'general',
                                imageUrl: notif.imageUrl || '',
                                active: notif.active !== false,
                                serialNo: notif.serialNo || '',
                              });
                              setNotifEditIndex(idx);
                            }} sx={{ color: (theme) => status.warning.main(theme.palette.mode === 'dark') }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="More Actions">
                            <IconButton size="small" onClick={(e) => handleMenuOpen(e, notif)}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        disableRestoreFocus
        disableScrollLock
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          const paddedSerial = String(actionNotice?.serialNo || '').padStart(4, '0');
          const url = `${window.location.origin}${window.location.pathname}#/notices/${paddedSerial}`;
          navigator.clipboard.writeText(url)
            .then(() => {
              setSnackbar({ open: true, message: `Link for Notice #${paddedSerial} copied!`, severity: 'success' });
            })
            .catch(() => {
              setSnackbar({ open: true, message: 'Failed to copy link', severity: 'error' });
            });
        }}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Share Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          document.activeElement?.blur();
          setTimeout(() => {
            setConfirmDialog({
              open: true,
              title: 'Delete Notice',
              message: `Are you sure you want to delete "${actionNotice?.title}"?`,
              onConfirm: async () => {
              startProcessing('Deleting notice...');
              try {
                await deleteNotification(actionNotice?.id);
                const list = notifications.filter(n => n.id !== actionNotice?.id);
                setNotifications(list);
                if (notifications[notifEditIndex]?.id === actionNotice?.id) {
                  setNotifEditIndex(-1);
                  setNotifForm({ title: '', message: '', priority: 'general', imageUrl: '', active: true, serialNo: '' });
                }
                setSnackbar({ open: true, message: 'Notice deleted.', severity: 'success' });
                window.dispatchEvent(new Event('notificationsChanged'));
              } catch (err) {
                console.error(err);
                setSnackbar({ open: true, message: 'Failed to delete notice.', severity: 'error' });
              } finally {
                stopProcessing();
                setConfirmDialog({ open: false, title: '', message: '', onConfirm: null });
              }
            }
          });
          }, 0);
        }}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark') }} /></ListItemIcon>
          <ListItemText>Delete Notice</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />
    </Box>
  );
};

export default PublishNotices;
