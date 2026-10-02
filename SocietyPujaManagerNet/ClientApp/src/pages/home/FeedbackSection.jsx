import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Send as SendIcon,
  CheckCircle as SuccessIcon,
  Add as AddIcon,
  Apartment as ApartmentIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { submitFeedback, getFeedbacks, getFlatDetails } from '../../services/publicDataService';
import FlatSelectionDialog, { getSelectedFlat } from '../../components/FlatSelectionDialog';
import { getMasterConfig } from '../../services/masterConfigService';
import { gradient, text, status } from '../../theme/colorTokens';

const CATEGORIES = [
  'Suggestion',
  'Complaint',
  'Appreciation',
  'Food Related',
  'Event Related',
  'Other',
];

const RATE_LIMIT_KEY = 'app_feedback_last';
const RATE_LIMIT_MS = 10 * 1000; // 10 seconds cooldown between submissions

const norm = (s) => (s || '').replace(/[\/\s-]/g, '').toLowerCase();

const renderFormattedText = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let currentListType = null;
  let listItems = [];
  let listStartIndex = 0;

  const pushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <Box
          component={currentListType}
          sx={{ mt: 0.5, mb: 1, pl: { xs: 2.5, sm: 3 }, typography: 'body2', marginBlockStart: 0, marginBlockEnd: 0 }}
          key={`list-${listStartIndex}`}
        >
          {listItems}
        </Box>
      );
      listItems = [];
      currentListType = null;
    }
  };

  lines.forEach((line, index) => {
    const olMatch = line.match(/^(\d+)\.\s+(.*)/);
    const ulMatch = line.match(/^([-\*])\s+(.*)/);
    
    if (olMatch) {
      if (currentListType === 'ul') pushList();
      if (!currentListType) {
        currentListType = 'ol';
        listStartIndex = index;
      }
      listItems.push(<li key={index} value={parseInt(olMatch[1], 10)}>{olMatch[2]}</li>);
    } else if (ulMatch) {
      if (currentListType === 'ol') pushList();
      if (!currentListType) {
        currentListType = 'ul';
        listStartIndex = index;
      }
      listItems.push(<li key={index}>{ulMatch[2]}</li>);
    } else {
      pushList();
      elements.push(
        <Typography variant="body2" key={`text-${index}`} sx={{ minHeight: line.trim() === '' ? '1.2em' : 'auto' }}>
          {line}
        </Typography>
      );
    }
  });
  
  pushList();
  return <Box>{elements}</Box>;
};

