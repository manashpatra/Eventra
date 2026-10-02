import {
  Card, CardContent, Typography, Grid2 as Grid, TextField, InputAdornment,
  Divider, Box, Button, FormControl, InputLabel, Select, MenuItem,
  IconButton, Chip, Tooltip, Alert,
} from '@mui/material';
import {
  Save as SaveIcon,
  Translate as TranslateIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getLocalISODate, getDatePickerFormat } from '../../../utils/dateUtils';
import { UPI_APPS } from '../../../utils/upiHelper';
import { brand, cultural, status, border } from '../../../theme/colorTokens';

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
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Society & Committee Info</Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Society Name" value={config.societyName || ''}
              onChange={(e) => setConfig({ ...config, societyName: e.target.value })}
              helperText="Name of your society / housing complex"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Society Address" value={config.societyAddress || ''}
              onChange={(e) => setConfig({ ...config, societyAddress: e.target.value })}
              helperText="Full address shown on printed receipts"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Committee Name" value={config.committeeName || ''}
              onChange={(e) => setConfig({ ...config, committeeName: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Committee Year" value={config.year || ''}
              onChange={(e) => setConfig({ ...config, year: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Subscription Amount" type="number" value={config.subscriptionAmount || 0}
              onChange={(e) => setConfig({ ...config, subscriptionAmount: Number(e.target.value) })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Normal Quota" type="number" value={config.normalQuota || 4}
              onChange={(e) => setConfig({ ...config, normalQuota: Number(e.target.value) })}
              helperText="Max normal plates per flat per meal"
              size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="date-format-label">Date Format</InputLabel>
              <Select
                labelId="date-format-label"
                id="date-format-select"
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
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="UPI Payee Address (VPA)" value={config.upiPayeeAddress || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeAddress: e.target.value })}
              placeholder="e.g. yourname@icici"
              helperText="The UPI VPA/ID to receive payments"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="UPI Payee Name" value={config.upiPayeeName || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeName: e.target.value })}
              placeholder="e.g. Committee Name"
              helperText="The display name shown in UPI apps"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="UPI Payment Description" value={config.upiPayeeDescription || ''}
              onChange={(e) => setConfig({ ...config, upiPayeeDescription: e.target.value })}
              placeholder="e.g. Puja Subscription"
              helperText="Transaction note / description for UPI payments"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="UPI Merchant Code (MC)" value={config.upiMerchantCode || '8699'}
              onChange={(e) => setConfig({ ...config, upiMerchantCode: e.target.value })}
              placeholder="e.g. 8699"
              helperText="Merchant code (MC) for UPI Intent"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="Bank Account Number" value={config.bankAccountNumber || ''}
              onChange={(e) => setConfig({ ...config, bankAccountNumber: e.target.value })}
              placeholder="e.g. 627505031179"
              helperText="For direct NEFT/RTGS/IMPS transfers"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 6 }}>
            <TextField fullWidth label="Bank IFSC Code" value={config.bankIfscCode || ''}
              onChange={(e) => setConfig({ ...config, bankIfscCode: e.target.value })}
              placeholder="e.g. ICIC0006275"
              helperText="The IFSC code for the bank account"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="enabled-upi-apps-label">Enabled UPI Apps</InputLabel>
              <Select
                labelId="enabled-upi-apps-label"
                id="enabled-upi-apps-select"
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
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('General Settings')} size="small">
            Save General Settings
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GeneralTab;

