import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Grid, Switch, FormControlLabel, IconButton, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Slider, Tooltip, Alert, Snackbar, CircularProgress, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Campaign as CampaignIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  Visibility as PreviewIcon,
  Link as LinkIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import {
  getAllBannerAds,
  saveBannerAd,
  deleteBannerAd,
  compressBannerImage,
  SLOT_DIMENSIONS,
} from '../../services/bannerAdService';
import { getMasterConfig } from '../../services/masterConfigService';
import { getLocalISODate, formatShortDate, getDatePickerFormat } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { brand, surface, text, statusBadge } from '../../theme/colorTokens';

const EMPTY_FORM = {
  title: '',
  imageData: '',
  imageUrl: '',
  backgroundColor: surface.adDark,
  imageSource: 'upload',
  linkUrl: '',
  slot: 'hero-bottom',
  startDate: '',
  endDate: '',
  active: true,
  priority: 1,
  displayDurationSec: 5,
  overlayText: '',
  overlaySubText: '',
  overlayPosition: 'center',
  overlayColor: text.white,
  overlayBgColor: '',
  overlayFontSize: 'medium',
  overlayFontFamily: 'inherit',
  overlayFontWeight: '800',
  overlayHasShadow: true,
  overlaySubTextPosition: 'center',
  overlaySubTextColor: text.white,
  overlaySubTextBgColor: '',
  overlaySubTextFontSize: 'medium',
  overlaySubTextFontFamily: 'inherit',
  overlaySubTextFontWeight: '500',
  overlaySubTextHasShadow: true,
};

const getAdStatus = (ad) => {
  if (!ad.active) return { label: 'Inactive', color: statusBadge.inactive.text, bg: statusBadge.inactive.bg };
  const now = new Date();
  const start = ad.startDate ? new Date(ad.startDate) : null;
  const end = ad.endDate ? new Date(ad.endDate) : null;
  if (end && now > end) return { label: 'Expired', color: statusBadge.error.text, bg: statusBadge.error.bg };
  if (start && now < start) return { label: 'Scheduled', color: statusBadge.warning.text, bg: statusBadge.warning.bg };
  return { label: 'Live', color: statusBadge.success.text, bg: statusBadge.success.bg };
};



