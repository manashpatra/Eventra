import React, { useState } from 'react';
import { Box, Typography, IconButton, Chip, Paper, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery, useTheme, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { People as PeopleIcon, MoreVert as MoreVertIcon, Edit as EditIcon, Delete as DeleteIcon, Pause as PauseIcon, PlayArrow as PlayArrowIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { formatDate } from '../../../utils/dateUtils';
import { statusBadge } from '../../../theme/colorTokens';

/* ---- Mobile Event Card ---- */
const MobileEventCard = ({ ev, idx, config, onToggleActive, onOpenApplications, onMenuOpen }) => (
  <Paper
    sx={{
      p: 1.5,
      borderRadius: 1,
      border: '1px solid rgba(255,255,255,0.06)',
      bgcolor: 'rgba(0,0,0,0.15)',
      '&:not(:last-child)': { mb: 1 },
    }}
  >
    {/* Row 1: Title + actions */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
          {ev.title} {ev.readableId && <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 'normal', ml: 1 }}>({ev.readableId})</Typography>}
        </Typography>
        {ev.description && (
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.3, mt: 0.25 }} noWrap>{ev.description}</Typography>
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
        <IconButton size="small" onClick={() => onOpenApplications(ev)} sx={{ color: statusBadge.info.text, p: 0.5 }}>
          <PeopleIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <IconButton size="small" onClick={(e) => onMenuOpen(e, idx)} sx={{ p: 0.5 }}>
          <MoreVertIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Box>

    {/* Row 2: Date + Status chips */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center', mt: 1 }}>
      {ev.isTentative && (
        <Chip label="Tentative" size="small" color="warning" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
      )}
      <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
        {ev.eventDate && ev.eventEndDate
          ? `${formatDate(ev.eventDate, config?.dateFormat)} – ${formatDate(ev.eventEndDate, config?.dateFormat)}`
          : ev.eventDate ? formatDate(ev.eventDate, config?.dateFormat) : 'TBA'}
      </Typography>
      <Chip
        label={ev.active ? 'Active' : 'Paused'}
        size="small"
        sx={{
          height: 22,
          fontSize: '0.7rem',
          backgroundColor: (theme) => ev.active ? statusBadge.success.bg : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
          color: ev.active ? statusBadge.success.text : 'text.secondary',
          fontWeight: 600,
        }}
      />
    </Box>

    {/* Row 3: Extra info chips */}
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
      {ev.lastDateToApply && (
        <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.7rem' }}>
          Last Date: {formatDate(ev.lastDateToApply, config?.dateFormat)}
        </Typography>
      )}
      {ev.subEvents && ev.subEvents.length > 0 && (
        <Chip label={`${ev.subEvents.length} Competitions`} size="small" color="info" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
      )}
      {ev.maxCapacity > 0 && (
        <Chip label={`Cap: ${ev.applicationCount || 0}/${ev.maxCapacity}`} size="small" color={(ev.applicationCount || 0) >= ev.maxCapacity ? 'error' : 'default'} variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />
      )}
      {ev.allowGroupRegistration && <Chip label="Groups" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.7rem' }} />}
    </Box>
  </Paper>
);

const EventsListTab = ({ events, config, onToggleActive, onOpenApplications, onEdit, onDelete, showSnackbar }) => {
  const [eventAnchorEl, setEventAnchorEl] = useState(null);
  const [actionEventIdx, setActionEventIdx] = useState(-1);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleMenuOpen = (e, idx) => { 
    setEventAnchorEl(e.currentTarget); 
    setActionEventIdx(idx); 
  };
  
  const handleMenuClose = () => { 
    setEventAnchorEl(null); 
    setActionEventIdx(-1); 
  };

  const handleToggleStatus = () => {
    setConfirmToggleOpen(true);
  };

  const confirmToggle = () => {
    const ev = events[actionEventIdx];
    if (ev) {
      onToggleActive(actionEventIdx, !ev.active);
    }
    setConfirmToggleOpen(false);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit(actionEventIdx);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(actionEventIdx);
    handleMenuClose();
  };

  const handleCopyLink = () => {
    const ev = events[actionEventIdx];
    if (ev) {
      const link = `${window.location.origin}${window.location.pathname}#/events/${ev.readableId || ev.id}`;
      navigator.clipboard.writeText(link).then(() => {
        if (showSnackbar) showSnackbar('Shareable link copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        if (showSnackbar) showSnackbar('Failed to copy link', 'error');
      });
    }
    handleMenuClose();
  };

  return (
    <Box>
      {events.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>No events found.</Typography>
        </Paper>
      ) : isMobile ? (
        /* ===== MOBILE: Card Layout ===== */
        <Box>
          {events.map((ev, idx) => (
            <MobileEventCard
              key={ev.id}
              ev={ev}
              idx={idx}
              config={config}
              onToggleActive={onToggleActive}
              onOpenApplications={onOpenApplications}
              onMenuOpen={handleMenuOpen}
            />
          ))}
        </Box>
      ) : (
        /* ===== DESKTOP: Table Layout ===== */
        <TableContainer component={Paper} sx={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.2)' }}>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 2 }}>Event</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 2 }}>Date</TableCell>
                <TableCell sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 2 }}>Status</TableCell>
                <TableCell align="right" sx={{ color: 'text.secondary', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', py: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((ev, idx) => (
                <TableRow key={ev.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 }, transition: 'background-color 0.2s' }}>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {ev.title} {ev.readableId && <Typography component="span" variant="caption" sx={{ color: 'text.secondary', fontWeight: 'normal', ml: 1 }}>({ev.readableId})</Typography>}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{ev.description}</Typography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {ev.isTentative ? (
                      <Chip label="Tentative" size="small" color="warning" variant="outlined" sx={{ mr: 1, mb: 0.5 }} />
                    ) : null}
                    {ev.eventDate && ev.eventEndDate 
                      ? `${formatDate(ev.eventDate, config?.dateFormat)} - ${formatDate(ev.eventEndDate, config?.dateFormat)}`
                      : (ev.eventDate ? formatDate(ev.eventDate, config?.dateFormat) : 'TBA')}
                    {ev.lastDateToApply && (
                      <Typography variant="caption" display="block" sx={{ color: 'error.main', mt: 0.5 }}>
                        Last Date: {formatDate(ev.lastDateToApply, config?.dateFormat)}
                      </Typography>
                    )}
                    {ev.subEvents && ev.subEvents.length > 0 && (
                      <Chip label={`${ev.subEvents.length} Competitions`} size="small" color="info" variant="outlined" sx={{ mt: 0.5, display: 'block', width: 'fit-content' }} />
                    )}
                    <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {ev.maxCapacity > 0 && (
                        <Chip label={`Cap: ${ev.applicationCount || 0}/${ev.maxCapacity}`} size="small" color={(ev.applicationCount || 0) >= ev.maxCapacity ? 'error' : 'default'} variant="outlined" />
                      )}
                      {ev.allowGroupRegistration && <Chip label="Groups Allowed" size="small" variant="outlined" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={ev.active ? "Active" : "Paused"}
                      size="small"
                      sx={{
                        backgroundColor: (theme) => ev.active ? statusBadge.success.bg : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
                        color: ev.active ? statusBadge.success.text : 'text.secondary',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                       <Tooltip title="View Applications">
                         <IconButton size="small" onClick={() => onOpenApplications(ev)} sx={{ color: statusBadge.info.text }}><PeopleIcon fontSize="small" /></IconButton>
                       </Tooltip>
                       <Tooltip title="More Actions">
                         <IconButton size="small" onClick={(e) => handleMenuOpen(e, idx)}>
                           <MoreVertIcon fontSize="small" />
                         </IconButton>
                       </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Menu
        anchorEl={eventAnchorEl}
        open={Boolean(eventAnchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleToggleStatus}>
          <ListItemIcon>
            {events[actionEventIdx]?.active ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
          </ListItemIcon>
          <ListItemText>
            {events[actionEventIdx]?.active ? "Pause Applications" : "Resume Applications"}
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit Event</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete Event</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={confirmToggleOpen} onClose={() => { setConfirmToggleOpen(false); handleMenuClose(); }}>
        <DialogTitle>
          {events[actionEventIdx]?.active ? 'Pause Applications?' : 'Resume Applications?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {events[actionEventIdx]?.active
              ? `Are you sure you want to pause applications for "${events[actionEventIdx]?.title}"? Users will no longer be able to submit new applications for this event.`
              : `Are you sure you want to resume applications for "${events[actionEventIdx]?.title}"? Users will be able to submit new applications again.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setConfirmToggleOpen(false); handleMenuClose(); }} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmToggle} variant="contained" color={events[actionEventIdx]?.active ? 'warning' : 'success'}>
            {events[actionEventIdx]?.active ? 'Pause' : 'Resume'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventsListTab;
