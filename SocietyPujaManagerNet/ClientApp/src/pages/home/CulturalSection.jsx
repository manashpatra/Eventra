import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Card, CardContent, TextField, Button, ButtonGroup, FormControl, InputLabel, Select, MenuItem, Fade, Alert, CircularProgress, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Chip, Checkbox, ListItemText } from '@mui/material';
import {
  Event as EventIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Comment as CommentIcon,
  EventBusy as EventBusyIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { submitCulturalApplication, getAllCulturalEvents, getApplicationsByFlat, updateApplicationComment } from '../../services/culturalService';
import { formatDateTime } from '../../utils/dateUtils';
import { getSelectedFlat } from '../../components/FlatSelectionDialog';
import { getMasterConfig } from '../../services/masterConfigService';
import ConfirmDialog from '../../components/ConfirmDialog';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getDatePickerFormat, formatDate } from '../../utils/dateUtils';
import UpiPaymentCard from '../../components/UpiPaymentCard';
import { cultural, brand, text, surface, overlay } from '../../theme/colorTokens';
import { FormControlLabel } from '@mui/material';

const CulturalSection = () => {
  const { eventId } = useParams();
  const [selectedFlatState, setSelectedFlatState] = useState(getSelectedFlat());
  const [form, setForm] = useState({
    participantName: '',
    age: '',
    contactNumber: '',
    flatNumber: selectedFlatState?.flatNumber || '',
    eventId: '',
    selectedDate: null,
    selectedSubEvents: [],
    customFieldResponses: {},
    isGroup: false,
    participants: [{ name: '', age: '' }],
    calculatedAgeGroup: '',
    itemCount: '',
    paymentConfirmed: false,
  });
  
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [refreshList, setRefreshList] = useState(0);
  const [error, setError] = useState('');
  const [appConfig, setAppConfig] = useState(null);
  
  const [myApplications, setMyApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [commentDialog, setCommentDialog] = useState({ open: false, app: null, comment: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [closedLinkedEvent, setClosedLinkedEvent] = useState(null);

  const handleSaveComment = async () => {
    try {
      await updateApplicationComment(commentDialog.app.id, commentDialog.comment);
      setMyApplications(prev => prev.map(a => a.id === commentDialog.app.id ? { ...a, comment: commentDialog.comment } : a));
      setCommentDialog({ open: false, app: null, comment: '' });
    } catch (e) {
      console.error(e);
      alert('Failed to save comment.');
    }
  };

  const isEditable = (app) => {
    const ev = allEvents.find(e => e.id === app.eventId);
    if (!ev || !ev.active) return false;
    if (!ev.eventDate) return true;
    const eventTime = new Date(ev.eventDate).getTime();
    const now = new Date().getTime();
    return (eventTime - now) > 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    const handleFlatChange = () => {
      const flat = getSelectedFlat();
      setSelectedFlatState(flat);
      setForm(prev => ({ ...prev, flatNumber: flat?.flatNumber || '' }));
    };
    window.addEventListener('flatSelectionChanged', handleFlatChange);
    return () => window.removeEventListener('flatSelectionChanged', handleFlatChange);
  }, []);

  useEffect(() => {
    if (eventId && events.length > 0) {
      const matched = events.find(e => e.id === eventId || e.readableId === eventId);
      if (matched && form.eventId === '') {
        setClosedLinkedEvent(null);
        setForm(prev => ({ 
          ...prev, 
          eventId: matched.id, 
          selectedDate: null, 
          selectedSubEvents: [], 
          customFieldResponses: {}, 
          isGroup: false, 
          participants: [{ name: '', age: '' }], 
          calculatedAgeGroup: '', 
          itemCount: '', 
          paymentConfirmed: false 
        }));
      } else if (!matched && allEvents.length > 0) {
        // Event exists but is not active (closed/expired)
        const inactiveMatch = allEvents.find(e => e.id === eventId || e.readableId === eventId);
        if (inactiveMatch) {
          setClosedLinkedEvent(inactiveMatch);
        }
      }
    }
  }, [eventId, events, allEvents, form.eventId]);

  useEffect(() => {
    if (selectedFlatState?.flatNumber) {
      setLoadingApps(true);
      getApplicationsByFlat(selectedFlatState.flatNumber)
        .then(apps => setMyApplications(apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))))
        .catch(err => console.error('Failed to load apps', err))
        .finally(() => setLoadingApps(false));
    } else {
      setMyApplications([]);
    }
  }, [selectedFlatState?.flatNumber, refreshList]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allEventsData, config] = await Promise.all([
          getAllCulturalEvents(),
          getMasterConfig()
        ]);
        setAppConfig(config);
        setAllEvents(allEventsData);
        const activeEvents = allEventsData.filter(e => e.active);
        setEvents(activeEvents);
      } catch (err) {
        console.error('Error loading cultural data', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async () => {
    const selectedEvent = events.find(e => e.id === form.eventId);
    const ageMode = selectedEvent?.ageFieldMode || 'required';
    
    if (!form.isGroup) {
      if (!form.participantName.trim()) { setError('Participant Name is required'); return; }
      if (ageMode === 'required' && (!form.age || isNaN(form.age) || Number(form.age) <= 0)) { setError('Valid Age is required'); return; }
      if (ageMode === 'optional' && form.age && (isNaN(form.age) || Number(form.age) <= 0)) { setError('Please enter a valid age'); return; }
    }

    if (!form.contactNumber.trim() || !/^\+?[0-9\s-]{10,12}$/.test(form.contactNumber.trim())) {
      setError('Please enter a valid contact number (10-12 digits)'); return;
    }
    if (!form.flatNumber.trim()) { setError('Flat Number is required'); return; }
    if (!form.eventId) { setError('Please select an event'); return; }

    setSubmitting(true);
    setError('');

    // Validate participants if group
    if (selectedEvent?.allowGroupRegistration && form.isGroup) {
      if (form.participants.length === 0) { setError('At least one participant is required'); return; }
      const ageReq = (selectedEvent?.ageFieldMode || 'required') === 'required';
      const hasInvalid = form.participants.some(p => !p.name.trim() || (ageReq && (!p.age || isNaN(p.age) || Number(p.age) <= 0)));
      if (hasInvalid) { setError(ageReq ? 'All participants must have a valid name and age' : 'All participants must have a valid name'); return; }
    }

    try {
      const capacityConsumed = selectedEvent?.maxItems > 0 ? (Number(form.itemCount) || 1) : 1;
      if (selectedEvent?.maxCapacity > 0 && (selectedEvent.applicationCount || 0) + capacityConsumed > selectedEvent.maxCapacity) {
        setError('Not enough capacity left for this selection.');
        setSubmitting(false);
        return;
      }
      
      const status = 'confirmed';

      // Calculate Age Group
      let calculatedAgeGroup = '';
      const culturalAgeGroups = appConfig?.culturalAgeGroups || [];
      if (culturalAgeGroups.length > 0) {
        if ((selectedEvent.ageFieldMode || 'required') === 'age-group' && form.calculatedAgeGroup) {
          // User self-selected their age group
          calculatedAgeGroup = form.calculatedAgeGroup;
        } else if ((selectedEvent.ageFieldMode || 'required') !== 'hidden' && (selectedEvent.ageFieldMode || 'required') !== 'age-group') {
          // Auto-calculate from age
          const maxAge = (selectedEvent.allowGroupRegistration && form.isGroup) 
            ? Math.max(...form.participants.map(p => Number(p.age) || 0))
            : Number(form.age);
          
          const matchedGroup = culturalAgeGroups.find(g => maxAge >= g.min && maxAge <= g.max);
          if (matchedGroup) {
            calculatedAgeGroup = matchedGroup.name;
          }
        }
      }

      await submitCulturalApplication({
        ...form,
        age: (selectedEvent.ageFieldMode || 'required') === 'age-group' ? null : form.age,
        eventName: selectedEvent?.title || '',
        selectedDate: form.selectedDate ? form.selectedDate.toISOString() : null,
        selectedSubEvents: form.selectedSubEvents || [],
        customFieldResponses: form.customFieldResponses || {},
        status,
        calculatedAgeGroup,
        itemCount: Number(form.itemCount) || 0,
        amountPaid: selectedEvent?.isPaidEvent ? (Number(form.itemCount) || 0) * (selectedEvent.itemCost || 0) : 0,
        paymentConfirmed: !!form.paymentConfirmed,
        capacityConsumed,
      });
      setForm(prev => ({ ...prev, participantName: '', age: '', contactNumber: '', selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', itemCount: '', paymentConfirmed: false }));
      setSnackbar({ open: true, message: 'Application submitted successfully!' });
      setRefreshList(prev => prev + 1);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      console.error('Application submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvents) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: cultural.pink }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '8px',
            background: cultural.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <EventIcon sx={{ color: text.white, fontSize: 16 }} />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>Events</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
            Register to participate in upcoming events
          </Typography>
        </Box>
      </Box>

      {closedLinkedEvent && (
        <Card sx={{ mb: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{
            background: (theme) => cultural.closedBg(theme.palette.mode === 'dark'),
            p: { xs: 2, sm: 3 },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                background: cultural.closedGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <EventBusyIcon sx={{ color: text.white, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                  {closedLinkedEvent.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Event ID: {closedLinkedEvent.readableId || closedLinkedEvent.id}
                </Typography>
              </Box>
            </Box>
            <Alert 
              severity="warning" 
              icon={<BlockIcon />}
              sx={{ 
                borderRadius: 1.5,
                '& .MuiAlert-message': { fontWeight: 500 },
              }}
            >
              This event is no longer accepting registrations.{' '}
              {closedLinkedEvent.lastDateToApply && new Date(closedLinkedEvent.lastDateToApply).setHours(23, 59, 59, 999) < new Date().getTime()
                ? `The last date to apply was ${new Date(closedLinkedEvent.lastDateToApply).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.`
                : 'The event has been closed by the organizers.'
              }
            </Alert>
            {closedLinkedEvent.description && (
              <Typography variant="body2" sx={{ mt: 1.5, color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {closedLinkedEvent.description}
              </Typography>
            )}
            {closedLinkedEvent.eventDate && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                Event Date: {new Date(closedLinkedEvent.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {closedLinkedEvent.eventEndDate && closedLinkedEvent.eventDate !== closedLinkedEvent.eventEndDate
                  ? ` — ${new Date(closedLinkedEvent.eventEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : ''
                }
              </Typography>
            )}
          </Box>
        </Card>
      )}

      {events.length === 0 && !closedLinkedEvent ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              There are no active events at the moment.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            {error && (
              <Fade in>
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                  {error}
                </Alert>
              </Fade>
            )}

            {(() => {
              const selectedEvent = events.find(e => e.id === form.eventId);
              const isLastDatePassed = selectedEvent?.lastDateToApply && new Date(selectedEvent.lastDateToApply).setHours(23, 59, 59, 999) < new Date().getTime();
              const hasDateRange = selectedEvent?.eventDate && selectedEvent?.eventEndDate && selectedEvent.eventDate !== selectedEvent.eventEndDate && !selectedEvent?.isTentative;
              const isTentativeDateRange = selectedEvent?.eventDate && selectedEvent?.eventEndDate && selectedEvent?.isTentative;
              const hasSubEvents = selectedEvent?.subEvents && selectedEvent.subEvents.length > 0;
              const ageMode = selectedEvent?.ageFieldMode || 'required';
              const culturalAgeGroups = appConfig?.culturalAgeGroups || [];
              const hasAgeGroups = culturalAgeGroups.length > 0;
              const showAgeField = ageMode !== 'hidden' && ageMode !== 'age-group';
              const showAgeGroupPicker = ageMode === 'age-group' && hasAgeGroups;
              
              const capacityConsumed = selectedEvent?.maxItems > 0 ? (Number(form.itemCount) || 1) : 1;
              const isCapacityFull = selectedEvent?.maxCapacity > 0 && ((selectedEvent.applicationCount || 0) + capacityConsumed > selectedEvent.maxCapacity);

              return (
                <>
                  {isLastDatePassed && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      The last date to apply for this event has passed.
                    </Alert>
                  )}
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl size="small" fullWidth required>
                        <InputLabel>Select Event</InputLabel>
                        <Select
                          value={form.eventId}
                          onChange={(e) => setForm({ ...form, eventId: e.target.value, selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', itemCount: '', paymentConfirmed: false })}
                          label="Select Event"
                        >
                          <MenuItem value=""><em>-- Select an Event --</em></MenuItem>
                          {events.map((ev) => (
                            <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Flat Number"
                        value={form.flatNumber}
                        onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                        size="small"
                        fullWidth
                        required
                        placeholder="e.g., 5/3A"
                        slotProps={{ htmlInput: { maxLength: 50 } }}
                      />
                    </Grid>
                    {selectedEvent?.description && (
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{
                          p: { xs: 1.5, sm: 2 },
                          borderRadius: '8px',
                          borderLeft: '4px solid',
                          borderLeftColor: cultural.pink,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? cultural.bgMedium : cultural.bgSubtle,
                          backdropFilter: 'blur(4px)',
                        }}>
                          <Typography variant="body2" sx={{ color: 'text.primary', whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                            {selectedEvent.description}
                          </Typography>
                        </Box>
                      </Grid>
                    )}
                    {selectedEvent?.allowGroupRegistration && (
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', p: { xs: 1.5, sm: 2 }, mt: 1, borderRadius: 1, bgcolor: 'background.paper' }}>
                          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5, mb: form.isGroup ? 2.5 : 0 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>Registration Type</Typography>
                            <ButtonGroup size="small" disableElevation sx={{ width: { xs: '100%', sm: 'auto' } }}>
                              <Button 
                                variant={!form.isGroup ? "contained" : "outlined"} 
                                onClick={() => setForm({...form, isGroup: false})}
                                sx={{ flex: { xs: 1, sm: 'none' }, fontWeight: !form.isGroup ? 600 : 400 }}
                              >
                                Solo
                              </Button>
                              <Button 
                                variant={form.isGroup ? "contained" : "outlined"} 
                                onClick={() => setForm({...form, isGroup: true})}
                                sx={{ flex: { xs: 1, sm: 'none' }, fontWeight: form.isGroup ? 600 : 400 }}
                              >
                                Group / Team
                              </Button>
                            </ButtonGroup>
                          </Box>
                          
                          {form.isGroup && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {form.participants.map((p, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center', width: '100%' }}>
                                  <TextField fullWidth size="small" label={`Participant ${idx + 1} Name`} required value={p.name} sx={{ flex: 1 }} onChange={e => { const pts = [...form.participants]; pts[idx].name = e.target.value; setForm({...form, participants: pts}); }} />
                                  
                                  {showAgeField && (
                                    <TextField size="small" label="Age" type="number" required={ageMode === 'required'} value={p.age} sx={{ width: { xs: '80px', sm: '120px' } }} onChange={e => { const pts = [...form.participants]; pts[idx].age = e.target.value; setForm({...form, participants: pts}); }} />
                                  )}
                                  
                                  {form.participants.length > 1 && (
                                    <IconButton color="error" size="small" onClick={() => { const pts = [...form.participants]; pts.splice(idx, 1); setForm({...form, participants: pts}); }} sx={{ ml: { xs: -1, sm: 0 } }}>
                                      <DeleteIcon fontSize="small"/>
                                    </IconButton>
                                  )}
                                </Box>
                              ))}
                              <Button 
                                size="small" 
                                variant="outlined" 
                                sx={{ alignSelf: 'flex-start', mt: 0.5, borderRadius: 1, textTransform: 'none', fontWeight: 600 }} 
                                onClick={() => setForm({...form, participants: [...form.participants, { name: '', age: '' }]})}
                              >
                                + Add Participant
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}

                    {(!selectedEvent?.allowGroupRegistration || !form.isGroup) && (
                      <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Participant Name"
                            value={form.participantName}
                            onChange={(e) => setForm({ ...form, participantName: e.target.value })}
                            size="small"
                            fullWidth
                            required
                            placeholder="Name of the participant"
                            slotProps={{ htmlInput: { maxLength: 100 } }}
                          />
                        </Grid>
                        {showAgeField && (
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <TextField
                            label="Age"
                            type="number"
                            value={form.age}
                            onChange={(e) => setForm({ ...form, age: e.target.value })}
                            size="small"
                            fullWidth
                            required={ageMode === 'required'}
                            placeholder="Age"
                          />
                        </Grid>
                        )}
                      </>
                    )}
                    {showAgeGroupPicker && (
                      <Grid size={{ xs: 12, sm: form.isGroup ? 6 : 3 }}>
                        <FormControl size="small" fullWidth required>
                          <InputLabel>Age Group</InputLabel>
                          <Select
                            value={form.calculatedAgeGroup || ''}
                            onChange={(e) => setForm({ ...form, calculatedAgeGroup: e.target.value })}
                            label="Age Group"
                          >
                            <MenuItem value=""><em>-- Select Age Group --</em></MenuItem>
                            {(appConfig?.culturalAgeGroups || []).map((ag) => (
                              <MenuItem key={ag.name} value={ag.name}>{ag.name} ({ag.min}-{ag.max} yrs)</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, sm: (!form.isGroup && (showAgeField || showAgeGroupPicker)) ? 3 : 6 }}>
                      <TextField
                        label="Contact Number"
                        value={form.contactNumber}
                        onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                        size="small"
                        fullWidth
                        required
                        placeholder="e.g., 9876543210"
                        slotProps={{ htmlInput: { maxLength: 20 } }}
                      />
                    </Grid>
                    {hasDateRange && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <DatePicker
                          label="Select Date"
                          value={form.selectedDate}
                          onChange={(newValue) => setForm({ ...form, selectedDate: newValue })}
                          minDate={new Date(selectedEvent.eventDate)}
                          maxDate={new Date(selectedEvent.eventEndDate)}
                          format={getDatePickerFormat(appConfig?.dateFormat)}
                          sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small', fullWidth: true, required: true } }}
                        />
                      </Grid>
                    )}
                    {isTentativeDateRange && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="info" variant="outlined" sx={{ py: 0, px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2">
                            <strong>Tentative Dates:</strong> {formatDate(selectedEvent.eventDate, appConfig?.dateFormat)} to {formatDate(selectedEvent.eventEndDate, appConfig?.dateFormat)} <em>(Subject to change. Exact date/time will be communicated later.)</em>
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    {selectedEvent?.eventDate && (!selectedEvent?.eventEndDate || selectedEvent.eventDate === selectedEvent.eventEndDate) && !selectedEvent?.isTentative && (
                      <Grid size={{ xs: 12 }}>
                        <Alert severity="info" variant="outlined" sx={{ py: 0, px: 2, display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2">
                            <strong>Event Date:</strong> {formatDate(selectedEvent.eventDate, appConfig?.dateFormat)}
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                    {hasSubEvents && (
                      <Grid size={{ xs: 12 }}>
                        <FormControl size="small" fullWidth required>
                          <InputLabel>Select Competitions</InputLabel>
                          <Select
                            multiple
                            value={form.selectedSubEvents || []}
                            onChange={(e) => setForm({ ...form, selectedSubEvents: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                            label="Select Competitions"
                            renderValue={(selected) => selected.join(', ')}
                          >
                            {selectedEvent.subEvents.map((sub) => (
                              <MenuItem key={sub} value={sub}>
                                <Checkbox checked={(form.selectedSubEvents || []).indexOf(sub) > -1} />
                                <ListItemText primary={sub} />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    {selectedEvent?.customFields && selectedEvent.customFields.map((cf, i) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={i}>
                        {cf.type === 'text' && (
                          <TextField fullWidth size="small" label={cf.label} required={cf.required} value={form.customFieldResponses[cf.label] || ''} onChange={e => setForm({...form, customFieldResponses: {...form.customFieldResponses, [cf.label]: e.target.value}})} />
                        )}
                        {(cf.type === 'single-choice' || cf.type === 'select' || cf.type === 'radio') && (
                          <>
                            <FormControl size="small" fullWidth required={cf.required}>
                              <InputLabel>{cf.label}</InputLabel>
                              <Select value={form.customFieldResponses[cf.label] || ''} onChange={e => setForm({...form, customFieldResponses: {...form.customFieldResponses, [cf.label]: e.target.value}})} label={cf.label}>
                                {cf.options.split(',').map(o => o.trim()).map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                              </Select>
                            </FormControl>
                            {form.customFieldResponses[cf.label] === 'Other' && (
                               <TextField fullWidth size="small" label="Please specify" sx={{ mt: 1 }} value={form.customFieldResponses[`${cf.label}_other`] || ''} onChange={e => setForm({...form, customFieldResponses: {...form.customFieldResponses, [`${cf.label}_other`]: e.target.value}})} required={cf.required} />
                            )}
                          </>
                        )}
                        {cf.type === 'multi-choice' && (
                          <>
                            <FormControl size="small" fullWidth required={cf.required}>
                              <InputLabel>{cf.label}</InputLabel>
                              <Select multiple value={form.customFieldResponses[cf.label] || []} onChange={e => setForm({...form, customFieldResponses: {...form.customFieldResponses, [cf.label]: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value}})} label={cf.label} renderValue={(selected) => selected.join(', ')}>
                                {cf.options.split(',').map(o => o.trim()).map(o => (
                                  <MenuItem key={o} value={o}>
                                    <Checkbox checked={(form.customFieldResponses[cf.label] || []).indexOf(o) > -1} />
                                    <ListItemText primary={o} />
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {(form.customFieldResponses[cf.label] || []).includes('Other') && (
                               <TextField fullWidth size="small" label="Please specify" sx={{ mt: 1 }} value={form.customFieldResponses[`${cf.label}_other`] || ''} onChange={e => setForm({...form, customFieldResponses: {...form.customFieldResponses, [`${cf.label}_other`]: e.target.value}})} required={cf.required} />
                            )}
                          </>
                        )}
                      </Grid>
                    ))}
                    {selectedEvent?.isPaidEvent && (
                      <Grid size={{ xs: 12 }}>
                        <Box sx={{ border: `1px solid ${brand.gold}`, borderRadius: 2, p: 2, backgroundColor: overlay.goldXLight(false), mt: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 2, color: brand.orangeDark }}>Payment Details</Typography>
                          <TextField
                            label={`Number of ${selectedEvent.itemLabel || 'Item'}(s)`}
                            type="number"
                            size="small"
                            value={form.itemCount}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              const finalVal = selectedEvent.maxItems ? Math.min(val, selectedEvent.maxItems) : val;
                              setForm({ ...form, itemCount: finalVal || '' });
                            }}
                            helperText={`Cost: ₹${selectedEvent.itemCost} per ${selectedEvent.itemLabel || 'Item'}${selectedEvent.maxItems ? ` (Max ${selectedEvent.maxItems})` : ''}`}
                            sx={{ mb: 1 }}
                          />
                          {Number(form.itemCount) > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <UpiPaymentCard
                                flatNumber={form.flatNumber}
                                amount={Number(form.itemCount) * selectedEvent.itemCost}
                                mode="event"
                                pa={appConfig?.upiPayeeAddress}
                                pn={appConfig?.upiPayeeName}
                                mc={appConfig?.upiMerchantCode}
                                tn={selectedEvent.paymentPrefix || selectedEvent.title || 'Event'}
                                societyName={appConfig?.societyName}
                                committeeName={appConfig?.committeeName}
                                year={appConfig?.currentYear}
                                bankName={appConfig?.bankName}
                                bankAccountNumber={appConfig?.bankAccountNumber}
                                bankIfscCode={appConfig?.bankIfscCode}
                                chequeFavourName={appConfig?.chequeFavourName}
                                enabledUpiApps={appConfig?.enabledUpiApps}
                                whatsappGroupLink={appConfig?.whatsappGroupLink}
                              />
                              <FormControlLabel
                                control={<Checkbox checked={form.paymentConfirmed} onChange={(e) => setForm({ ...form, paymentConfirmed: e.target.checked })} />}
                                label={`I confirm that I have completed the payment of ₹${Number(form.itemCount) * selectedEvent.itemCost}`}
                                sx={{ mt: 2 }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 }, justifyContent: { xs: 'center', sm: 'space-between' }, alignItems: 'center', mt: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: { xs: '100%', sm: 'auto' } }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: { xs: 'center', sm: 'left' } }}>
                        Ensure details are correct before submitting.
                      </Typography>
                      {selectedEvent?.maxCapacity > 0 && ((selectedEvent.applicationCount || 0) >= selectedEvent.maxCapacity ? (
                        <Typography variant="caption" sx={{ color: 'error.main', textAlign: { xs: 'center', sm: 'left' }, fontWeight: 'bold' }}>
                          Notice: Event capacity is full. No further applications are being accepted.
                        </Typography>
                      ) : (selectedEvent.applicationCount || 0) + capacityConsumed > selectedEvent.maxCapacity ? (
                        <Typography variant="caption" sx={{ color: 'error.main', textAlign: { xs: 'center', sm: 'left' }, fontWeight: 'bold' }}>
                          Notice: Only {selectedEvent.maxCapacity - (selectedEvent.applicationCount || 0)} spot(s) left. Please reduce item quantity.
                        </Typography>
                      ) : null)}
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                      onClick={handleSubmit}
                      disabled={submitting || isLastDatePassed || isCapacityFull || (!form.isGroup && !form.participantName.trim()) || !form.contactNumber.trim() || !form.flatNumber.trim() || (!form.isGroup && ageMode === 'required' && !form.age) || !form.eventId || (hasDateRange && !form.selectedDate) || (hasSubEvents && form.selectedSubEvents.length === 0) || (showAgeGroupPicker && !form.calculatedAgeGroup) || (selectedEvent?.customFields?.some(cf => cf.required && (!form.customFieldResponses[cf.label] || form.customFieldResponses[cf.label].length === 0))) || (selectedEvent?.isPaidEvent && (!form.itemCount || Number(form.itemCount) <= 0 || !form.paymentConfirmed))}
                      sx={{ width: { xs: '100%', sm: 'auto' }, px: 4, backgroundColor: cultural.pink, '&:hover': { backgroundColor: cultural.pinkDark } }}
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </Box>
                </>
              );
            })()}
          </CardContent>
      </Card>
      )}

      {/* Submitted Applications for this Flat */}
      {selectedFlatState?.flatNumber && (
        <Card sx={{ mt: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                Your Applications
              </Typography>
              <Chip
                label={`Flat: ${selectedFlatState.flatNumber}`}
                size="small"
                sx={{ backgroundColor: cultural.bgLight, color: cultural.pink, fontWeight: 600 }}
              />
            </Box>
            
            {loadingApps ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} sx={{ color: cultural.pink }} />
              </Box>
            ) : myApplications.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 2, textAlign: 'center' }}>
                No applications submitted from this flat yet.
              </Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: cultural.bgSubtle }}>
                      <TableCell><strong>Event Name</strong></TableCell>
                      <TableCell><strong>Participant</strong></TableCell>
                      {myApplications.some(app => { const ev = allEvents.find(e => e.id === app.eventId); return ev && ev.ageFieldMode !== 'hidden'; }) && (
                        <TableCell><strong>Age / Group</strong></TableCell>
                      )}
                      {myApplications.some(app => app.selectedDate) && (
                        <TableCell><strong>Selected Date</strong></TableCell>
                      )}
                      {myApplications.some(app => app.selectedSubEvents && app.selectedSubEvents.length > 0) && (
                        <TableCell><strong>Competitions</strong></TableCell>
                      )}
                      {myApplications.some(a => a.customFieldResponses && Object.keys(a.customFieldResponses).length > 0) && (
                        <TableCell><strong>Custom Fields</strong></TableCell>
                      )}
                      {myApplications.some(app => allEvents.find(e => e.id === app.eventId)?.isPaidEvent) && (
                        <TableCell><strong>Payment Status</strong></TableCell>
                      )}
                      <TableCell><strong>Comment</strong></TableCell>
                      <TableCell align="right"><strong>Applied On</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myApplications.map((app) => {
                      const editable = isEditable(app);
                      return (
                        <TableRow key={app.id}>
                          <TableCell>{app.eventName}</TableCell>
                          <TableCell>
                            {app.isGroup ? app.participants?.map(p => p.name).join(', ') : app.participantName}
                          </TableCell>
                          {allEvents.some(e => myApplications.some(a => a.eventId === e.id) && e.ageFieldMode !== 'hidden') && (
                            <TableCell>
                              {allEvents.find(e => e.id === app.eventId)?.ageFieldMode === 'hidden' ? '-' : (
                                app.isGroup 
                                  ? (app.participants?.map(p => p.age).filter(Boolean).join(', ') || app.calculatedAgeGroup || '-') 
                                  : (app.age || app.calculatedAgeGroup || '-')
                              )}
                            </TableCell>
                          )}
                          {myApplications.some(a => a.selectedDate) && (
                            <TableCell>{app.selectedDate ? formatDate(app.selectedDate, appConfig?.dateFormat) : '-'}</TableCell>
                          )}
                          {myApplications.some(a => a.selectedSubEvents && a.selectedSubEvents.length > 0) && (
                            <TableCell>{app.selectedSubEvents && app.selectedSubEvents.length > 0 ? app.selectedSubEvents.join(', ') : '-'}</TableCell>
                          )}
                          {myApplications.some(a => a.customFieldResponses && Object.keys(a.customFieldResponses).length > 0) && (
                            <TableCell>
                               {app.customFieldResponses && Object.keys(app.customFieldResponses).length > 0 ? (
                                 Object.keys(app.customFieldResponses).filter(k => !k.endsWith('_other')).map(k => {
                                   // Check if this field is sensitive
                                   const ev = allEvents.find(e => e.id === app.eventId);
                                   const cfDef = ev?.customFields?.find(cf => cf.label === k);
                                   if (cfDef?.sensitive) {
                                     return <div key={k}><strong>{k}:</strong> •••</div>;
                                   }
                                   let val = app.customFieldResponses[k];
                                   if (Array.isArray(val)) val = val.join(', ');
                                   if (val === 'Other' && app.customFieldResponses[`${k}_other`]) val = `Other (${app.customFieldResponses[`${k}_other`]})`;
                                   else if (typeof val === 'string' && val.includes('Other') && app.customFieldResponses[`${k}_other`]) val = val.replace('Other', `Other (${app.customFieldResponses[`${k}_other`]})`);
                                   return <div key={k}><strong>{k}:</strong> {val}</div>
                                 })
                               ) : '-'}
                            </TableCell>
                          )}
                          {myApplications.some(app => allEvents.find(e => e.id === app.eventId)?.isPaidEvent) && (
                            <TableCell>
                              {allEvents.find(e => e.id === app.eventId)?.isPaidEvent ? (
                                app.adminPaymentConfirmed ? (
                                  <Chip size="small" label="Paid" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                                ) : app.paymentConfirmed ? (
                                  <Chip size="small" label="In Review" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                                ) : (
                                  <Chip size="small" label="Pending" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                                )
                              ) : '-'}
                            </TableCell>
                          )}
                          <TableCell>{app.comment || '-'}</TableCell>
                          <TableCell align="right">{formatDateTime(app.createdAt, appConfig?.dateFormat)}</TableCell>
                          <TableCell align="right">
                             {editable ? (
                               <>
                                 <IconButton size="small" sx={{ color: brand.orange, mr: 1 }} onClick={() => setCommentDialog({ open: true, app, comment: app.comment || '' })}>
                                   <CommentIcon fontSize="small" />
                                 </IconButton>
                               </>
                             ) : (
                               <Typography variant="caption" sx={{ color: 'text.secondary' }}>Locked</Typography>
                             )}
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
      )}

      <Dialog open={commentDialog.open} onClose={() => setCommentDialog({ open: false, app: null, comment: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Adding comment for <strong>{commentDialog.app?.participantName}</strong> ({commentDialog.app?.eventName})
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Type your comment here..."
            value={commentDialog.comment}
            onChange={(e) => setCommentDialog({ ...commentDialog, comment: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, app: null, comment: '' })}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveComment} sx={{ backgroundColor: cultural.pink, '&:hover': { backgroundColor: cultural.pinkDark } }}>Save</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity="success" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
      />
    </Box>
  );
};

export default CulturalSection;
