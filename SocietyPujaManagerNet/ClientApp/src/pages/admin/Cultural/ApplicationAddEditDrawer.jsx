import React from 'react';
import {
  Box, Typography, IconButton, Button, Grid, TextField,
  FormControlLabel, Switch, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, Drawer
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { cultural, brand, surface, overlay } from '../../../theme/colorTokens';

const ApplicationAddEditDrawer = ({
  open,
  onClose,
  editAppId,
  appDialog,
  appFormData,
  setAppFormData,
  handleAddApplication,
  config
}) => {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100vw', sm: 500, md: 600 }, display: 'flex', flexDirection: 'column' } }
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'background.paper', position: 'sticky', top: 0, zIndex: 10 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {editAppId ? 'Edit Application' : 'Add Offline Application'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </Box>
      <Box sx={{ p: { xs: 2, sm: 3 }, flexGrow: 1, overflowY: 'auto' }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Flat Number" required value={appFormData.flatNumber} onChange={e => setAppFormData({ ...appFormData, flatNumber: e.target.value })} />
          </Grid>
          {appDialog.event?.allowGroupRegistration && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={<Switch checked={appFormData.isGroup} onChange={e => setAppFormData({ ...appFormData, isGroup: e.target.checked })} color="primary" />}
                label="Group Registration"
              />
            </Grid>
          )}
          {appFormData.isGroup ? (
            <Grid size={{ xs: 12 }}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Group Members</Typography>
                {appFormData.participants.map((p, idx) => (
                  <Grid container spacing={2} key={idx} sx={{ mb: 1, alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Name" required value={p.name} onChange={e => { const parts = [...appFormData.participants]; parts[idx].name = e.target.value; setAppFormData({ ...appFormData, participants: parts }) }} />
                    </Grid>
                    {((appDialog.event?.ageFieldMode || 'required') !== 'hidden' && (appDialog.event?.ageFieldMode || 'required') !== 'age-group') && (
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField fullWidth size="small" label="Age" type="number" required={(appDialog.event?.ageFieldMode || 'required') === 'required'} value={p.age} onChange={e => { const parts = [...appFormData.participants]; parts[idx].age = e.target.value; setAppFormData({ ...appFormData, participants: parts }) }} />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: 2 }}>
                      {appFormData.participants.length > 1 && (
                        <IconButton size="small" color="error" onClick={() => { const parts = [...appFormData.participants]; parts.splice(idx, 1); setAppFormData({ ...appFormData, participants: parts }) }}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </Grid>
                  </Grid>
                ))}
                <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={() => setAppFormData({ ...appFormData, participants: [...appFormData.participants, { name: '', age: '' }] })}>Add Member</Button>
              </Box>
            </Grid>
          ) : (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Participant Name" required value={appFormData.participantName} onChange={e => setAppFormData({ ...appFormData, participantName: e.target.value })} />
              </Grid>
              {((appDialog.event?.ageFieldMode || 'required') !== 'hidden' && (appDialog.event?.ageFieldMode || 'required') !== 'age-group') && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Age" type="number" required={(appDialog.event?.ageFieldMode || 'required') === 'required'} value={appFormData.age} onChange={e => setAppFormData({ ...appFormData, age: e.target.value })} />
                </Grid>
              )}
            </>
          )}
          {((appDialog.event?.ageFieldMode || 'required') === 'age-group' && config?.culturalAgeGroups?.length > 0) && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl size="small" fullWidth required>
                <InputLabel>Age Group</InputLabel>
                <Select
                  value={appFormData.calculatedAgeGroup || ''}
                  onChange={(e) => setAppFormData({ ...appFormData, calculatedAgeGroup: e.target.value })}
                  label="Age Group"
                >
                  <MenuItem value=""><em>-- Select Age Group --</em></MenuItem>
                  {(config.culturalAgeGroups || []).map((ag) => (
                    <MenuItem key={ag.name} value={ag.name}>{ag.name} ({ag.min}-{ag.max} yrs)</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Contact Number" required value={appFormData.contactNumber} onChange={e => setAppFormData({ ...appFormData, contactNumber: e.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size="small" label="Slot" value={appFormData.scheduleTime} onChange={e => setAppFormData({ ...appFormData, scheduleTime: e.target.value })} placeholder="e.g. 10:30 AM, Serial #5" />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth size="small" label="Internal Comment / Note" value={appFormData.comment} onChange={e => setAppFormData({ ...appFormData, comment: e.target.value })} />
          </Grid>

          {appDialog.event?.eventDate && appDialog.event?.eventEndDate && !appDialog.event?.isTentative && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <DatePicker
                label="Selected Date"
                format={config?.dateFormat || "dd/MM/yyyy"}
                value={appFormData.selectedDate}
                onChange={(val) => setAppFormData({ ...appFormData, selectedDate: val })}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                minDate={new Date(appDialog.event.eventDate)}
                maxDate={new Date(appDialog.event.eventEndDate)}
              />
            </Grid>
          )}
          {appDialog.event?.subEvents && appDialog.event.subEvents.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Competitions</InputLabel>
                <Select multiple value={appFormData.selectedSubEvents} onChange={e => setAppFormData({ ...appFormData, selectedSubEvents: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })} label="Competitions" renderValue={(selected) => selected.join(', ')}>
                  {appDialog.event.subEvents.map(se => (
                    <MenuItem key={se} value={se}>
                      <Checkbox checked={appFormData.selectedSubEvents.indexOf(se) > -1} />
                      <ListItemText primary={se} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {appDialog.event?.customFields && appDialog.event.customFields.map((cf, i) => (
            <Grid size={{ xs: 12 }} key={i}>
              {cf.type === 'text' && (
                <TextField fullWidth size="small" label={cf.label} required={cf.required} value={appFormData.customFieldResponses[cf.label] || ''} onChange={e => setAppFormData({ ...appFormData, customFieldResponses: { ...appFormData.customFieldResponses, [cf.label]: e.target.value } })} />
              )}
              {cf.type === 'single-choice' && (
                <>
                  <FormControl size="small" fullWidth required={cf.required}>
                    <InputLabel>{cf.label}</InputLabel>
                    <Select value={appFormData.customFieldResponses[cf.label] || ''} onChange={e => setAppFormData({ ...appFormData, customFieldResponses: { ...appFormData.customFieldResponses, [cf.label]: e.target.value } })} label={cf.label}>
                      {cf.options.split(',').map(o => o.trim()).map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {appFormData.customFieldResponses[cf.label] === 'Other' && (
                    <TextField fullWidth size="small" label="Please specify" sx={{ mt: 1 }} value={appFormData.customFieldResponses[`${cf.label}_other`] || ''} onChange={e => setAppFormData({ ...appFormData, customFieldResponses: { ...appFormData.customFieldResponses, [`${cf.label}_other`]: e.target.value } })} />
                  )}
                </>
              )}
              {cf.type === 'multi-choice' && (
                <>
                  <FormControl size="small" fullWidth required={cf.required}>
                    <InputLabel>{cf.label}</InputLabel>
                    <Select multiple value={appFormData.customFieldResponses[cf.label] || []} onChange={e => setAppFormData({ ...appFormData, customFieldResponses: { ...appFormData.customFieldResponses, [cf.label]: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value } })} label={cf.label} renderValue={(selected) => selected.join(', ')}>
                      {cf.options.split(',').map(o => o.trim()).map(o => (
                        <MenuItem key={o} value={o}>
                          <Checkbox checked={(appFormData.customFieldResponses[cf.label] || []).indexOf(o) > -1} />
                          <ListItemText primary={o} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {(appFormData.customFieldResponses[cf.label] || []).includes('Other') && (
                    <TextField fullWidth size="small" label="Please specify" sx={{ mt: 1 }} value={appFormData.customFieldResponses[`${cf.label}_other`] || ''} onChange={e => setAppFormData({ ...appFormData, customFieldResponses: { ...appFormData.customFieldResponses, [`${cf.label}_other`]: e.target.value } })} />
                  )}
                </>
              )}
            </Grid>
          ))}
        </Grid>
        {appDialog.event?.isPaidEvent && (
          <Box sx={{ mt: 3, border: `1px solid ${brand.gold}`, borderRadius: 2, p: 2, backgroundColor: overlay.goldXLight(false) }}>
            <Typography variant="subtitle2" sx={{ mb: 2, color: brand.orangeDark }}>Paid Event Details</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={`Number of ${appDialog.event.itemLabel || 'Item'}(s)`}
                  value={appFormData.itemCount}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    const finalVal = appDialog.event.maxItems ? Math.min(val, appDialog.event.maxItems) : val;
                    setAppFormData({ 
                      ...appFormData, 
                      itemCount: finalVal || '', 
                      amountPaid: (finalVal || 0) * (appDialog.event.itemCost || 0) 
                    });
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount Paid (₹)"
                  value={appFormData.amountPaid}
                  onChange={(e) => setAppFormData({ ...appFormData, amountPaid: Number(e.target.value) || 0 })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={<Switch checked={appFormData.adminPaymentConfirmed || false} onChange={e => setAppFormData({ ...appFormData, adminPaymentConfirmed: e.target.checked })} color="primary" />}
                  label="Payment Received"
                />
              </Grid>
              {appFormData.adminPaymentConfirmed && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Mode</InputLabel>
                      <Select
                        value={appFormData.paymentMode || 'UPI'}
                        label="Payment Mode"
                        onChange={(e) => setAppFormData({ ...appFormData, paymentMode: e.target.value })}
                      >
                        <MenuItem value="Cash">Cash</MenuItem>
                        <MenuItem value="UPI">UPI</MenuItem>
                        <MenuItem value="Net Banking">Net Banking</MenuItem>
                        <MenuItem value="Cheque">Cheque</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {['UPI', 'Net Banking', 'Cheque'].includes(appFormData.paymentMode) && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField fullWidth size="small" label="Payment Reference" value={appFormData.paymentReference || ''} onChange={(e) => setAppFormData({ ...appFormData, paymentReference: e.target.value })} />
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2, pb: { xs: 'calc(16px + env(safe-area-inset-bottom))', sm: 2 }, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1, bgcolor: 'background.paper', position: 'sticky', bottom: 0, zIndex: 10 }}>
        <Button variant="outlined" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={() => handleAddApplication(false)} sx={{ backgroundColor: cultural.pink, '&:hover': { backgroundColor: cultural.pinkDark } }}>{editAppId ? 'Update' : 'Save'}</Button>
        {!editAppId && (
          <Button variant="contained" color="primary" onClick={() => handleAddApplication(true)}>Save & Add</Button>
        )}
      </Box>
    </Drawer>
  );
};

export default ApplicationAddEditDrawer;
