import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, TextField, Grid, Switch, FormControlLabel, IconButton, InputLabel, Select, MenuItem, FormControl } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { cultural, brand, surface, border, overlay } from '../../../theme/colorTokens';

const defaultFormData = { 
  title: '', description: '', eventDate: null, eventEndDate: null, isTentative: false, 
  lastDateToApply: null, active: true, subEventsText: '', customFields: [], 
  allowGroupRegistration: false, maxCapacity: '', ageFieldMode: 'required',
  isPaidEvent: false, itemLabel: '', itemCost: '', maxItems: '', paymentPrefix: '' 
};

const AddEditEventTab = ({ eventToEdit, config, onSave, onCancel }) => {
  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        eventDate: eventToEdit.eventDate ? new Date(eventToEdit.eventDate) : null,
        eventEndDate: eventToEdit.eventEndDate ? new Date(eventToEdit.eventEndDate) : null,
        isTentative: !!eventToEdit.isTentative,
        lastDateToApply: eventToEdit.lastDateToApply ? new Date(eventToEdit.lastDateToApply) : null,
        active: eventToEdit.active !== false,
        subEventsText: eventToEdit.subEvents ? eventToEdit.subEvents.join('\n') : '',
        customFields: eventToEdit.customFields || [],
        allowGroupRegistration: !!eventToEdit.allowGroupRegistration,
        maxCapacity: eventToEdit.maxCapacity || '',
        ageFieldMode: eventToEdit.ageFieldMode || 'required',
        isPaidEvent: !!eventToEdit.isPaidEvent,
        itemLabel: eventToEdit.itemLabel || '',
        itemCost: eventToEdit.itemCost || '',
        maxItems: eventToEdit.maxItems || '',
        paymentPrefix: eventToEdit.paymentPrefix || ''
      });
    } else {
      setFormData(defaultFormData);
    }
  }, [eventToEdit]);

  const handleCustomFieldChange = (index, field, value) => {
    const list = [...formData.customFields];
    list[index][field] = value;
    setFormData({ ...formData, customFields: list });
  };
  
  const addCustomField = () => {
    setFormData({ ...formData, customFields: [...formData.customFields, { label: '', type: 'text', options: '', required: false, sensitive: false }] });
  };
  
  const removeCustomField = (index) => {
    const list = [...formData.customFields];
    list.splice(index, 1);
    setFormData({ ...formData, customFields: list });
  };

  const handleSave = () => {
    onSave(formData);
    if (!eventToEdit) {
      setFormData(defaultFormData);
    }
  };

  return (
    <Box>
      <Card sx={{ backgroundColor: cultural.bgSubtle, border: `1px solid ${cultural.bgLight}` }}>
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: cultural.pink }}>
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </Typography>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth label="Event Name" size="small" required
                value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth label="Description" size="small"
                value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Start Date (Optional)"
                format={config?.dateFormat || "dd/MM/yyyy"}
                value={formData.eventDate}
                onChange={(val) => setFormData({ ...formData, eventDate: val })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="End Date (Optional)"
                format={config?.dateFormat || "dd/MM/yyyy"}
                value={formData.eventEndDate}
                onChange={(val) => setFormData({ ...formData, eventEndDate: val })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControlLabel
                control={<Switch checked={formData.isTentative} onChange={(e) => setFormData({ ...formData, isTentative: e.target.checked })} />}
                label="Dates are Tentative"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Age Field</InputLabel>
                <Select value={formData.ageFieldMode} label="Age Field" onChange={e => setFormData({ ...formData, ageFieldMode: e.target.value })}>
                  <MenuItem value="required">Required</MenuItem>
                  <MenuItem value="optional">Optional</MenuItem>
                  <MenuItem value="hidden">Hidden</MenuItem>
                  <MenuItem value="age-group">Age Group</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <DatePicker
                label="Last Date to Apply"
                format={config?.dateFormat || "dd/MM/yyyy"}
                value={formData.lastDateToApply}
                onChange={(val) => setFormData({ ...formData, lastDateToApply: val })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth label="Sub-Events / Competitions (One per line)" size="small" multiline rows={4}
                placeholder="Sit and Draw (Sashti/ Saptami)&#10;Quiz (Sashti/ Saptami)"
                value={formData.subEventsText} onChange={(e) => setFormData({ ...formData, subEventsText: e.target.value })}
                helperText="End users can select multiple sub-events to participate in. Dates in brackets are tentative."
              />
            </Grid>
            
            <Grid size={{ xs: 12 }}>
              <Box sx={{ border: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>Custom Form Fields (e.g. Type of Performance)</Typography>
                {formData.customFields.map((cf, i) => (
                  <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }} key={i}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField fullWidth size="small" label="Field Label" value={cf.label} onChange={e => handleCustomFieldChange(i, 'label', e.target.value)} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Type</InputLabel>
                        <Select value={cf.type} label="Type" onChange={e => handleCustomFieldChange(i, 'type', e.target.value)}>
                            <MenuItem value="text">Text Input</MenuItem>
                            <MenuItem value="single-choice">Dropdown (Single)</MenuItem>
                            <MenuItem value="multi-choice">Checkbox list (Multiple)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      {(cf.type === 'single-choice' || cf.type === 'multi-choice' || cf.type === 'select' || cf.type === 'radio') && (
                        <TextField fullWidth size="small" label="Options (Comma separated)" value={cf.options} onChange={e => handleCustomFieldChange(i, 'options', e.target.value)} />
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <FormControlLabel control={<Switch size="small" checked={cf.required} onChange={e => handleCustomFieldChange(i, 'required', e.target.checked)} />} label="Req" />
                      <FormControlLabel control={<Switch size="small" checked={!!cf.sensitive} onChange={e => handleCustomFieldChange(i, 'sensitive', e.target.checked)} color="warning" />} label={<Typography variant="caption" sx={{ fontSize: '0.75rem' }}>🔒</Typography>} />
                      <IconButton size="small" color="error" onClick={() => removeCustomField(i)}><DeleteIcon fontSize="small"/></IconButton>
                    </Grid>
                  </Grid>
                ))}
                <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addCustomField}>Add Custom Field</Button>
              </Box>
            </Grid>


            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label="Max Capacity (Optional)" size="small" type="number" placeholder="Leave empty for unlimited" value={formData.maxCapacity} onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={<Switch checked={formData.allowGroupRegistration} onChange={(e) => setFormData({ ...formData, allowGroupRegistration: e.target.checked })} color="primary" />}
                label="Allow Group/Team Registrations"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControlLabel
                control={<Switch checked={formData.isPaidEvent} onChange={(e) => setFormData({ ...formData, isPaidEvent: e.target.checked })} color="secondary" />}
                label="Paid Event"
              />
            </Grid>
            {formData.isPaidEvent && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ border: `1px solid ${brand.gold}`, borderRadius: 2, p: 2, backgroundColor: overlay.goldXLight(false) }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: brand.orangeDark }}>Paid Event Configuration</Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField fullWidth label="Item Label" size="small" placeholder="e.g. Stalls, Tables" value={formData.itemLabel} onChange={(e) => setFormData({ ...formData, itemLabel: e.target.value })} required={formData.isPaidEvent} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField fullWidth label="Cost per Item (₹)" size="small" type="number" placeholder="e.g. 500" value={formData.itemCost} onChange={(e) => setFormData({ ...formData, itemCost: e.target.value })} required={formData.isPaidEvent} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField fullWidth label="Max Items allowed" size="small" type="number" placeholder="e.g. 5" value={formData.maxItems} onChange={(e) => setFormData({ ...formData, maxItems: e.target.value })} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <TextField fullWidth label="Payment Note Prefix" size="small" placeholder="e.g. Stall_" value={formData.paymentPrefix} onChange={(e) => setFormData({ ...formData, paymentPrefix: e.target.value })} helperText="Added before Flat No in UPI" />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}
          </Grid>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column-reverse', sm: 'row' }, justifyContent: 'flex-end', gap: 1.5, mt: 2 }}>
            {eventToEdit && (
              <Button variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }} onClick={onCancel}>Cancel</Button>
            )}
            <Button variant="contained" sx={{ width: { xs: '100%', sm: 'auto' } }} disabled={!formData.title} onClick={handleSave} startIcon={eventToEdit ? <EditIcon /> : <AddIcon />}>
              {eventToEdit ? 'Update' : 'Create & Publish Notice'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AddEditEventTab;
