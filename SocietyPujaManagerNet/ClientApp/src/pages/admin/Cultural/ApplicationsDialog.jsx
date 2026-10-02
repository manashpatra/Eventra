import React, { useState, useMemo } from 'react';
import { Box, Typography, Button, TextField, Grid, Switch, FormControlLabel, IconButton, InputLabel, Select, MenuItem, FormControl, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Checkbox, ListItemText, Tooltip, Menu, ListItemIcon, useMediaQuery, useTheme, Drawer, Divider } from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon, FileDownload as FileDownloadIcon, MoreVert as MoreVertIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Call as CallIcon, CheckCircle as CheckCircleIcon, VerifiedUser as VerifiedUserIcon, People as PeopleIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { submitCulturalApplication, updateCulturalApplication, deleteCulturalApplication, verifyEventPayment } from '../../../services/culturalService';
import { printHTML } from '../../../utils/print/core';
import { getPrintHeaderHTML, getPrintFooterHTML, getPrintHeaderStyles } from '../../../utils/print/shared';
import { formatDate, formatDateTime } from '../../../utils/dateUtils';
import ConfirmDialog from '../../../components/ConfirmDialog';
import ApplicationAddEditDrawer from './ApplicationAddEditDrawer';
import { useAuth } from '../../../contexts/AuthContext';
import { cultural, brand, text, status, printTheme } from '../../../theme/colorTokens';