const BannerAds = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const [banners, setBanners] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [previewAd, setPreviewAd] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadBanners();
    getMasterConfig().then(setConfig).catch(() => {});
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllBannerAds();
      // Sort: Live first, then Scheduled, then Inactive, then Expired
      const statusOrder = { Live: 0, Scheduled: 1, Inactive: 2, Expired: 3 };
      data.sort((a, b) => {
        const sa = getAdStatus(a);
        const sb = getAdStatus(b);
        return (statusOrder[sa.label] || 9) - (statusOrder[sb.label] || 9);
      });
      setBanners(data);
    } catch (err) {
      console.error('Error loading banners:', err);
      showSnackbar('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const handleOpenEdit = (ad) => {
    setEditingId(ad.id);
    const hasUrl = ad.imageUrl && !ad.imageData;
    const hasColor = ad.backgroundColor && !ad.imageUrl && !ad.imageData;
    setForm({
      title: ad.title || '',
      imageData: ad.imageData || '',
      imageUrl: ad.imageUrl || '',
      backgroundColor: ad.backgroundColor || surface.adDark,
      imageSource: hasColor ? 'color' : (hasUrl ? 'url' : 'upload'),
      linkUrl: ad.linkUrl || '',
      slot: ad.slot || 'hero-bottom',
      startDate: ad.startDate ? ad.startDate.substring(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.substring(0, 10) : '',
      active: ad.active !== false,
      priority: ad.priority || 1,
      displayDurationSec: ad.displayDurationSec || 5,
      overlayText: ad.overlayText || '',
      overlaySubText: ad.overlaySubText || '',
      overlayPosition: ad.overlayPosition || 'center',
      overlayColor: ad.overlayColor || text.white,
      overlayBgColor: ad.overlayBgColor || '',
      overlayFontSize: ad.overlayFontSize || 'medium',
      overlayFontFamily: ad.overlayFontFamily || 'inherit',
      overlayFontWeight: ad.overlayFontWeight || '800',
      overlayHasShadow: ad.overlayHasShadow !== false,
      overlaySubTextPosition: ad.overlaySubTextPosition || 'center',
      overlaySubTextColor: ad.overlaySubTextColor || text.white,
      overlaySubTextBgColor: ad.overlaySubTextBgColor || '',
      overlaySubTextFontSize: ad.overlaySubTextFontSize || 'medium',
      overlaySubTextFontFamily: ad.overlaySubTextFontFamily || 'inherit',
      overlaySubTextFontWeight: ad.overlaySubTextFontWeight || '500',
      overlaySubTextHasShadow: ad.overlaySubTextHasShadow !== false,
    });
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar('Image must be under 5MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const dims = SLOT_DIMENSIONS[form.slot] || { width: 1920, height: 240 };
      const base64 = await compressBannerImage(file, dims.width);
      setForm((prev) => ({ ...prev, imageData: base64 }));
      showSnackbar('Image uploaded successfully');
    } catch (err) {
      console.error('Image upload error:', err);
      showSnackbar('Failed to process image', 'error');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showSnackbar('Title is required', 'error');
      return;
    }
    const hasImage = form.imageSource === 'url' ? form.imageUrl.trim() : (form.imageSource === 'color' ? form.backgroundColor : form.imageData);
    if (!hasImage && !form.overlayText.trim()) {
      showSnackbar('Please provide either an image or overlay text', 'error');
      return;
    }
    if (!form.startDate || !form.endDate) {
      showSnackbar('Start and End dates are required', 'error');
      return;
    }
    if (new Date(form.endDate) <= new Date(form.startDate)) {
      showSnackbar('End date must be after start date', 'error');
      return;
    }

    setSaving(true);
    try {
      const adData = {
        ...(editingId ? { id: editingId } : {}),
        title: form.title.trim(),
        imageData: form.imageSource === 'upload' ? form.imageData : '',
        imageUrl: form.imageSource === 'url' ? form.imageUrl.trim() : '',
        backgroundColor: form.imageSource === 'color' ? form.backgroundColor : '',
        linkUrl: form.linkUrl.trim(),
        slot: form.slot,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate + 'T23:59:59').toISOString(),
        active: form.active,
        priority: Number(form.priority) || 1,
        displayDurationSec: Number(form.displayDurationSec) || 5,
        overlayText: form.overlayText?.trim() || '',
        overlaySubText: form.overlaySubText?.trim() || '',
        overlayPosition: form.overlayPosition || 'center',
        overlayColor: form.overlayColor || text.white,
        overlayBgColor: form.overlayBgColor || '',
        overlayFontSize: form.overlayFontSize || 'medium',
        overlayFontFamily: form.overlayFontFamily || 'inherit',
        overlayFontWeight: form.overlayFontWeight || '800',
        overlayHasShadow: form.overlayHasShadow,
        overlaySubTextPosition: form.overlaySubTextPosition || 'center',
        overlaySubTextColor: form.overlaySubTextColor || text.white,
        overlaySubTextBgColor: form.overlaySubTextBgColor || '',
        overlaySubTextFontSize: form.overlaySubTextFontSize || 'medium',
        overlaySubTextFontFamily: form.overlaySubTextFontFamily || 'inherit',
        overlaySubTextFontWeight: form.overlaySubTextFontWeight || '500',
        overlaySubTextHasShadow: form.overlaySubTextHasShadow,
        createdBy: user?.email || 'admin',
      };

      if (editingId) {
        // preserve original createdAt
        const existing = banners.find((b) => b.id === editingId);
        if (existing?.createdAt) adData.createdAt = existing.createdAt;
      }

      await saveBannerAd(adData);
      showSnackbar(editingId ? 'Banner updated' : 'Banner created');
      handleClose();
      await loadBanners();
    } catch (err) {
      console.error('Save banner error:', err);
      showSnackbar('Failed to save banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteBannerAd(id);
      showSnackbar('Banner deleted');
      setDeleteConfirm(null);
      await loadBanners();
    } catch (err) {
      console.error('Delete banner error:', err);
      showSnackbar('Failed to delete banner', 'error');
    }
  };

  const slotLabel = (slotKey) => SLOT_DIMENSIONS[slotKey]?.label || slotKey;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CampaignIcon sx={{ color: brand.orange, fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Banner Ads</Typography>
          <Chip
            label={`${banners.filter((b) => getAdStatus(b).label === 'Live').length} Live`}
            size="small"
            sx={{
              fontWeight: 700,
              backgroundColor: statusBadge.success.bg,
              color: statusBadge.success.text,
              border: `1px solid ${statusBadge.success.text}40`,
            }}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: '12px', fontWeight: 600 }}
        >
          Banner
        </Button>
      </Box>

      {/* Banners Table */}
      <Card>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: brand.orange }} />
            </Box>
          ) : banners.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CampaignIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No banner ads yet. Create your first one!
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: 60 }}>Preview</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Slot</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Date Range</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Rotate</TableCell>
                    <TableCell sx={{ fontWeight: 700, display: { xs: 'none', md: 'table-cell' } }}>Priority</TableCell>
                    <TableCell sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80, fontWeight: 700 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {banners.map((ad) => {
                    const status = getAdStatus(ad);
                    return (
                      <TableRow key={ad.id} sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell>
                          {ad.imageData ? (
                            <Box
                              component="img"
                              src={ad.imageData}
                              alt={ad.title}
                              onClick={() => setPreviewAd(ad)}
                              sx={{
                                width: 56,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                              }}
                            />
                          ) : ad.imageUrl ? (
                            <Box
                              component="img"
                              src={ad.imageUrl}
                              alt={ad.title}
                              onClick={() => setPreviewAd(ad)}
                              sx={{
                                width: 56,
                                height: 32,
                                objectFit: 'contain',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                backgroundColor: 'rgba(255,255,255,0.03)',
                              }}
                            />
                          ) : ad.backgroundColor ? (
                            <Box
                              onClick={() => setPreviewAd(ad)}
                              sx={{
                                width: 56,
                                height: 32,
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                backgroundColor: ad.backgroundColor,
                              }}
                            />
                          ) : (
                            <ImageIcon sx={{ color: 'text.secondary', opacity: 0.3 }} />
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            {ad.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={slotLabel(ad.slot).split('(')[0].trim()}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: statusBadge.info.bg,
                              color: statusBadge.info.text,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              backgroundColor: status.bg,
                              color: status.color,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatShortDate(ad.startDate, config?.dateFormat)} — {formatShortDate(ad.endDate, config?.dateFormat)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {ad.displayDurationSec || 5}s
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {ad.priority || 1}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(ad)} sx={{ color: statusBadge.info.text }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => setDeleteConfirm(ad)} sx={{ color: statusBadge.error.text }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: {
          sx: {
            borderRadius: '16px',
            backgroundColor: surface.paper(isDark),
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          },
        } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CampaignIcon sx={{ color: brand.orange }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
              {editingId ? 'Edit Banner' : 'Create Banner'}
            </Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            {/* Title */}
            <TextField
              fullWidth
              label="Banner Title"
              placeholder="e.g. Diwali Sale Banner"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />

            {/* Slot Selection */}
            <FormControl fullWidth>
              <InputLabel>Placement Slot</InputLabel>
              <Select
                value={form.slot}
                label="Placement Slot"
                onChange={(e) => setForm((p) => ({ ...p, slot: e.target.value }))}
              >
                {Object.entries(SLOT_DIMENSIONS).map(([key, val]) => (
                  <MenuItem key={key} value={key}>
                    {val.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Banner Image — Upload or URL */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Banner Image
              </Typography>

              {/* Toggle: Upload vs URL */}
              <ToggleButtonGroup
                value={form.imageSource}
                exclusive
                onChange={(e, val) => {
                  if (val !== null) setForm((p) => ({ ...p, imageSource: val }));
                }}
                fullWidth
                size="small"
                sx={{ mb: 1.5 }}
              >
                <ToggleButton value="upload" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px 0 0 10px' }}>
                  <UploadIcon sx={{ fontSize: 20, mr: 1 }} />
                  Upload Image
                </ToggleButton>
                <ToggleButton value="url" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '0' }}>
                  <LinkIcon sx={{ fontSize: 20, mr: 1 }} />
                  Image URL
                </ToggleButton>
                <ToggleButton value="color" sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '0 10px 10px 0' }}>
                  <PaletteIcon sx={{ fontSize: 20, mr: 1 }} />
                  Color
                </ToggleButton>
              </ToggleButtonGroup>

              {form.imageSource === 'upload' ? (
                /* File Upload Area */
                <>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />
                  <Box
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    sx={{
                      border: '2px dashed rgba(255,143,0,0.3)',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      cursor: uploading ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'rgba(255,143,0,0.02)',
                      '&:hover': {
                        borderColor: 'rgba(255,143,0,0.5)',
                        backgroundColor: 'rgba(255,143,0,0.05)',
                      },
                    }}
                  >
                    {uploading ? (
                      <CircularProgress size={24} sx={{ color: brand.orange }} />
                    ) : form.imageData ? (
                      <Box>
                        <Box
                          component="img"
                          src={form.imageData}
                          alt="Preview"
                          sx={{
                            maxWidth: '100%',
                            maxHeight: 160,
                            objectFit: 'contain',
                            borderRadius: '8px',
                            mb: 1,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: brand.orange, display: 'block' }}>
                          Click to replace image
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <UploadIcon sx={{ fontSize: 36, color: 'rgba(255,143,0,0.5)', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Click to upload an image
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', opacity: 0.6 }}>
                          JPG, PNG, WebP • Max 5MB • High resolution recommended
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </>
              ) : form.imageSource === 'url' ? (
                /* URL Input */
                <>
                  <TextField
                    fullWidth
                    label="Image URL"
                    placeholder="https://example.com/banner.jpg"
                    value={form.imageUrl}
                    onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                    helperText="Paste a direct link to the banner image"
                  />
                  {form.imageUrl && (
                    <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                      <Box
                        component="img"
                        src={form.imageUrl}
                        alt="URL Preview"
                        onError={(e) => { e.target.style.display = 'none'; }}
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 160,
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                        }}
                      />
                    </Box>
                  )}
                </>
              ) : (
                /* Color Picker */
                <>
                  <TextField
                    fullWidth
                    type="color"
                    label="Background Color"
                    value={form.backgroundColor || (isDark ? surface.adDark : surface.pageLight)}
                    onChange={(e) => setForm((p) => ({ ...p, backgroundColor: e.target.value }))}
                    sx={{ '& input': { p: 1, height: 50, cursor: 'pointer' } }}
                  />
                  {form.backgroundColor && (
                    <Box sx={{ mt: 1.5, textAlign: 'center' }}>
                      <Box
                        sx={{
                          width: '100%',
                          height: 160,
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)',
                          backgroundColor: form.backgroundColor,
                        }}
                      />
                    </Box>
                  )}
                </>
              )}
            </Box>

            {/* Date Range */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <DatePicker
                  label="Start Date"
                  value={form.startDate ? new Date(form.startDate + 'T00:00:00') : null}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setForm((p) => ({ ...p, startDate: getLocalISODate(newValue) }));
                    } else {
                      setForm((p) => ({ ...p, startDate: '' }));
                    }
                  }}
                  format={getDatePickerFormat(config?.dateFormat)}
                  sx={{ width: '100%' }}
                  slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true } }}
                />
              </Grid>
              <Grid size={6}>
                <DatePicker
                  label="End Date"
                  value={form.endDate ? new Date(form.endDate + 'T00:00:00') : null}
                  onChange={(newValue) => {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setForm((p) => ({ ...p, endDate: getLocalISODate(newValue) }));
                    } else {
                      setForm((p) => ({ ...p, endDate: '' }));
                    }
                  }}
                  format={getDatePickerFormat(config?.dateFormat)}
                  sx={{ width: '100%' }}
                  slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true } }}
                />
              </Grid>
            </Grid>

            {/* Display Duration */}
            <Box>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                Rotation Duration: <strong style={{ color: brand.orange }}>{form.displayDurationSec}s</strong>
                <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.6 }}>
                  (how long this banner shows before rotating to the next)
                </Typography>
              </Typography>
              <Slider
                value={form.displayDurationSec}
                onChange={(_, val) => setForm((p) => ({ ...p, displayDurationSec: val }))}
                min={3}
                max={30}
                step={1}
                marks={[
                  { value: 3, label: '3s' },
                  { value: 10, label: '10s' },
                  { value: 20, label: '20s' },
                  { value: 30, label: '30s' },
                ]}
                sx={{
                  color: brand.orange,
                  '& .MuiSlider-markLabel': { fontSize: '0.7rem', color: 'text.secondary' },
                }}
              />
            </Box>

            {/* Priority */}
            <TextField
              fullWidth
              type="number"
              label="Priority"
              helperText="Higher number = shown first in rotation order"
              value={form.priority}
              onChange={(e) => setForm((p) => ({ ...p, priority: Math.max(1, parseInt(e.target.value) || 1) }))}
              slotProps={{ htmlInput: { min: 1, max: 100 } }}
            />

            {/* Overlay Text Settings */}
            <Box sx={{ border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', p: 2, mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                Overlay Text (Image is optional if Text is provided)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Primary Text"
                    placeholder="e.g. Special Offer\nValid till Sunday"
                    value={form.overlayText}
                    onChange={(e) => setForm((p) => ({ ...p, overlayText: e.target.value }))}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={1}
                    label="Secondary Text (Optional)"
                    placeholder="e.g. Click here to know more"
                    value={form.overlaySubText}
                    onChange={(e) => setForm((p) => ({ ...p, overlaySubText: e.target.value }))}
                  />
                </Grid>
                {form.overlayText && (
                  <>
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>Primary Text Settings</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Position</InputLabel>
                        <Select
                          value={form.overlayPosition || 'center'}
                          label="Position"
                          onChange={(e) => setForm((p) => ({ ...p, overlayPosition: e.target.value }))}
                        >
                          <MenuItem value="top-left">Top Left</MenuItem>
                          <MenuItem value="top-center">Top Center</MenuItem>
                          <MenuItem value="top-right">Top Right</MenuItem>
                          <MenuItem value="center-left">Center Left</MenuItem>
                          <MenuItem value="center">Center</MenuItem>
                          <MenuItem value="center-right">Center Right</MenuItem>
                          <MenuItem value="bottom-left">Bottom Left</MenuItem>
                          <MenuItem value="bottom-center">Bottom Center</MenuItem>
                          <MenuItem value="bottom-right">Bottom Right</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Size</InputLabel>
                        <Select
                          value={form.overlayFontSize || 'medium'}
                          label="Font Size"
                          onChange={(e) => setForm((p) => ({ ...p, overlayFontSize: e.target.value }))}
                        >
                          <MenuItem value="small">Small</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="large">Large</MenuItem>
                          <MenuItem value="xl">Extra Large</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select
                          value={form.overlayFontFamily || 'inherit'}
                          label="Font Family"
                          onChange={(e) => setForm((p) => ({ ...p, overlayFontFamily: e.target.value }))}
                        >
                          <MenuItem value="inherit">Default</MenuItem>
                          <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                          <MenuItem value="'Courier New', Courier, monospace">Courier New</MenuItem>
                          <MenuItem value="Georgia, serif">Georgia</MenuItem>
                          <MenuItem value="'Times New Roman', Times, serif">Times New Roman</MenuItem>
                          <MenuItem value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</MenuItem>
                          <MenuItem value="Verdana, Geneva, sans-serif">Verdana</MenuItem>
                          <MenuItem value="'Impact', sans-serif">Impact</MenuItem>
                          <MenuItem value="'Comic Sans MS', cursive, sans-serif">Comic Sans MS</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Weight</InputLabel>
                        <Select
                          value={form.overlayFontWeight || '800'}
                          label="Font Weight"
                          onChange={(e) => setForm((p) => ({ ...p, overlayFontWeight: e.target.value }))}
                        >
                          <MenuItem value="normal">Normal (400)</MenuItem>
                          <MenuItem value="500">Medium (500)</MenuItem>
                          <MenuItem value="600">Semi Bold (600)</MenuItem>
                          <MenuItem value="bold">Bold (700)</MenuItem>
                          <MenuItem value="800">Extra Bold (800)</MenuItem>
                          <MenuItem value="900">Black (900)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="color"
                        label="Text Color"
                        value={form.overlayColor || text.white}
                        onChange={(e) => setForm((p) => ({ ...p, overlayColor: e.target.value }))}
                        sx={{ '& input': { p: 1, height: 50, cursor: 'pointer' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Background Color (rgba or hex)"
                        placeholder="rgba(0,0,0,0.5)"
                        value={form.overlayBgColor || ''}
                        onChange={(e) => setForm((p) => ({ ...p, overlayBgColor: e.target.value }))}
                        helperText="Leave blank for none"
                      />
                    </Grid>
                    <Grid size={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.overlayHasShadow}
                            onChange={(e) => setForm((p) => ({ ...p, overlayHasShadow: e.target.checked }))}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Show Text Shadow (for readability on bright images)
                          </Typography>
                        }
                      />
                    </Grid>
                  </>
                )}
                {form.overlaySubText && (
                  <>
                    <Grid size={12}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, mt: 1 }}>Secondary Text Settings</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Position</InputLabel>
                        <Select
                          value={form.overlaySubTextPosition || 'center'}
                          label="Position"
                          onChange={(e) => setForm((p) => ({ ...p, overlaySubTextPosition: e.target.value }))}
                        >
                          <MenuItem value="top-left">Top Left</MenuItem>
                          <MenuItem value="top-center">Top Center</MenuItem>
                          <MenuItem value="top-right">Top Right</MenuItem>
                          <MenuItem value="center-left">Center Left</MenuItem>
                          <MenuItem value="center">Center</MenuItem>
                          <MenuItem value="center-right">Center Right</MenuItem>
                          <MenuItem value="bottom-left">Bottom Left</MenuItem>
                          <MenuItem value="bottom-center">Bottom Center</MenuItem>
                          <MenuItem value="bottom-right">Bottom Right</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Size</InputLabel>
                        <Select
                          value={form.overlaySubTextFontSize || 'medium'}
                          label="Font Size"
                          onChange={(e) => setForm((p) => ({ ...p, overlaySubTextFontSize: e.target.value }))}
                        >
                          <MenuItem value="small">Small</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="large">Large</MenuItem>
                          <MenuItem value="xl">Extra Large</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Family</InputLabel>
                        <Select
                          value={form.overlaySubTextFontFamily || 'inherit'}
                          label="Font Family"
                          onChange={(e) => setForm((p) => ({ ...p, overlaySubTextFontFamily: e.target.value }))}
                        >
                          <MenuItem value="inherit">Default</MenuItem>
                          <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                          <MenuItem value="'Courier New', Courier, monospace">Courier New</MenuItem>
                          <MenuItem value="Georgia, serif">Georgia</MenuItem>
                          <MenuItem value="'Times New Roman', Times, serif">Times New Roman</MenuItem>
                          <MenuItem value="'Trebuchet MS', Helvetica, sans-serif">Trebuchet MS</MenuItem>
                          <MenuItem value="Verdana, Geneva, sans-serif">Verdana</MenuItem>
                          <MenuItem value="'Impact', sans-serif">Impact</MenuItem>
                          <MenuItem value="'Comic Sans MS', cursive, sans-serif">Comic Sans MS</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Font Weight</InputLabel>
                        <Select
                          value={form.overlaySubTextFontWeight || '500'}
                          label="Font Weight"
                          onChange={(e) => setForm((p) => ({ ...p, overlaySubTextFontWeight: e.target.value }))}
                        >
                          <MenuItem value="normal">Normal (400)</MenuItem>
                          <MenuItem value="500">Medium (500)</MenuItem>
                          <MenuItem value="600">Semi Bold (600)</MenuItem>
                          <MenuItem value="bold">Bold (700)</MenuItem>
                          <MenuItem value="800">Extra Bold (800)</MenuItem>
                          <MenuItem value="900">Black (900)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        type="color"
                        label="Text Color"
                        value={form.overlaySubTextColor || text.white}
                        onChange={(e) => setForm((p) => ({ ...p, overlaySubTextColor: e.target.value }))}
                        sx={{ '& input': { p: 1, height: 50, cursor: 'pointer' } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Background Color (rgba or hex)"
                        placeholder="rgba(0,0,0,0.5)"
                        value={form.overlaySubTextBgColor || ''}
                        onChange={(e) => setForm((p) => ({ ...p, overlaySubTextBgColor: e.target.value }))}
                        helperText="Leave blank for none"
                      />
                    </Grid>
                    <Grid size={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={form.overlaySubTextHasShadow}
                            onChange={(e) => setForm((p) => ({ ...p, overlaySubTextHasShadow: e.target.checked }))}
                            color="primary"
                          />
                        }
                        label={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Show Text Shadow (for readability on bright images)
                          </Typography>
                        }
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>

            {/* Link URL */}
            <TextField
              fullWidth
              label="Click-through URL (optional)"
              placeholder="https://example.com"
              value={form.linkUrl}
              onChange={(e) => setForm((p) => ({ ...p, linkUrl: e.target.value }))}
            />

            {/* Active Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {form.active ? 'Active' : 'Inactive'}
                </Typography>
              }
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: '10px', fontWeight: 600, minWidth: 100 }}
          >
            {saving ? <CircularProgress size={20} /> : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        slotProps={{ paper: {
          sx: {
            borderRadius: '14px',
            backgroundColor: surface.paper(isDark),
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          },
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Banner?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete "<strong>{deleteConfirm?.title}</strong>"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => handleDelete(deleteConfirm.id)}
            sx={{ borderRadius: '10px', fontWeight: 600 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewAd}
        onClose={() => setPreviewAd(null)}
        maxWidth="md"
        slotProps={{ paper: {
          sx: {
            borderRadius: '14px',
            backgroundColor: surface.paper(isDark),
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          },
        } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PreviewIcon sx={{ color: brand.orange }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{previewAd?.title}</Typography>
          </Box>
          <IconButton onClick={() => setPreviewAd(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewAd?.imageData ? (
            <Box
              component="img"
              src={previewAd.imageData}
              alt={previewAd.title}
              sx={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          ) : previewAd?.imageUrl ? (
            <Box
              component="img"
              src={previewAd.imageUrl}
              alt={previewAd.title}
              sx={{
                width: '100%',
                maxHeight: 300,
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          ) : previewAd?.backgroundColor ? (
            <Box
              sx={{
                width: '100%',
                height: 300,
                borderRadius: '8px',
                backgroundColor: previewAd.backgroundColor,
              }}
            />
          ) : null}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={slotLabel(previewAd?.slot)} size="small" sx={{ backgroundColor: statusBadge.info.bg, color: statusBadge.info.text }} />
            <Chip label={getAdStatus(previewAd || {}).label} size="small" sx={{ backgroundColor: getAdStatus(previewAd || {}).bg, color: getAdStatus(previewAd || {}).color }} />
            <Chip label={`${previewAd?.displayDurationSec || 5}s rotation`} size="small" sx={{ backgroundColor: 'rgba(255,143,0,0.08)', color: brand.orange }} />
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
          variant="filled"
          sx={{ borderRadius: '10px' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BannerAds;
