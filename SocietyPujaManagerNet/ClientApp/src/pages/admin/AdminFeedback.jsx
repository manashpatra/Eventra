import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Fade,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Feedback as FeedbackIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Reply as ReplyIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getFeedbacks, deleteFeedback, replyToFeedback } from '../../services/publicDataService';
import { getMasterConfig } from '../../services/masterConfigService';
import { formatDateTime } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { brand, surface, text, gradient, statusBadge } from '../../theme/colorTokens';

const CATEGORIES = [
  'All',
  'Suggestion',
  'Complaint',
  'Appreciation',
  'Food Related',
  'Event Related',
  'Other',
];

const getCategoryColor = (cat) => {
  const map = {
    Suggestion: statusBadge.info.text,
    Complaint: statusBadge.error.text,
    Appreciation: statusBadge.success.text,
    'Food Related': statusBadge.warning.text,
    'Event Related': statusBadge.donation.text,
  };
  return map[cat] || text.secondaryDark;
};

const AdminFeedback = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { user } = useAuth();
  const canDeleteFeedback = user?.role !== 'Standard' && user?.role !== 'Auditor';
  const canReply = user?.role !== 'Standard' && user?.role !== 'Auditor';
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
  const [manageDialog, setManageDialog] = useState({ open: false, feedback: null, replyMessage: '' });
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    loadFeedbacks();
    getMasterConfig().then(setAppConfig).catch(() => {});
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const list = await getFeedbacks();
      setFeedbacks(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDialog({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ open: false, id: null });
    if (!id) return;
    try {
      await deleteFeedback(id);
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const handleManageClick = (feedback) => {
    setManageDialog({
      open: true,
      feedback,
      replyMessage: feedback.replyMessage || '',
    });
  };

  const handleConfirmReply = async () => {
    if (!manageDialog.feedback) return;
    const id = manageDialog.feedback.id;
    const replyMsg = manageDialog.replyMessage;
    const repliedBy = user?.displayName || user?.email?.split('@')[0] || 'Admin';

    try {
      await replyToFeedback(id, replyMsg, repliedBy);
      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
              ...item,
              replyMessage: replyMsg,
              repliedBy,
              repliedAt: new Date().toISOString(),
            }
            : item
        )
      );
      setManageDialog({ open: false, feedback: null, replyMessage: '' });
    } catch (error) {
      console.error('Error replying to feedback:', error);
    }
  };

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      const matchCat = filterCategory === 'All' || item.category === filterCategory;
      const matchSearch =
        item.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.flatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phoneNumber?.includes(searchQuery);
      return matchCat && matchSearch;
    });
  }, [feedbacks, filterCategory, searchQuery]);

  return (
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 2, justifyContent: 'flex-end' }}>
          <TextField
            id="search-feedbacks-input"
            name="searchFeedbacks"
            size="small"
            label="Search feedbacks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name, flat, phone, text..."
            slotProps={{ input: {
              startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: 20 }} />,
              endAdornment: searchQuery && (
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            } }}
            sx={{ minWidth: 220, flex: { xs: 1, md: 'auto' } }}
          />

          <FormControl size="small" sx={{ minWidth: 150, flex: { xs: 1, md: 'auto' } }}>
            <InputLabel id="category-filter-label">Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter-select"
              name="categoryFilter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

      {/* Main Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: brand.orange }} />
        </Box>
      ) : (
        <Fade in timeout={400}>
          <Card>
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: { xs: 700, md: 800 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ position: 'sticky', left: 0, zIndex: 2, backgroundColor: 'background.paper', width: 170, minWidth: 170, borderRight: '1px solid rgba(128,128,128,0.2)' }}>Resident Info</TableCell>
                    <TableCell>Flat</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>Message Snippet</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFeedbacks.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ position: 'sticky', left: 0, zIndex: 1, backgroundColor: 'background.paper', width: 170, minWidth: 170, borderRight: '1px solid rgba(128,128,128,0.2)' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.name}
                          </Typography>
                          {item.phoneNumber && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                                {item.phoneNumber}
                              </Typography>
                              <IconButton
                                size="small"
                                component="a"
                                href={`tel:${item.phoneNumber.replace(/\s/g, '')}`}
                                sx={{ p: 0.2, color: statusBadge.success.text }}
                              >
                                <PhoneIcon sx={{ fontSize: 12 }} />
                              </IconButton>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.flatNumber}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            backgroundColor: 'rgba(255,143,0,0.08)',
                            color: brand.gold,
                            border: '1px solid rgba(255,143,0,0.15)',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            backgroundColor: `${getCategoryColor(item.category)}15`,
                            color: getCategoryColor(item.category),
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, py: 1.5 }}>
                        <Typography noWrap variant="body2" sx={{ color: 'text.secondary' }}>
                          {item.message}
                        </Typography>
                        {item.replyMessage && (
                          <Chip size="small" label="Replied" sx={{ height: 20, mt: 0.5, fontSize: '0.65rem', backgroundColor: statusBadge.success.bg, color: statusBadge.success.text }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {formatDateTime(item.createdAt, appConfig?.dateFormat)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title={canReply ? "View & Reply" : "View Feedback"}>
                            <IconButton size="small" onClick={() => handleManageClick(item)} sx={{ color: statusBadge.info.text }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {canDeleteFeedback && (
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteClick(item.id)} sx={{ color: statusBadge.error.text }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredFeedbacks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography sx={{ color: 'text.secondary' }}>
                          No feedbacks found matching selected filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Fade>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Feedback"
        message="Are you sure you want to permanently delete this feedback submission?"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDialog({ open: false, id: null })}
      />

      <Dialog
        open={manageDialog.open}
        onClose={() => setManageDialog({ open: false, feedback: null, replyMessage: '' })}
        maxWidth="lg"
        fullWidth
        slotProps={{ paper: {
          sx: {
            m: { xs: 1, md: 2 },
            width: '100%',
            height: 'calc(100% - 32px)',
            maxHeight: 'none',
            borderRadius: '16px',
            background: isDark ? gradient.surfaceDark : surface.paperLight,
            border: isDark ? '1px solid rgba(255,143,0,0.2)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
          }
        } }}
      >
        <DialogTitle sx={{ fontWeight: 700, p: { xs: 1.5, sm: 2 }, pb: { xs: 1, sm: 1 }, fontSize: '1.1rem' }}>
          Feedback Details
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: canReply ? 'row' : 'column' }, gap: { xs: 1.5, md: 2 }, flex: 1, minHeight: 0 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                Submitted by <strong>{manageDialog.feedback?.name}</strong> (Flat {manageDialog.feedback?.flatNumber}) on {manageDialog.feedback?.createdAt ? new Date(manageDialog.feedback.createdAt).toLocaleDateString('en-IN') : ''}
              </Typography>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '8px',
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.08)',
                  mb: manageDialog.feedback?.replyMessage && !canReply ? 1.5 : 0,
                  flex: 1,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': { width: '4px' },
                  '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(128,128,128,0.3)', borderRadius: '4px' }
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: 'text.primary', lineHeight: 1.5 }}>
                  "{manageDialog.feedback?.message}"
                </Typography>
              </Box>

              {manageDialog.feedback?.replyMessage && !canReply && (
                 <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: 'rgba(255,143,0,0.04)', borderLeft: `3px solid ${brand.orange}` }}>
                   <Typography variant="caption" sx={{ color: brand.gold, fontWeight: 600, display: 'block', mb: 0.5 }}>
                     Replied by {manageDialog.feedback?.repliedBy || 'Admin'}
                   </Typography>
                   <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>{manageDialog.feedback?.replyMessage}</Typography>
                 </Box>
              )}
            </Box>
            {canReply && (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                  Your Response
                </Typography>
                <TextField
                  id="reply-message-input"
                  name="replyMessage"
                  autoFocus
                  multiline
                  fullWidth
                  value={manageDialog.replyMessage}
                  onChange={(e) => setManageDialog({ ...manageDialog, replyMessage: e.target.value })}
                  placeholder="Type your response to the resident here..."
                  variant="outlined"
                  size="small"
                  sx={{ flex: 1, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start', fontSize: '0.85rem', overflowY: 'auto' } }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 1.5, sm: 2 }, pb: { xs: 1.5, sm: 2 }, pt: 1 }}>
          <Button
            onClick={() => setManageDialog({ open: false, feedback: null, replyMessage: '' })}
            variant="outlined"
            size="small"
            sx={{ borderRadius: '10px' }}
          >
            Close
          </Button>
          {canReply && (
            <Button
              onClick={handleConfirmReply}
              variant="contained"
              size="small"
              disabled={!manageDialog.replyMessage?.trim()}
              sx={{ borderRadius: '10px' }}
            >
              {manageDialog.feedback?.replyMessage ? 'Update Reply' : 'Submit Reply'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminFeedback;