const ApplicationsDialog = ({ appDialog, setAppDialog, config, showSnackbar }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showAddForm, setShowAddForm] = useState(false);
  const [appFormData, setAppFormData] = useState({ flatNumber: '', participantName: '', age: '', contactNumber: '', comment: '', selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', scheduleTime: '', itemCount: '', amountPaid: 0, adminPaymentConfirmed: false, paymentMode: 'UPI', paymentReference: '' });
  const [editAppId, setEditAppId] = useState(null);
  const [appSearch, setAppSearch] = useState('');
  const [appSort, setAppSort] = useState({ field: '', order: 'asc' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [verifyPaymentDialog, setVerifyPaymentDialog] = useState({ open: false, app: null, paymentMode: 'UPI', paymentReference: '' });
  const [appAnchorEl, setAppAnchorEl] = useState(null);
  const [actionApp, setActionApp] = useState(null);
  const [printAnchorEl, setPrintAnchorEl] = useState(null);

  const handleAppMenuOpen = (e, app) => { setAppAnchorEl(e.currentTarget); setActionApp(app); };
  const handleAppMenuClose = () => { setAppAnchorEl(null); setActionApp(null); };

  const handleAddApplication = async (keepOpen = false) => {
    try {
      let capLimit = appDialog.event.maxCapacity || 0;
      let capacityConsumed = appDialog.event.maxItems > 0 ? (Number(appFormData.itemCount) || 1) : 1;
      let currentCount = appDialog.event.applicationCount || 0;
      if (!editAppId && capLimit > 0 && currentCount + capacityConsumed > capLimit) {
        showSnackbar('Not enough capacity left for this selection.', 'warning');
        return;
      }
      let calculatedAgeGroup = appFormData.calculatedAgeGroup || '';
      const culturalAgeGroups = config?.culturalAgeGroups || [];
      const ageMode = appDialog.event?.ageFieldMode || 'required';
      if (culturalAgeGroups.length > 0) {
        if (ageMode !== 'hidden' && ageMode !== 'age-group') {
          const maxAge = appFormData.isGroup
            ? Math.max(...appFormData.participants.map(p => Number(p.age) || 0))
            : Number(appFormData.age) || 0;
          const matchedGroup = culturalAgeGroups.find(g => maxAge >= g.min && maxAge <= g.max);
          if (matchedGroup) {
            calculatedAgeGroup = matchedGroup.name;
          }
        }
      }

      const isAgeGroup = ageMode === 'age-group' || Boolean(appFormData.calculatedAgeGroup);
      const data = {
        eventId: appDialog.event.id,
        eventName: appDialog.event.title,
        ...appFormData,
        calculatedAgeGroup,
        age: isAgeGroup ? null : (Number(appFormData.age) || null),
        capacityConsumed,
        participants: appFormData.isGroup
          ? appFormData.participants.map(p => ({ ...p, age: isAgeGroup ? null : (Number(p.age) || null) }))
          : [],
        selectedDate: appFormData.selectedDate ? appFormData.selectedDate.toISOString() : null,
        ...(appFormData.adminPaymentConfirmed ? { paymentVerifiedBy: user?.displayName || user?.email || 'Admin' } : {})
      };
      if (editAppId) {
        const updated = await updateCulturalApplication(editAppId, data);
        setAppDialog(prev => ({
          ...prev,
          applications: prev.applications.map(a => a.id === editAppId ? { ...a, ...updated } : a)
        }));
        showSnackbar('Application updated');
      } else {
        const newApp = await submitCulturalApplication(data);
        setAppDialog(prev => ({
          ...prev,
          applications: [newApp, ...prev.applications]
        }));
        showSnackbar('Application added');
      }
      setAppFormData({ flatNumber: '', participantName: '', age: '', contactNumber: '', comment: '', selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', scheduleTime: '', itemCount: '', amountPaid: 0, adminPaymentConfirmed: false, paymentMode: 'UPI', paymentReference: '' });
      setEditAppId(null);
      if (!keepOpen) setShowAddForm(false);
    } catch (e) {
      console.error(e);
      showSnackbar('Error saving application', 'error');
    }
  };

  const handleEditApp = (app) => {
    setAppFormData({
      flatNumber: app.flatNumber || '',
      participantName: app.participantName || '',
      age: app.age || '',
      contactNumber: app.contactNumber || '',
      comment: app.comment || '',
      selectedDate: app.selectedDate ? new Date(app.selectedDate) : null,
      selectedSubEvents: app.selectedSubEvents || [],
      customFieldResponses: app.customFieldResponses || {},
      isGroup: app.isGroup || false,
      participants: app.participants || [{ name: '', age: '' }],
      scheduleTime: app.scheduleTime || '',
      calculatedAgeGroup: app.calculatedAgeGroup || '',
      itemCount: app.itemCount || '',
      amountPaid: app.amountPaid || 0,
      adminPaymentConfirmed: app.adminPaymentConfirmed || false,
      paymentMode: app.paymentMode || 'UPI',
      paymentReference: app.paymentReference || ''
    });
    setEditAppId(app.id);
    setShowAddForm(true);
  };

  const handleDeleteApp = (appId, oldData) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Application',
      message: 'Are you sure you want to delete this application?',
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, open: false });
        try {
          await deleteCulturalApplication(appId, oldData);
          setAppDialog(prev => ({ ...prev, applications: prev.applications.filter(a => a.id !== appId) }));
          showSnackbar('Application deleted');
        } catch (e) {
          console.error(e);
          showSnackbar('Error deleting application', 'error');
        }
      }
    });
  };

  const handleVerifyPayment = (app) => {
    setVerifyPaymentDialog({ 
      open: true, 
      app, 
      paymentMode: app.paymentMode || 'UPI',
      paymentReference: app.paymentReference || ''
    });
  };

  const escapeHtml = (unsafe) => {
    return (unsafe || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };

  const sanitizeCsvCell = (value) => {
    let str = (value ?? '').toString();
    if (/^[=+\-@\t\r]/.test(str)) { str = "'" + str; }
    if (str.includes('"')) { str = str.replace(/"/g, '""'); }
    if (str.includes(',') || str.includes('\n') || str.includes('"')) { str = `"${str}"`; }
    return str;
  };

  const processedApplications = useMemo(() => {
    let list = [...appDialog.applications];
    if (appSearch) {
      const q = appSearch.toLowerCase();
      list = list.filter(app => {
        let searchableText = [
          app.flatNumber,
          app.participantName,
          app.isGroup ? app.participants?.map(p => p.name).join(' ') : '',
          app.isGroup ? app.participants?.map(p => p.age).join(' ') : app.age,
          app.calculatedAgeGroup,
          app.contactNumber,
          app.scheduleTime,
          app.selectedDate ? formatDate(app.selectedDate, config?.dateFormat) : '',
          (app.selectedSubEvents || []).join(' '),
          app.comment,
          app.createdAt ? formatDateTime(app.createdAt, config?.dateFormat) : '',
          app.paymentMode,
          app.amountPaid ? String(app.amountPaid) : '',
          app.itemCount ? String(app.itemCount) : '',
        ];

        if (app.customFieldResponses) {
          Object.values(app.customFieldResponses).forEach(val => {
            if (Array.isArray(val)) {
              searchableText.push(val.join(' '));
            } else {
              searchableText.push(val);
            }
          });
        }

        const fullString = searchableText.filter(Boolean).join(' ').toLowerCase();
        return fullString.includes(q);
      });
    }
    if (appSort.field) {
      list.sort((a, b) => {
        let valA = a[appSort.field];
        let valB = b[appSort.field];
        // Numeric fields
        if (['age', 'amountPaid', 'itemCount'].includes(appSort.field)) {
          if (appSort.field === 'age') {
            valA = valA ?? a.calculatedAgeGroup ?? '';
            valB = valB ?? b.calculatedAgeGroup ?? '';
          }
          const numA = Number(valA);
          const numB = Number(valB);
          if (!isNaN(numA) && !isNaN(numB) && valA !== null && valB !== null && valA !== '') {
            valA = numA;
            valB = numB;
          } else {
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
          }
        // Date fields
        } else if (['createdAt', 'selectedDate'].includes(appSort.field)) {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        } else {
          valA = (valA || '').toString().toLowerCase();
          valB = (valB || '').toString().toLowerCase();
        }
        if (valA < valB) return appSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return appSort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [appDialog.applications, appSearch, appSort, config?.dateFormat]);

  const handleSort = (field) => {
    const isAsc = appSort.field === field && appSort.order === 'asc';
    setAppSort({ field, order: isAsc ? 'desc' : 'asc' });
  };

  const exportCSV = () => {
    if (!appDialog.event) return;
    const listToExport = processedApplications;
    const hasDateRange = appDialog.event && appDialog.event.eventDate && appDialog.event.eventEndDate && !appDialog.event.isTentative;
    const hasSubEvents = appDialog.event && appDialog.event.subEvents && appDialog.event.subEvents.length > 0;
    const ageColumnLabel = appDialog.event?.ageFieldMode === 'age-group' ? 'Group' : 'Age';
    const showAgeColumn = appDialog.event?.ageFieldMode !== 'hidden';
    const headers = ['#', 'Name (Flat)'];
    if (showAgeColumn) headers.push(ageColumnLabel);
    headers.push('Contact', 'Slot', 'Comment', 'Applied On');

    if (hasDateRange) headers.splice(5, 0, 'Selected Date');
    if (hasSubEvents) headers.splice(headers.length - 2, 0, 'Competitions');
    if (appDialog.event.customFields && appDialog.event.customFields.length > 0) {
      appDialog.event.customFields.forEach((cf, idx) => {
        headers.splice(headers.length - 2 + idx, 0, cf.label);
      });
    }
    if (appDialog.event?.isPaidEvent) {
      headers.splice(headers.length - 2, 0, 'Payment Info');
    }
    const csv = [
      headers.map(h => sanitizeCsvCell(h)).join(','),
      ...listToExport.map((row, idx) => {
        const pName = row.isGroup ? row.participants.map(p => p.name).join('; ') : row.participantName;
        const rowData = [
          sanitizeCsvCell(idx + 1),
          sanitizeCsvCell(`${pName} (${row.flatNumber})`)
        ];
        if (showAgeColumn) {
          rowData.push(sanitizeCsvCell(row.calculatedAgeGroup || (row.isGroup
            ? (row.participants?.map(p => p.age).filter(Boolean).join('; ') || '')
            : (row.age || ''))));
        }
        rowData.push(sanitizeCsvCell(row.contactNumber));
        rowData.push(sanitizeCsvCell(row.scheduleTime || ''));

        if (hasDateRange) {
          rowData.push(sanitizeCsvCell(row.selectedDate ? formatDate(row.selectedDate, config?.dateFormat) : ''));
        }
        if (hasSubEvents) {
          rowData.push(sanitizeCsvCell((row.selectedSubEvents || []).join(', ')));
        }
        if (appDialog.event.customFields && appDialog.event.customFields.length > 0) {
          appDialog.event.customFields.forEach(cf => {
            let val = row.customFieldResponses?.[cf.label] || '';
            const otherVal = row.customFieldResponses?.[`${cf.label}_other`];
            if (Array.isArray(val)) {
              val = val.map(v => v === 'Other' && otherVal ? `Other (${otherVal})` : v).join(', ');
            } else if (val === 'Other' && otherVal) {
              val = `Other (${otherVal})`;
            }
            rowData.push(sanitizeCsvCell(val));
          });
        }
        if (appDialog.event?.isPaidEvent) {
          const payStatus = row.adminPaymentConfirmed ? 'Paid' : (row.paymentConfirmed ? 'In Review' : 'Pending');
          const payDetails = (row.paymentMode || row.paymentReference) ? ` via ${row.paymentMode || 'UPI'}${row.paymentReference ? ` (Ref: ${row.paymentReference})` : ''}` : '';
          rowData.push(sanitizeCsvCell(`${row.itemCount || 0} ${appDialog.event?.itemLabel || 'Item'}(s) (Rs ${row.amountPaid || 0}) [${payStatus}${payDetails}]`));
        }
        rowData.push(sanitizeCsvCell(row.comment || ''));
        rowData.push(sanitizeCsvCell(formatDateTime(row.createdAt, config?.dateFormat)));
        return rowData.join(',');
      })
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Applications_${appDialog.event.title.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const processedApps = appDialog.open ? processedApplications : [];

  const totals = useMemo(() => {
    let totalApps = processedApps.length;
    let totalParticipants = 0;
    let totalItems = 0;
    let totalAmount = 0;

    processedApps.forEach(app => {
      totalParticipants += app.isGroup && app.participants ? app.participants.length : 1;
      totalItems += Number(app.itemCount) || 0;
      totalAmount += Number(app.amountPaid) || 0;
    });

    return { totalApps, totalParticipants, totalItems, totalAmount };
  }, [processedApps]);

  const printReport = (showContact = true) => {
    if (!appDialog.event) return;
    const ev = appDialog.event;
    const showAge = ev.ageFieldMode !== 'hidden';
    const hasDateRange = ev.eventDate && ev.eventEndDate && !ev.isTentative;
    const hasSubEvents = ev.subEvents && ev.subEvents.length > 0;
    const hasCustomFields = ev.customFields && ev.customFields.length > 0;

    let headerCells = '<th>#</th><th>Name (Flat)</th>';
    if (showAge) headerCells += `<th>${ev.ageFieldMode === 'age-group' ? 'Group' : 'Age'}</th>`;
    if (showContact) headerCells += '<th>Contact</th>';
    headerCells += '<th>Slot</th>';
    if (hasDateRange) headerCells += '<th>Selected Date</th>';
    if (hasSubEvents) headerCells += '<th>Competitions</th>';
    if (hasCustomFields) ev.customFields.forEach(cf => { headerCells += `<th>${escapeHtml(cf.label)}</th>`; });
    if (ev.isPaidEvent) headerCells += '<th>Payment</th>';
    headerCells += '<th>Comment</th>';

    const bodyRows = processedApps.map((app, idx) => {
      let cells = `<td>${idx + 1}</td>`;
      const pName = app.isGroup ? (app.participants?.map(p => p.name).join('; ') || '') : app.participantName;
      cells += `<td>${escapeHtml(pName)} (${escapeHtml(app.flatNumber)})</td>`;
      if (showAge) {
        const ageVal = app.calculatedAgeGroup || (app.isGroup
          ? (app.participants?.map(p => p.age).filter(Boolean).join('; ') || '-')
          : (app.age || '-'));
        cells += `<td>${escapeHtml(String(ageVal))}</td>`;
      }
      if (showContact) cells += `<td>${escapeHtml(app.contactNumber || '')}</td>`;
      cells += `<td>${escapeHtml(app.scheduleTime || '-')}</td>`;
      if (hasDateRange) cells += `<td>${app.selectedDate ? escapeHtml(formatDate(app.selectedDate, config?.dateFormat)) : '-'}</td>`;
      if (hasSubEvents) cells += `<td>${escapeHtml((app.selectedSubEvents || []).join(', ') || '-')}</td>`;
      if (hasCustomFields) {
        ev.customFields.forEach(cf => {
          let val = app.customFieldResponses?.[cf.label] || '-';
          const otherVal = app.customFieldResponses?.[`${cf.label}_other`];
          if (Array.isArray(val)) {
            val = val.map(v => v === 'Other' && otherVal ? `Other (${otherVal})` : v).join(', ');
          } else if (val === 'Other' && otherVal) {
            val = `Other (${otherVal})`;
          }
          cells += `<td>${escapeHtml(String(val))}</td>`;
        });
      }
      if (ev.isPaidEvent) {
        const payStatus = app.adminPaymentConfirmed ? 'Paid' : (app.paymentConfirmed ? 'In Review' : 'Pending');
        const payInfo = `${app.itemCount || 0} ${ev.itemLabel || 'Item'}(s) (₹${app.amountPaid || 0}) ${payStatus}`;
        const payRef = (app.paymentMode || app.paymentReference) ? ` [${app.paymentMode || 'UPI'}${app.paymentReference ? ` - ${app.paymentReference}` : ''}]` : '';
        cells += `<td>${escapeHtml(payInfo + payRef)}</td>`;
      }
      cells += `<td>${escapeHtml(app.comment || '')}</td>`;
      return `<tr>${cells}</tr>`;
    }).join('');

    let totalRow = `<tr>
      <td><b>Total</b></td>
      <td><b>${totals.totalApps} Apps (${totals.totalParticipants} Participants)</b></td>`;
    if (showAge) totalRow += `<td></td>`;
    if (showContact) totalRow += `<td></td>`;
    totalRow += `<td></td>`;
    if (hasDateRange) totalRow += `<td></td>`;
    if (hasSubEvents) totalRow += `<td></td>`;
    if (hasCustomFields) ev.customFields.forEach(() => { totalRow += `<td></td>`; });
    if (ev.isPaidEvent) totalRow += `<td><b>${totals.totalItems} ${ev.itemLabel || 'Item'}(s) (₹${totals.totalAmount})</b></td>`;
    totalRow += `<td></td>`;
    totalRow += `</tr>`;

    const html = `<html><head><title>Print Applications</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:20px;color:${printTheme.text}}
      ${getPrintHeaderStyles()}
      .report-title{text-align:center; color:${brand.orangeDeep}; font-size: 18px; margin: 15px 0; text-transform: uppercase; font-weight: bold; border-bottom: 2px solid ${brand.orangeDeep}; padding-bottom: 8px;}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:${printTheme.priceBg};padding:8px;border:1px solid ${printTheme.borderDivider};font-size:12px;text-align:left}
      td{padding:6px 8px;border:1px solid ${printTheme.borderDivider};font-size:12px}
      @media print{body{padding:10px}}
    </style></head><body>
    ${getPrintHeaderHTML(config)}
    <div class="report-title">${escapeHtml(appDialog.event.title)}${!showContact ? ' (Public List)' : ''}</div>
    <table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}${totalRow}</tbody></table>
    ${getPrintFooterHTML(config)}
    </body></html>`;
    printHTML(html);
  };

  const totalCapacityConsumed = useMemo(() => {
    if (!appDialog.open || !appDialog.event || !appDialog.applications) return 0;
    return appDialog.applications.reduce((sum, app) => {
      const consumed = appDialog.event.maxItems > 0 ? (Number(app.itemCount) || 1) : 1;
      return sum + consumed;
    }, 0);
  }, [appDialog.applications, appDialog.event, appDialog.open]);

  return (
    <>
      <Dialog open={appDialog.open} onClose={() => setAppDialog({ ...appDialog, open: false })} maxWidth="xl" fullWidth fullScreen={isMobile} sx={{ zIndex: 1100 }} slotProps={{ paper: { sx: { bgcolor: 'background.paper' } } }}>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', py: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 700, color: cultural.pink, lineHeight: 1.2, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {appDialog.event?.title}
              </Typography>
              <Chip
                label={appDialog.event?.maxCapacity > 0 ? `${totalCapacityConsumed} / ${appDialog.event?.maxCapacity}` : totalCapacityConsumed}
                size="small"
                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700, backgroundColor: cultural.bgLight, color: cultural.pink, flexShrink: 0 }}
              />
            </Box>
            <IconButton onClick={() => setAppDialog({ ...appDialog, open: false })} size="small"><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: { xs: 1.5, sm: 2.5 }, py: { xs: 1, sm: 1 }, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', bgcolor: 'background.default' }}>
            <TextField
              size="small"
              placeholder="Search anywhere..."
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 300 } }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
              <Tooltip title="Print List"><IconButton size="small" onClick={(e) => setPrintAnchorEl(e.currentTarget)}><PrintIcon fontSize="small" /></IconButton></Tooltip>
              <Menu anchorEl={printAnchorEl} open={Boolean(printAnchorEl)} onClose={() => setPrintAnchorEl(null)} transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                <MenuItem onClick={() => { printReport(true); setPrintAnchorEl(null); }}>
                  <ListItemIcon><PrintIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Print (with Contact)</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => { printReport(false); setPrintAnchorEl(null); }}>
                  <ListItemIcon><PeopleIcon fontSize="small" sx={{ color: (theme) => status.success.main(theme.palette.mode === 'dark') }} /></ListItemIcon>
                  <ListItemText>Print (Public)</ListItemText>
                </MenuItem>
              </Menu>
              <Tooltip title="Export CSV"><IconButton size="small" onClick={exportCSV}><FileDownloadIcon fontSize="small" /></IconButton></Tooltip>
              <Tooltip title="Add Record">
                <IconButton size="small" onClick={() => { setEditAppId(null); setAppFormData({ flatNumber: '', participantName: '', age: '', contactNumber: '', comment: '', selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', scheduleTime: '', itemCount: '', amountPaid: 0, adminPaymentConfirmed: false, paymentMode: 'UPI', paymentReference: '' }); setShowAddForm(!showAddForm); }} sx={{ backgroundColor: cultural.pink, '&:hover': { backgroundColor: cultural.pinkDark }, color: text.white, display: { xs: 'inline-flex', sm: 'none' } }}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => { setEditAppId(null); setAppFormData({ flatNumber: '', participantName: '', age: '', contactNumber: '', comment: '', selectedDate: null, selectedSubEvents: [], customFieldResponses: {}, isGroup: false, participants: [{ name: '', age: '' }], calculatedAgeGroup: '', scheduleTime: '', itemCount: '', amountPaid: 0, adminPaymentConfirmed: false, paymentMode: 'UPI', paymentReference: '' }); setShowAddForm(!showAddForm); }} sx={{ backgroundColor: cultural.pink, '&:hover': { backgroundColor: cultural.pinkDark }, display: { xs: 'none', sm: 'inline-flex' } }}>
                Add Record
              </Button>
            </Box>
          </Box>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ '& .MuiTableCell-root': { px: { xs: 0.75, sm: 2 }, py: { xs: 0.75, sm: 1 }, fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }, '& .sticky-left': { position: 'sticky', left: 0, zIndex: 2, bgcolor: 'background.paper' }, '& .sticky-right': { position: 'sticky', right: 0, zIndex: 2, bgcolor: 'background.paper' }, '& thead .sticky-left, & thead .sticky-right': { zIndex: 3 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 40, px: { xs: 1, sm: 2 } }}>#</TableCell>
                  <TableCell className="sticky-left" sx={{ minWidth: 150, maxWidth: '30vw', whiteSpace: 'normal !important' }}>
                    <TableSortLabel
                      active={appSort.field === 'participantName'}
                      direction={appSort.field === 'participantName' ? appSort.order : 'asc'}
                      onClick={() => handleSort('participantName')}
                    >
                      Name (Flat)
                    </TableSortLabel>
                  </TableCell>
                  {appDialog.event?.ageFieldMode !== 'hidden' && (
                    <TableCell sx={{ width: { xs: 80, sm: 100 }, maxWidth: 120, whiteSpace: 'normal !important' }}>
                      <TableSortLabel
                        active={appSort.field === 'age'}
                        direction={appSort.field === 'age' ? appSort.order : 'asc'}
                        onClick={() => handleSort('age')}
                      >
                        {appDialog.event?.ageFieldMode === 'age-group' ? 'Group' : 'Age'}
                      </TableSortLabel>
                    </TableCell>
                  )}
                  <TableCell>Contact</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={appSort.field === 'scheduleTime'}
                      direction={appSort.field === 'scheduleTime' ? appSort.order : 'asc'}
                      onClick={() => handleSort('scheduleTime')}
                    >
                      Slot
                    </TableSortLabel>
                  </TableCell>
                  {appDialog.event?.eventDate && appDialog.event?.eventEndDate && !appDialog.event?.isTentative && (
                    <TableCell>
                      <TableSortLabel
                        active={appSort.field === 'selectedDate'}
                        direction={appSort.field === 'selectedDate' ? appSort.order : 'asc'}
                        onClick={() => handleSort('selectedDate')}
                      >
                        Selected Date
                      </TableSortLabel>
                    </TableCell>
                  )}
                  {appDialog.event?.subEvents && appDialog.event.subEvents.length > 0 && (
                    <TableCell>Competitions</TableCell>
                  )}
                  {appDialog.event?.customFields && appDialog.event.customFields.map((cf, i) => (
                    <TableCell key={i}>{cf.label}</TableCell>
                  ))}
                  {appDialog.event?.isPaidEvent && (
                    <TableCell>Payment</TableCell>
                  )}
                  <TableCell className="no-print">
                    <TableSortLabel
                      active={appSort.field === 'createdAt'}
                      direction={appSort.field === 'createdAt' ? appSort.order : 'asc'}
                      onClick={() => handleSort('createdAt')}
                    >
                      Applied On
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right" className="no-print sticky-right">{isMobile ? 'ACT' : 'Action'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedApps.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center">No applications found.</TableCell></TableRow>
                ) : (
                  processedApps.map((app, idx) => (
                    <TableRow key={app.id}>
                      <TableCell sx={{ color: 'text.secondary', fontWeight: 600 }}>{idx + 1}</TableCell>
                      <TableCell className="sticky-left" sx={{ maxWidth: '30vw', whiteSpace: 'normal !important', wordWrap: 'break-word' }}>
                        <Tooltip title={app.comment || ''} arrow placement="top" disableHoverListener={!app.comment} disableInteractive={false} enterTouchDelay={0} leaveTouchDelay={4000}>
                          <Box component="span" onClick={(e) => { if (app.comment) e.stopPropagation(); }} sx={{ cursor: app.comment ? 'pointer' : 'inherit', display: 'inline' }}>
                            {app.comment && (
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'info.main', display: 'inline-block', mr: 1, verticalAlign: 'middle' }} />
                            )}
                            {app.isGroup ? app.participants?.map(p => p.name).join(', ') : app.participantName}
                            {app.flatNumber && <Typography component="span" variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>({app.flatNumber})</Typography>}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      {appDialog.event?.ageFieldMode !== 'hidden' && (
                        <TableCell sx={{ width: { xs: 80, sm: 100 }, maxWidth: 120, whiteSpace: 'normal !important', wordWrap: 'break-word' }}>
                          {app.calculatedAgeGroup || (app.isGroup
                            ? (app.participants?.map(p => p.age).filter(Boolean).join(', ') || '-')
                            : (app.age || '-'))}
                        </TableCell>
                      )}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {app.contactNumber}
                          {app.contactNumber && (
                            <Tooltip title="Call">
                              <IconButton size="small" component="a" href={`tel:${app.contactNumber}`} sx={{ color: 'primary.main', p: 0.5 }}>
                                <CallIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{app.scheduleTime || '-'}</TableCell>
                      {appDialog.event?.eventDate && appDialog.event?.eventEndDate && !appDialog.event?.isTentative && (
                        <TableCell>{app.selectedDate ? formatDate(app.selectedDate, config?.dateFormat) : '-'}</TableCell>
                      )}
                      {appDialog.event?.subEvents && appDialog.event.subEvents.length > 0 && (
                        <TableCell>{(app.selectedSubEvents || []).join(', ') || '-'}</TableCell>
                      )}
                      {appDialog.event?.customFields && appDialog.event.customFields.map((cf, i) => {
                        let val = app.customFieldResponses?.[cf.label] || '-';
                        const otherVal = app.customFieldResponses?.[`${cf.label}_other`];
                        if (Array.isArray(val)) {
                          val = val.map(v => v === 'Other' && otherVal ? `Other (${otherVal})` : v).join(', ');
                        } else if (val === 'Other' && otherVal) {
                          val = `Other (${otherVal})`;
                        }
                        return <TableCell key={i}>{val}</TableCell>;
                      })}
                      {appDialog.event?.isPaidEvent && (
                        <TableCell>
                          <Typography variant="body2">{app.itemCount || 0} {appDialog.event?.itemLabel || 'Item'}(s)</Typography>
                          <Typography variant="caption" color="text.secondary">₹{app.amountPaid || 0}</Typography>
                          {app.adminPaymentConfirmed ? (
                            <Tooltip title="Payment Verified by Admin">
                              <Chip size="small" icon={<VerifiedUserIcon />} label="Paid" color="success" sx={{ height: 20, fontSize: '0.65rem', ml: 1, '& .MuiChip-icon': { fontSize: 14 } }} />
                            </Tooltip>
                          ) : app.paymentConfirmed ? (
                            <Tooltip title="Payment submitted by User">
                              <Chip size="small" label="In Review" color="warning" sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Payment pending">
                              <Chip size="small" label="Pending" color="error" sx={{ height: 20, fontSize: '0.65rem', ml: 1 }} />
                            </Tooltip>
                          )}

                        </TableCell>
                      )}
                      <TableCell className="no-print" sx={{ whiteSpace: 'nowrap' }}>
                        {formatDateTime(app.createdAt, config?.dateFormat)}
                      </TableCell>
                      <TableCell align="right" className="no-print sticky-right">
                        <IconButton size="small" onClick={(e) => handleAppMenuOpen(e, app)}><MoreVertIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
                {processedApps.length > 0 && (
                  <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.04)', '& > td': { fontWeight: 700, borderTop: '2px solid', borderColor: 'divider' } }}>
                    <TableCell>Total</TableCell>
                    <TableCell className="sticky-left">
                      {totals.totalApps} App(s) ({totals.totalParticipants} Participants)
                    </TableCell>
                    {appDialog.event?.ageFieldMode !== 'hidden' && <TableCell />}
                    <TableCell />
                    <TableCell />
                    {appDialog.event?.eventDate && appDialog.event?.eventEndDate && !appDialog.event?.isTentative && <TableCell />}
                    {appDialog.event?.subEvents && appDialog.event.subEvents.length > 0 && <TableCell />}
                    {appDialog.event?.customFields && appDialog.event.customFields.map((_, i) => <TableCell key={i} />)}
                    {appDialog.event?.isPaidEvent && (
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{totals.totalItems} {appDialog.event?.itemLabel || 'Item'}(s)</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>₹{totals.totalAmount}</Typography>
                      </TableCell>
                    )}
                    <TableCell className="no-print" />
                    <TableCell className="no-print sticky-right" />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Menu anchorEl={appAnchorEl} open={Boolean(appAnchorEl)} onClose={handleAppMenuClose}>
            <MenuItem onClick={() => { handleEditApp(actionApp); handleAppMenuClose(); }}>
              <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            {appDialog.event?.isPaidEvent && actionApp && (user?.role === 'Admin' || user?.role === 'Super Admin') && (
              <MenuItem onClick={() => { handleVerifyPayment(actionApp); handleAppMenuClose(); }}>
                <ListItemIcon><CheckCircleIcon fontSize="small" color={actionApp.adminPaymentConfirmed ? "info" : "success"} /></ListItemIcon>
                <ListItemText sx={{ color: actionApp.adminPaymentConfirmed ? 'info.main' : 'success.main' }}>
                  {actionApp.adminPaymentConfirmed ? 'Payment Info' : 'Verify Payment'}
                </ListItemText>
              </MenuItem>
            )}
            {(!actionApp?.adminPaymentConfirmed || user?.role === 'Admin' || user?.role === 'Super Admin') && (
              <MenuItem onClick={() => { handleDeleteApp(actionApp.id, actionApp); handleAppMenuClose(); }} sx={{ color: 'error.main' }}>
                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>
            )}
          </Menu>


        </DialogContent>
        {confirmDialog.open && (
          <ConfirmDialog
            open={confirmDialog.open}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onCancel={() => setConfirmDialog({ ...confirmDialog, open: false })}
            onConfirm={confirmDialog.onConfirm}
          />
        )}
      </Dialog>

      <ApplicationAddEditDrawer
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        editAppId={editAppId}
        appDialog={appDialog}
        appFormData={appFormData}
        setAppFormData={setAppFormData}
        handleAddApplication={handleAddApplication}
        config={config}
      />

      {/* Verify Payment Dialog */}
      <Dialog open={verifyPaymentDialog.open} onClose={() => setVerifyPaymentDialog({ ...verifyPaymentDialog, open: false, editing: false })}>
        <DialogTitle>{verifyPaymentDialog.app?.adminPaymentConfirmed && !verifyPaymentDialog.editing ? 'Payment Info' : 'Verify Payment'}</DialogTitle>
        <DialogContent dividers>
          {(!verifyPaymentDialog.app?.adminPaymentConfirmed || verifyPaymentDialog.editing) ? (
            <>
              {!verifyPaymentDialog.editing && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Are you sure you want to verify the payment of ₹{verifyPaymentDialog.app?.amountPaid || 0} for {verifyPaymentDialog.app?.participantName} (Flat {verifyPaymentDialog.app?.flatNumber})? This will record a donation.
                </Typography>
              )}
              {verifyPaymentDialog.editing && (
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Update payment details for {verifyPaymentDialog.app?.participantName} (Flat {verifyPaymentDialog.app?.flatNumber})
                </Typography>
              )}
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={verifyPaymentDialog.paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setVerifyPaymentDialog({ ...verifyPaymentDialog, paymentMode: e.target.value })}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="Net Banking">Net Banking</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </Select>
              </FormControl>
              {['UPI', 'Net Banking', 'Cheque'].includes(verifyPaymentDialog.paymentMode) && (
                <TextField
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  label="Payment Reference"
                  value={verifyPaymentDialog.paymentReference || ''}
                  onChange={(e) => setVerifyPaymentDialog({ ...verifyPaymentDialog, paymentReference: e.target.value })}
                />
              )}
            </>
          ) : (
            <Box sx={{ p: 2, bgcolor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 20, mr: 1 }} />
                Payment Confirmed
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Amount:</strong> ₹{verifyPaymentDialog.app?.amountPaid || 0}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Mode:</strong> {verifyPaymentDialog.app?.paymentMode || '-'}
              </Typography>
              {verifyPaymentDialog.app?.paymentReference && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Reference:</strong> {verifyPaymentDialog.app.paymentReference}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Verified By:</strong> {verifyPaymentDialog.app?.paymentVerifiedBy || 'Admin'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyPaymentDialog({ ...verifyPaymentDialog, open: false, editing: false })}>
            {verifyPaymentDialog.app?.adminPaymentConfirmed && !verifyPaymentDialog.editing ? 'Close' : 'Cancel'}
          </Button>
          {verifyPaymentDialog.app?.adminPaymentConfirmed && !verifyPaymentDialog.editing && (
            <Button
              variant="outlined"
              onClick={() => setVerifyPaymentDialog({
                ...verifyPaymentDialog,
                editing: true,
                paymentMode: verifyPaymentDialog.app?.paymentMode || 'UPI',
                paymentReference: verifyPaymentDialog.app?.paymentReference || ''
              })}
            >
              Edit
            </Button>
          )}
          {verifyPaymentDialog.app?.adminPaymentConfirmed && verifyPaymentDialog.editing && (
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                const { app, paymentMode, paymentReference } = verifyPaymentDialog;
                try {
                  const updateData = { paymentMode: paymentMode || 'UPI', paymentReference: paymentReference || '' };
                  await updateCulturalApplication(app.id, updateData);
                  setAppDialog(prev => ({
                    ...prev,
                    applications: prev.applications.map(a => a.id === app.id ? { ...a, ...updateData } : a)
                  }));
                  setVerifyPaymentDialog({ ...verifyPaymentDialog, open: false, editing: false });
                  showSnackbar('Payment info updated', 'success');
                } catch (e) {
                  console.error(e);
                  showSnackbar('Error updating payment info', 'error');
                }
              }}
            >
              Save
            </Button>
          )}
          {!verifyPaymentDialog.app?.adminPaymentConfirmed && (
            <Button 
              variant="contained"
              color="primary"
              onClick={async () => {
              const { app, paymentMode, paymentReference } = verifyPaymentDialog;
              setVerifyPaymentDialog({ ...verifyPaymentDialog, open: false });
              try {
                const verifiedBy = user?.displayName || user?.email || 'Admin';
                const updated = await verifyEventPayment(app.id, app, appDialog.event, paymentMode || 'UPI', paymentReference || '', verifiedBy);
                setAppDialog(prev => ({
                  ...prev,
                  applications: prev.applications.map(a => a.id === app.id ? { ...a, ...updated } : a)
                }));
                showSnackbar('Payment verified and donation recorded', 'success');
              } catch (e) {
                console.error(e);
                showSnackbar('Error verifying payment', 'error');
              }
            }}
          >
            Confirm
          </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApplicationsDialog;