const FeedbackSection = () => {
  const [selectedFlat, setSelectedFlat] = useState(() => getSelectedFlat());
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    flatNumber: getSelectedFlat()?.flatNumber || '',
    category: 'Suggestion',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [appConfig, setAppConfig] = useState(null);
  const [pastFeedbacks, setPastFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    getMasterConfig().then(setAppConfig).catch(() => { });
  }, []);

  // Sync selected flat across custom events
  useEffect(() => {
    const handleFlatChange = (e) => {
      const flat = e?.detail || getSelectedFlat();
      setSelectedFlat(flat);
      if (flat?.flatNumber) {
        setForm((prev) => ({
          ...prev,
          flatNumber: flat.flatNumber,
        }));
      }
    };

    window.addEventListener('flatSelectionChanged', handleFlatChange);
    return () => {
      window.removeEventListener('flatSelectionChanged', handleFlatChange);
    };
  }, []);

  // Fetch resident name & phone number for selected flat if not yet entered
  useEffect(() => {
    if (selectedFlat?.flatNumber) {
      getFlatDetails(selectedFlat.flatNumberForLookup || selectedFlat.flatNumber)
        .then((data) => {
          if (data?.resident) {
            setForm((prev) => ({
              ...prev,
              name: prev.name || data.resident.name || '',
              phoneNumber: prev.phoneNumber || data.resident.phoneNumber || '',
            }));
          }
        })
        .catch(() => {});
    }
  }, [selectedFlat]);

  const loadFeedbacks = useCallback(async () => {
    const flat = selectedFlat || getSelectedFlat();
    if (!flat?.flatNumber) return;

    setLoadingFeedbacks(true);
    try {
      const targetFlatNorm = norm(flat.flatNumber);
      let myFeedbacks = [];

      try {
        const flatData = await getFlatDetails(flat.flatNumberForLookup || flat.flatNumber);
        if (flatData?.feedbacks && Array.isArray(flatData.feedbacks) && flatData.feedbacks.length > 0) {
          myFeedbacks = flatData.feedbacks;
        }
      } catch (err) {
        // Fallback to all feedbacks
      }

      if (!myFeedbacks.length) {
        const allFeedbacks = await getFeedbacks();
        myFeedbacks = (allFeedbacks || []).filter(
          (fb) => norm(fb.flatNumber) === targetFlatNorm
        );
      }

      setPastFeedbacks(myFeedbacks);
    } catch (err) {
      console.error('Failed to load feedbacks:', err);
    } finally {
      setLoadingFeedbacks(false);
    }
  }, [selectedFlat]);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  const isRateLimited = () => {
    try {
      const lastSubmitted = localStorage.getItem(RATE_LIMIT_KEY);
      if (!lastSubmitted) return false;
      return Date.now() - parseInt(lastSubmitted, 10) < RATE_LIMIT_MS;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Name is required to submit feedback');
      return;
    }
    if (!form.phoneNumber.trim() || !/^\+?[0-9\s-]{10,12}$/.test(form.phoneNumber.trim())) {
      setError('Please enter a valid phone number (10-12 digits)');
      return;
    }
    if (!form.flatNumber.trim()) {
      setError('Flat number is required to submit feedback');
      return;
    }
    if (!form.message.trim()) {
      setError('Please enter your feedback message');
      return;
    }
    if (isRateLimited()) {
      setError('Please wait a few moments before submitting again.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');
    try {
      const saved = await submitFeedback(form);
      localStorage.setItem(RATE_LIMIT_KEY, Date.now().toString());
      setSuccessMsg('Thank you! Your feedback has been submitted successfully to the committee.');
      setSubmitted(true);
      // Keep name, phone, flat populated, clear message
      setForm((prev) => ({
        ...prev,
        message: '',
      }));
      loadFeedbacks();
    } catch (err) {
      setError('Failed to submit feedback. Please check your network and try again.');
      console.error('Feedback submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: gradient.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(255,143,0,0.3)',
            }}
          >
            <FeedbackIcon sx={{ color: text.white, fontSize: 20 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              Feedback & Suggestions
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2, fontSize: '0.75rem' }}>
              Share your thoughts, suggestions, or appreciation with {appConfig?.societyName ? `${appConfig.societyName} Committee` : 'the Committee'}
            </Typography>
          </Box>
        </Box>

        {selectedFlat ? (
          <Chip
            icon={<ApartmentIcon sx={{ fontSize: 16 }} />}
            label={`Flat ${selectedFlat.flatNumber}`}
            variant="outlined"
            onClick={() => setDialogOpen(true)}
            sx={{
              fontWeight: 700,
              borderColor: 'rgba(255,143,0,0.4)',
              color: '#FF8F00',
              cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(255,143,0,0.08)' },
            }}
          />
        ) : (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ApartmentIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ borderRadius: '10px', color: '#FF8F00', borderColor: 'rgba(255,143,0,0.4)' }}
          >
            Select Flat
          </Button>
        )}
      </Box>

      {/* Main Feedback Form Card */}
      <Fade in timeout={400}>
        <Card sx={{ mb: 3, borderRadius: '16px', border: '1px solid rgba(255,143,0,0.15)', overflow: 'hidden' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {error && (
              <Fade in>
                <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setError('')}>
                  {error}
                </Alert>
              </Fade>
            )}

            {successMsg && (
              <Fade in>
                <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }} onClose={() => setSuccessMsg('')}>
                  {successMsg}
                </Alert>
              </Fade>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
              <TextField
                label="Your Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                size="small"
                required
                placeholder="Your full name"
                sx={{ flex: { xs: '1 1 100%', sm: 1.5 }, minWidth: { xs: '100%', sm: 180 } }}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
              <TextField
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                size="small"
                required
                placeholder="e.g., 9876543210"
                sx={{ flex: { xs: '1 1 100%', sm: 1.2 }, minWidth: { xs: '100%', sm: 160 } }}
                slotProps={{ htmlInput: { maxLength: 20 } }}
              />
              <TextField
                label="Flat Number"
                value={form.flatNumber}
                onChange={(e) => setForm({ ...form, flatNumber: e.target.value })}
                size="small"
                placeholder="e.g., 5/3A"
                required
                sx={{ flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 120 } }}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
              <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: 1.2 }, minWidth: { xs: '100%', sm: 160 } }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  label="Category"
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              label="Your Feedback / Suggestion"
              multiline
              rows={4}
              fullWidth
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Share your thoughts, suggestions, complaints, or appreciation with the committee..."
              required
              sx={{ mb: 2.5 }}
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Your feedback helps us continuously improve the puja celebrations.
              </Typography>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || !form.name.trim() || !form.phoneNumber.trim() || !form.flatNumber.trim() || !form.message.trim()}
                sx={{
                  borderRadius: '12px',
                  px: 4,
                  py: 1,
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #FFA000 0%, #E65100 100%)',
                  },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Fade>

      {/* Past Feedbacks Section */}
      <Box sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <HistoryIcon sx={{ color: '#FF8F00', fontSize: 20 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Your Flat's Feedbacks
          </Typography>
          {pastFeedbacks.length > 0 && (
            <Chip
              label={pastFeedbacks.length}
              size="small"
              sx={{ bgcolor: 'rgba(255,143,0,0.12)', color: '#FF8F00', fontWeight: 700, height: 22 }}
            />
          )}
        </Box>

        {loadingFeedbacks && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} sx={{ color: '#FF8F00' }} />
          </Box>
        )}

        {!loadingFeedbacks && pastFeedbacks.length === 0 && (
          <Card sx={{ borderRadius: '12px', textAlign: 'center', py: 4, bgcolor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {selectedFlat?.flatNumber 
                  ? `No feedbacks submitted for Flat ${selectedFlat.flatNumber} yet. Share your first feedback above!` 
                  : 'Select your flat to view your past feedbacks and replies from the committee.'}
              </Typography>
            </CardContent>
          </Card>
        )}

        {!loadingFeedbacks && pastFeedbacks.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pastFeedbacks.map((fb) => (
              <Card
                key={fb.id}
                sx={{
                  borderRadius: '12px',
                  bgcolor: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: 'none',
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={fb.category}
                        size="small"
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(255,143,0,0.12)',
                          color: '#FF8F00',
                          height: 22,
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </Typography>
                    </Box>
                    <Chip 
                      label={fb.replyMessage ? 'Replied' : 'Pending Review'} 
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: fb.replyMessage ? 'rgba(102,187,106,0.15)' : 'rgba(255,167,38,0.15)',
                        color: fb.replyMessage ? '#66BB6A' : '#FFA726',
                        border: '1px solid',
                        borderColor: fb.replyMessage ? 'rgba(102,187,106,0.3)' : 'rgba(255,167,38,0.3)',
                      }}
                    />
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    {renderFormattedText(fb.message)}
                  </Box>

                  {fb.replyMessage && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(102, 187, 106, 0.08)' : 'rgba(46, 125, 50, 0.08)',
                        borderRadius: '8px',
                        borderLeft: (theme) => `3px solid ${status.success.main(theme.palette.mode === 'dark')}`,
                        border: '1px solid rgba(102, 187, 106, 0.15)',
                        borderLeftWidth: '3px',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: (theme) => status.success.main(theme.palette.mode === 'dark'), fontWeight: 700 }}>
                          Reply from {appConfig?.committeeName || 'Committee'}
                        </Typography>
                        {fb.repliedAt && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            {new Date(fb.repliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        )}
                      </Box>
                      {renderFormattedText(fb.replyMessage)}
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Flat Selection Dialog */}
      <FlatSelectionDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(flat) => {
          setSelectedFlat(flat);
          setDialogOpen(false);
          window.dispatchEvent(new CustomEvent('flatSelectionChanged', { detail: flat }));
        }}
        allowClose={true}
      />
    </Box>
  );
};

export default FeedbackSection;
