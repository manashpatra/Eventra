import React from 'react';
import {
  Card, CardContent, Typography, Box, Button, Alert, TableContainer,
  Table, TableHead, TableRow, TableCell, TableBody, TextField, Switch,
  IconButton, Grid2 as Grid, Chip, MenuItem, FormControl, InputLabel,
  Select, FormHelperText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Close as CloseIcon, Save as SaveIcon, Event as EventIcon } from '@mui/icons-material';
import { getLocalISODate, getDatePickerFormat, getDaysRemaining, getPujaStartDate } from '../../../utils/dateUtils';
import { status, border } from '../../../theme/colorTokens';

const PUJA_OPTIONS = [
  'Durga Puja',
  'Lakshmi Puja',
  'Kali Puja',
  'Saraswati Puja',
  'Gala Nights',
];

const PujaDaysTab = ({ config, setConfig, addFoodDay, updateFoodDay, removeFoodDay, saveSectionConfig }) => {
  const effectiveStartDate = getPujaStartDate(config);
  const daysToGo = getDaysRemaining(effectiveStartDate);

  return (
    <Box>
      {/* Puja Festival Schedule */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventIcon color="primary" fontSize="small" /> Puja Festival Schedule
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Configure the festival name and dates used for dynamic subscription reminders and countdowns (Durga Puja, Lakshmi Puja, Kali Puja, Saraswati Puja, Gala Nights).
              </Typography>
            </Box>
            {daysToGo !== null && (
              <Chip
                label={daysToGo > 0 ? `${daysToGo} days to go` : (daysToGo === 0 ? 'Starts Today!' : `${config?.pujaName || 'Puja'} Underway`)}
                color={daysToGo > 0 ? 'primary' : 'success'}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="puja-name-select-label">Puja / Festival Name</InputLabel>
                <Select
                  labelId="puja-name-select-label"
                  id="puja-name-select"
                  value={
                    PUJA_OPTIONS.includes(config?.pujaName)
                      ? config.pujaName
                      : (config?.pujaName === 'Laxmi Puja' ? 'Lakshmi Puja' : (config?.pujaName || 'Durga Puja'))
                  }
                  label="Puja / Festival Name"
                  onChange={(e) => {
                    if (setConfig) {
                      setConfig((prev) => ({ ...prev, pujaName: e.target.value }));
                    }
                  }}
                >
                  {PUJA_OPTIONS.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select festival for countdown and reminders</FormHelperText>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DatePicker
                label="Puja Start Date"
                value={config?.pujaStartDate ? new Date(config.pujaStartDate) : (effectiveStartDate ? new Date(effectiveStartDate) : null)}
                onChange={(newValue) => {
                  if (setConfig) {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setConfig((prev) => ({ ...prev, pujaStartDate: getLocalISODate(newValue) }));
                    } else {
                      setConfig((prev) => ({ ...prev, pujaStartDate: '' }));
                    }
                  }
                }}
                format={getDatePickerFormat(config?.dateFormat)}
                slotProps={{ textField: { size: 'small', fullWidth: true, helperText: 'Start date of festival' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <DatePicker
                label="Puja End Date"
                value={config?.pujaEndDate ? new Date(config.pujaEndDate) : null}
                onChange={(newValue) => {
                  if (setConfig) {
                    if (newValue && !isNaN(newValue.getTime())) {
                      setConfig((prev) => ({ ...prev, pujaEndDate: getLocalISODate(newValue) }));
                    } else {
                      setConfig((prev) => ({ ...prev, pujaEndDate: '' }));
                    }
                  }
                }}
                format={getDatePickerFormat(config?.dateFormat)}
                slotProps={{ textField: { size: 'small', fullWidth: true, helperText: 'End date of festival period' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.5,
                  px: 2,
                  borderRadius: '10px',
                  border: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  minHeight: 52,
                  boxSizing: 'border-box',
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Show Countdown on Home Page
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                    Displays the upcoming days countdown banner on the public site
                  </Typography>
                </Box>
                <Switch
                  checked={config?.showPujaCountdown !== false}
                  onChange={(e) => {
                    if (setConfig) {
                      setConfig((prev) => ({ ...prev, showPujaCountdown: e.target.checked }));
                    }
                  }}
                  color="primary"
                />
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2.5 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => saveSectionConfig('Puja Festival Schedule')}
              size="small"
            >
              Save Schedule & Countdown Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Food Coupon Days Configuration</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Configure the Puja days for food coupon availability. Toggle to enable/disable each day.
              </Typography>
            </Box>
            <Button variant="outlined" size="small" onClick={addFoodDay}>+ Add Day</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Day Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 220 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 120 }}>Enabled</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(!config?.foodDays || config.foodDays.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No food coupon days configured yet. Click "+ Add Day" to add days.
                    </TableCell>
                  </TableRow>
                ) : (
                  config.foodDays.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={day.dayName}
                          placeholder="e.g. Saptami"
                          onChange={(e) => updateFoodDay(index, 'dayName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 220 }}>
                        <DatePicker
                          value={day.date ? new Date(day.date) : null}
                          onChange={(newValue) => {
                            if (newValue && !isNaN(newValue.getTime())) {
                              updateFoodDay(index, 'date', getLocalISODate(newValue));
                            }
                          }}
                          format={getDatePickerFormat(config?.dateFormat)}
                          slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small', fullWidth: true } }}
                        />
                      </TableCell>
                      <TableCell sx={{ width: 120 }}>
                        <Switch
                          checked={day.enabled}
                          onChange={(e) => updateFoodDay(index, 'enabled', e.target.checked)}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => removeFoodDay(index)} sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark') }}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('Puja Days Setup')} size="small">
              Save Puja Days
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PujaDaysTab;
