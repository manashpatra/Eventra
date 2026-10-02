import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Grid, TextField, InputAdornment,
  Divider, Box, Button, FormControl, InputLabel, Select, MenuItem,
  IconButton, Chip, Tooltip, Alert, CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Translate as TranslateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
  CloudUpload as UploadIcon,
  RestartAlt as ResetIcon,
  VerifiedUser as StampIcon,
  Edit as SignatureIcon,
} from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getLocalISODate, getDatePickerFormat } from '../../../utils/dateUtils';
import { UPI_APPS } from '../../../utils/upiHelper';
import { brand, cultural, status, border } from '../../../theme/colorTokens';
import { getPrintAssets, updatePrintAssets } from '../../../services/masterConfigService';
import { STAMP_IMAGE_BASE64, SIGNATURE_IMAGE_BASE64 } from '../../../utils/printConstants';
import { resizeImageFileToBase64 } from '../../../utils/imageUtils';

// Common language presets for quick-add
const LANGUAGE_PRESETS = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
];

// Language config section component
const LanguageConfigSection = ({ title, configKey, config, setConfig }) => {
  const langConfig = config[configKey] || { enabled: false, defaultLanguage: 'en', languages: [] };
  const languages = langConfig.languages || [];

  const updateLangConfig = (updates) => {
    setConfig({
      ...config,
      [configKey]: { ...langConfig, ...updates },
    });
  };

  const addLanguage = (preset) => {
    if (languages.some((l) => l.code === preset.code)) return;
    updateLangConfig({
      languages: [...languages, { ...preset }],
    });
  };

  const removeLanguage = (code) => {
    const updated = languages.filter((l) => l.code !== code);
    const updates = { languages: updated };
    // If we removed the default language, reset to 'en' or first available
    if (langConfig.defaultLanguage === code) {
      updates.defaultLanguage = updated[0]?.code || 'en';
    }
    updateLangConfig(updates);
  };

  const updateLanguageField = (code, field, value) => {
    updateLangConfig({
      languages: languages.map((l) =>
        l.code === code ? { ...l, [field]: value } : l
      ),
    });
  };

  // Available presets that haven't been added yet
  const availablePresets = LANGUAGE_PRESETS.filter(
    (p) => !languages.some((l) => l.code === p.code)
  );

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={langConfig.enabled ?? false}
              onChange={(e) => updateLangConfig({ enabled: e.target.checked })}
              size="small"
              color="primary"
            />
          }
          label={langConfig.enabled ? 'Enabled' : 'Disabled'}
          sx={{ ml: 1, '& .MuiTypography-root': { fontSize: '0.8rem', color: (theme) => langConfig.enabled ? status.success.main(theme.palette.mode === 'dark') : 'text.secondary' } }}
        />
      </Box>

      {langConfig.enabled && (
        <Box sx={{ pl: 1 }}>
          {/* Default Language */}
          <FormControl size="small" sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel>Default Language</InputLabel>
            <Select
              value={langConfig.defaultLanguage || 'en'}
              label="Default Language"
              onChange={(e) => updateLangConfig({ defaultLanguage: e.target.value })}
            >
              {languages.map((l) => (
                <MenuItem key={l.code} value={l.code}>
                  {l.nativeLabel} ({l.label})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Language List */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            {languages.map((lang) => (
              <Box
                key={lang.code}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  border: (theme) => `1px solid ${border.subtle(theme.palette.mode === 'dark')}`,
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                }}
              >
                <Chip
                  label={lang.code.toUpperCase()}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    minWidth: 40,
                    backgroundColor: 'rgba(255,143,0,0.1)',
                    color: brand.gold,
                    border: (theme) => `1px solid ${border.brandSubtle(theme.palette.mode === 'dark')}`,
                  }}
                />
                <TextField
                  size="small"
                  label="Label"
                  value={lang.label || ''}
                  onChange={(e) => updateLanguageField(lang.code, 'label', e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  label="Native Label"
                  value={lang.nativeLabel || ''}
                  onChange={(e) => updateLanguageField(lang.code, 'nativeLabel', e.target.value)}
                  sx={{ flex: 1 }}
                />
                {languages.length > 1 && (
                  <Tooltip title="Remove language">
                    <IconButton
                      size="small"
                      onClick={() => removeLanguage(lang.code)}
                      sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark') }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            ))}
          </Box>

          {/* Quick Add from Presets */}
          {availablePresets.length > 0 && (
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                Quick Add Language:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {availablePresets.map((preset) => (
                  <Chip
                    key={preset.code}
                    label={`${preset.nativeLabel} (${preset.label})`}
                    size="small"
                    icon={<AddIcon sx={{ fontSize: '14px !important' }} />}
                    onClick={() => addLanguage(preset)}
                    sx={{
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      border: '1px dashed rgba(255,255,255,0.15)',
                      backgroundColor: 'transparent',
                      '&:hover': { backgroundColor: 'rgba(255,143,0,0.08)' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// Age groups config section component
const CulturalAgeGroupsConfigSection = ({ config, setConfig }) => {
  const ageGroups = config.culturalAgeGroups || [];

  const handleAddAgeGroup = () => {
    setConfig({
      ...config,
      culturalAgeGroups: [...ageGroups, { name: '', min: '', max: '' }]
    });
  };

  const handleUpdateAgeGroup = (index, field, value) => {
    const updated = [...ageGroups];
    updated[index] = { ...updated[index], [field]: value };
    setConfig({ ...config, culturalAgeGroups: updated });
  };

  const handleRemoveAgeGroup = (index) => {
    const updated = [...ageGroups];
    updated.splice(index, 1);
    setConfig({ ...config, culturalAgeGroups: updated });
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <GroupsIcon sx={{ color: cultural.pink }} />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Cultural Event Age Groups</Typography>
      </Box>
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Define standard age groups used in cultural event registrations. When you set an event's Age Field to "Age Group", participants will pick from these options.
      </Alert>

      <Grid container spacing={2}>
        {ageGroups.map((ag, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Box sx={{ p: 2, border: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, borderRadius: 2, position: 'relative' }}>
              <IconButton size="small" onClick={() => handleRemoveAgeGroup(i)} sx={{ position: 'absolute', top: 4, right: 4, color: 'text.secondary' }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
              <TextField fullWidth size="small" label="Group Name" placeholder="e.g. Group A" value={ag.name} onChange={(e) => handleUpdateAgeGroup(i, 'name', e.target.value)} sx={{ mb: 2, mt: 1 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField fullWidth size="small" type="number" label="Min Age" value={ag.min} onChange={(e) => handleUpdateAgeGroup(i, 'min', e.target.value)} />
                <TextField fullWidth size="small" type="number" label="Max Age" value={ag.max} onChange={(e) => handleUpdateAgeGroup(i, 'max', e.target.value)} />
              </Box>
            </Box>
          </Grid>
        ))}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={handleAddAgeGroup} sx={{ height: '100%', minHeight: '100px', borderStyle: 'dashed' }}>
            Add Age Group
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const GeneralTab = ({ config, setConfig, saveSectionConfig }) => {
  const [printAssets, setPrintAssets] = useState({ stampImage: '', signatureImage: '' });
  const [assetsModified, setAssetsModified] = useState(false);
  const [savingAssets, setSavingAssets] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    getPrintAssets().then((assets) => {
      if (isMounted && assets) {
        setPrintAssets({
          stampImage: assets.stampImage || '',
          signatureImage: assets.signatureImage || '',
        });
      }
    });
    return () => { isMounted = false; };
  }, []);

  const handleStampUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const resizedBase64 = await resizeImageFileToBase64(file, 260, 260);
      setPrintAssets((prev) => ({ ...prev, stampImage: resizedBase64 }));
      setAssetsModified(true);
    } catch (err) {
      console.error('Failed to process stamp image:', err);
      setUploadError('Failed to process stamp image. Please upload a valid image file.');
    }
  };

  const handleSignatureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const resizedBase64 = await resizeImageFileToBase64(file, 300, 100);
      setPrintAssets((prev) => ({ ...prev, signatureImage: resizedBase64 }));
      setAssetsModified(true);
    } catch (err) {
      console.error('Failed to process signature image:', err);
      setUploadError('Failed to process signature image. Please upload a valid image file.');
    }
  };

  const handleResetStamp = () => {
    setPrintAssets((prev) => ({ ...prev, stampImage: '' }));
    setAssetsModified(true);
  };

  const handleResetSignature = () => {
    setPrintAssets((prev) => ({ ...prev, signatureImage: '' }));
    setAssetsModified(true);
  };

  const handleSaveGeneral = async () => {
    if (assetsModified) {
      setSavingAssets(true);
      try {
        await updatePrintAssets(printAssets);
        setAssetsModified(false);
      } catch (err) {
        console.error('Failed to update print assets:', err);
      } finally {
        setSavingAssets(false);
      }
    }
    await saveSectionConfig('General Settings');
  };

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Society & Committee Info</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Society Name" value={config.societyName || ''}
              onChange={(e) => setConfig({ ...config, societyName: e.target.value })}
              helperText="Name of your society / housing complex"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Society Address" value={config.societyAddress || ''}
              onChange={(e) => setConfig({ ...config, societyAddress: e.target.value })}
              helperText="Full address shown on printed receipts"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Committee Name" value={config.committeeName || ''}
              onChange={(e) => setConfig({ ...config, committeeName: e.target.value })}
              helperText="Organizing committee name" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Committee Year" value={config.year || ''}
              onChange={(e) => setConfig({ ...config, year: e.target.value })}
              helperText="e.g. 2026-27" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Subscription Amount" type="number" value={config.subscriptionAmount || 0}
              onChange={(e) => setConfig({ ...config, subscriptionAmount: Number(e.target.value) })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
              helperText="Base subscription fee per flat"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <DatePicker
              label="Puja Start Date"
              value={config.pujaStartDate ? new Date(config.pujaStartDate) : null}
              onChange={(newValue) => {
                if (newValue && !isNaN(newValue.getTime())) {
                  setConfig({ ...config, pujaStartDate: getLocalISODate(newValue) });
                } else {
                  setConfig({ ...config, pujaStartDate: '' });
                }
              }}
              format={getDatePickerFormat(config?.dateFormat)}
              slotProps={{ textField: { fullWidth: true, size: 'small', helperText: 'Start date of Durga Puja (for reminders)' } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth size="small" label="Normal Quota" type="number" value={config.normalQuota || 4}
              onChange={(e) => setConfig({ ...config, normalQuota: Number(e.target.value) })}
              helperText="Max normal plates per flat per meal" />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Format</InputLabel>
              <Select
                value={config.dateFormat || 'dd-MM-YYYY'}
                label="Date Format"
                onChange={(e) => setConfig({ ...config, dateFormat: e.target.value })}
              >
                <MenuItem value="dd-MM-YYYY">dd-MM-YYYY (15-08-2026)</MenuItem>
                <MenuItem value="MM-dd-YYYY">MM-dd-YYYY (08-15-2026)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center' }} size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.isFoodSellWindowOpen ?? true}
                  onChange={(e) => setConfig({ ...config, isFoodSellWindowOpen: e.target.checked })}
                  color="primary"
                />
              }
              label="Enable Food Sell Window"
            />
          </Grid>
          <Grid sx={{ display: 'flex', alignItems: 'center' }} size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.onlineFoodCouponEnabled ?? false}
                  onChange={(e) => setConfig({ ...config, onlineFoodCouponEnabled: e.target.checked })}
                  color="primary"
                />
              }
              label="Online Food Coupons"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.08)' }} />

        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Payment Settings</Typography>
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Society PAN" value={config.societyPan || ''}
              onChange={(e) => setConfig({ ...config, societyPan: e.target.value.toUpperCase() })}
              placeholder="e.g. ABCDE1234F"
              helperText="Permanent Account Number for tax and invoice receipts"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Cheque In Favour Of" value={config.chequeFavourName || ''}
              onChange={(e) => setConfig({ ...config, chequeFavourName: e.target.value })}
              placeholder="e.g. Association of Flat Owners"
              helperText="Beneficiary name for Cheque / Demand Draft payments"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Bank Name" value={config.bankName || ''}
              onChange={(e) => setConfig({ ...config, bankName: e.target.value })}
              placeholder="e.g. ICICI Bank, State Bank of India"
              helperText="Name of the bank holding society accounts"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Bank Account Number" value={config.bankAccountNumber || ''}
              onChange={(e) => setConfig({ ...config, bankAccountNumber: e.target.value })}
              placeholder="e.g. 123456789012"
              helperText="For direct NEFT/RTGS/IMPS transfers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Bank IFSC Code" value={config.bankIfscCode || ''}
              onChange={(e) => setConfig({ ...config, bankIfscCode: e.target.value.toUpperCase() })}
              placeholder="e.g. SBIN0001234"
              helperText="The IFSC code for the bank account"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="UPI Payee Address (VPA)" value={config.upiPayeeAddress || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeAddress: e.target.value })}
              placeholder="e.g. yourname@icici"
              helperText="The UPI VPA/ID to receive payments"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="UPI Payee Name" value={config.upiPayeeName || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeName: e.target.value })}
              placeholder="e.g. Committee Name"
              helperText="The display name shown in UPI apps"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="UPI Payment Description" value={config.upiPayeeDescription || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeDescription: e.target.value })}
              placeholder="e.g. Puja Subscription"
              helperText="Transaction note / description for UPI payments"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="UPI Merchant Code (MC)" value={config.upiMerchantCode || ''}
              onChange={(e) => setConfig({ ...config, upiMerchantCode: e.target.value })}
              placeholder="e.g. 8699 (optional, leave empty if P2P)"
              helperText="Optional Merchant code (MC) for UPI Intent"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Enabled UPI Apps</InputLabel>
              <Select
                multiple
                value={config.enabledUpiApps || UPI_APPS.filter(app => app.live).map(app => app.id)}
                label="Enabled UPI Apps"
                onChange={(e) => setConfig({ ...config, enabledUpiApps: e.target.value })}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={UPI_APPS.find(app => app.id === value)?.name || value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {UPI_APPS.map((app) => (
                  <MenuItem key={app.id} value={app.id}>
                    {app.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth size="small" label="Festival WhatsApp Group Link" value={config.whatsappGroupLink || ''}
              onChange={(e) => setConfig({ ...config, whatsappGroupLink: e.target.value })}
              placeholder="e.g. https://chat.whatsapp.com/..."
              helperText="Invite link for residents and contributors to share payment screenshots"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: (theme) => border.divider(theme.palette.mode === 'dark') }} />

        {/* Digital Seal & Signatures Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <StampIcon sx={{ color: brand.gold }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Digital Seal & Signatures</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Configure digital stamp/seal and authorized signature for generated receipts and invoices. Images are automatically compressed and stored securely in dedicated print storage.
        </Typography>

        {uploadError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enableDigitalStamp ?? true}
                  onChange={(e) => setConfig({ ...config, enableDigitalStamp: e.target.checked })}
                  color="primary"
                />
              }
              label="Enable Digital Stamp / Seal"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enableDigitalSignature ?? true}
                  onChange={(e) => setConfig({ ...config, enableDigitalSignature: e.target.checked })}
                  color="primary"
                />
              }
              label="Enable Digital Signature"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Signatory Designation"
              value={config.signatoryDesignation ?? 'Authorized Signatory'}
              onChange={(e) => setConfig({ ...config, signatoryDesignation: e.target.value })}
              placeholder="e.g. Authorized Signatory / Treasurer"
              helperText="Title printed under the signature line"
            />
          </Grid>
        </Grid>

        {/* Upload Cards Grid */}
        <Grid container spacing={3} sx={{ mb: 1 }}>
          {/* Stamp Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`,
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Society / Committee Seal (Stamp)
                </Typography>
                <Chip
                  label={printAssets.stampImage ? 'Custom Uploaded' : 'Default Stamp'}
                  size="small"
                  color={printAssets.stampImage ? 'primary' : 'default'}
                  variant={printAssets.stampImage ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
              </Box>

              {/* Preview Area with Checkered Background for Transparency */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1.5,
                  minHeight: 120,
                  maxHeight: 120,
                  mb: 2,
                  border: '1px dashed rgba(128,128,128,0.25)',
                  backgroundColor: '#ffffff',
                  backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              >
                <img
                  src={printAssets.stampImage || STAMP_IMAGE_BASE64}
                  alt="Stamp Preview"
                  style={{ maxHeight: 95, maxWidth: '100%', objectFit: 'contain' }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                Recommended: Transparent PNG (max ~260x260 px). Automatically scaled & compressed on upload.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Upload New Stamp
                  <input type="file" hidden accept="image/*" onChange={handleStampUpload} />
                </Button>
                {printAssets.stampImage && (
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    startIcon={<ResetIcon />}
                    onClick={handleResetStamp}
                    sx={{ textTransform: 'none' }}
                  >
                    Reset to Default
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Signature Card */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`,
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Authorized Signatory Signature
                </Typography>
                <Chip
                  label={printAssets.signatureImage ? 'Custom Uploaded' : 'Default Signature'}
                  size="small"
                  color={printAssets.signatureImage ? 'primary' : 'default'}
                  variant={printAssets.signatureImage ? 'filled' : 'outlined'}
                  sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                />
              </Box>

              {/* Preview Area with Checkered Background for Transparency */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1.5,
                  minHeight: 120,
                  maxHeight: 120,
                  mb: 2,
                  border: '1px dashed rgba(128,128,128,0.25)',
                  backgroundColor: '#ffffff',
                  backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)',
                  backgroundSize: '12px 12px',
                }}
              >
                <img
                  src={printAssets.signatureImage || SIGNATURE_IMAGE_BASE64}
                  alt="Signature Preview"
                  style={{ maxHeight: 55, maxWidth: '100%', objectFit: 'contain' }}
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                Recommended: Transparent PNG (max ~300x100 px). Automatically scaled & compressed on upload.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  size="small"
                  startIcon={<UploadIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Upload New Signature
                  <input type="file" hidden accept="image/*" onChange={handleSignatureUpload} />
                </Button>
                {printAssets.signatureImage && (
                  <Button
                    variant="text"
                    size="small"
                    color="error"
                    startIcon={<ResetIcon />}
                    onClick={handleResetSignature}
                    sx={{ textTransform: 'none' }}
                  >
                    Reset to Default
                  </Button>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: (theme) => border.divider(theme.palette.mode === 'dark') }} />

        {/* Language Settings */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <TranslateIcon sx={{ color: brand.gold }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Language Settings</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Configure which languages are available for users. Public and Admin sections use separate language settings.
          Translations are powered by Google Translate.
        </Alert>

        <LanguageConfigSection
          title="🌐 Public Pages (Home, My Food, Notices, etc.)"
          configKey="publicLanguages"
          config={config}
          setConfig={setConfig}
        />

        <Divider sx={{ my: 3, borderColor: (theme) => border.subtle(theme.palette.mode === 'dark') }} />

        <LanguageConfigSection
          title="🔒 Admin Pages (Dashboard, Subscriptions, etc.)"
          configKey="adminLanguages"
          config={config}
          setConfig={setConfig}
        />

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.06)' }} />

        <CulturalAgeGroupsConfigSection config={config} setConfig={setConfig} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={savingAssets ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            onClick={handleSaveGeneral}
            disabled={savingAssets}
            size="small"
          >
            {savingAssets ? 'Saving Settings...' : 'Save General Settings'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GeneralTab;

