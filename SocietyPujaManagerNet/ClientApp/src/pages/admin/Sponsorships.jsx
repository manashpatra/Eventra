import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { Box, Card, CardContent, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Grid, FormControl, InputLabel, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, InputAdornment, Tooltip, Fade, TablePagination, Chip, Menu, ListItemIcon, ListItemText, Autocomplete, useTheme, useMediaQuery } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, CurrencyRupee as RupeeIcon, Business as SponsorIcon,
  Image as ImageIcon, CloudUpload as UploadIcon, WhatsApp as WhatsAppIcon,
  Download as DownloadIcon, AccessTime as PendingIcon,
  PhotoCamera as CameraIcon, Groups as GroupsIcon, Storefront as ExternalIcon,
  Home as InternalIcon, PieChart as PieChartIcon, HourglassEmpty as HourglassIcon,
  Print as PrintIcon, Phone as PhoneIcon, CheckCircle as CheckCircleIcon, MoreVert as MoreVertIcon,
  SettingsBackupRestore as RefundIcon,
} from '@mui/icons-material';
import { createSponsorship, getAllSponsorships, deleteSponsorship, getSponsorshipStats, updateSponsorship } from '../../services/sponsorshipService';
import { getMasterConfig } from '../../services/masterConfigService';
import { getLocalISODate, formatDate, getDatePickerFormat } from '../../utils/dateUtils';
import { generateImageFromHTML, generatePDFFromHTML, printHTML } from '../../utils/print/core';
import { getSponsorshipReceiptHTML } from '../../utils/print/templates/sponsorshipReceiptTemplate';
import { getProFormaInvoiceHTML } from '../../utils/print/templates/invoiceTemplate';
import { getSponsorshipsReportHTML } from '../../utils/print/templates/sponsorshipReportTemplate';
import { matchesFlatOrName, normalizeFlat } from '../../utils/flatHelper';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { getPaymentProof } from '../../services/firebase';
import { useDebounce } from '../../hooks/useDebounce';
import { useProcessing } from '../../contexts/ProcessingContext';
import {
  brand,
  primary,
  status,
  statusBadge,
  sponsorshipPalette,
  thirdParty,
} from '../../theme/colorTokens';

const extractDates = (text) => {
  if (!text) return '-';
  const dateRegex = /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{2,4})?|\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/gi;
  const matches = text.match(dateRegex);
  return matches && matches.length > 0 ? matches.join(', ') : '-';
};

const Sponsorships = () => {
  const { user } = useAuth();
  const { startProcessing, stopProcessing } = useProcessing();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isAuditor = user?.role === 'Auditor' || user?.role === 'FoodCoupon';
  const isSuperAdmin = user?.role === 'Super Admin';
  const isFinanceUser = user?.role === 'Super Admin' || user?.role === 'Admin' || user?.role === 'Treasurer';
  const canEdit = isSuperAdmin || user?.role === 'Admin' || user?.role === 'Collection' || user?.role === 'Treasurer';
  const [sponsorships, setSponsorships] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialLead = searchParams.get('lead') || 'All';
  const initialStatus = searchParams.get('status') || 'All';

  const [typeFilter, setTypeFilter] = useState('All');
  const [leadFilter, setLeadFilter] = useState(initialLead);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [stats, setStats] = useState({ totalSponsorships: 0, pendingSponsorships: 0, totalAmount: 0, externalCount: 0, externalAmount: 0, internalCount: 0, internalAmount: 0, totalCamAmount: 0, totalNetAmount: 0 });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofImages, setProofImages] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState(null);
  const [downloadMenuTarget, setDownloadMenuTarget] = useState(null);
  const handleDownloadMenuOpen = (event, s, type) => {
    setDownloadMenuAnchor(event.currentTarget);
    setDownloadMenuTarget({ s, type });
  };
  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
    setDownloadMenuTarget(null);
  };

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionSponsorship, setActionSponsorship] = useState(null);
  const handleActionMenuOpen = (event, s) => {
    setActionMenuAnchor(event.currentTarget);
    setActionSponsorship(s);
  };
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionSponsorship(null);
  };


  const [form, setForm] = useState({ sponsorName: '', sponsorType: 'External', contactNumber: '', email: '', trackingLead: null, statusNote: '', organization: '', amount: '', paymentMode: '', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null, transactionDate: null, invoiceRef: '', invoiceDate: getLocalISODate(), invoiceDescription: '', invoiceQuantity: 1, status: 'Pending', refundDate: null, refundMode: '', refundRemarks: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [data, configData] = await Promise.all([
        getAllSponsorships(), getMasterConfig(),
      ]);
      // Compute stats from already-fetched data (no duplicate Firestore read)
      const statsData = await getSponsorshipStats(data);
      setSponsorships(data); setConfig(configData); setStats(statsData);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const filteredSponsorships = useMemo(() => {
    let filtered = [...sponsorships];
    if (typeFilter !== 'All') {
      filtered = filtered.filter(s => (s.sponsorType || 'External') === typeFilter);
    }
    if (leadFilter !== 'All') {
      if (leadFilter === 'Unassigned') {
        filtered = filtered.filter(s => !s.trackingLead);
      } else if (leadFilter === 'me') {
        const u1 = user?.fullName || user?.displayName;
        const u2 = user?.email;
        filtered = filtered.filter(s => s.trackingLead && (s.trackingLead === u1 || s.trackingLead === u2 || (u1 && s.trackingLead.includes(u1)) || (u2 && s.trackingLead.includes(u2))));
      } else {
        filtered = filtered.filter(s => s.trackingLead === leadFilter);
      }
    }
    if (statusFilter !== 'All') {
      filtered = filtered.filter(s => (s.status || 'Received') === statusFilter);
    }
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      const normTerm = normalizeFlat(debouncedSearchTerm);
      // This regex allows matching targets that have extra padding zeros. e.g. search "119" -> /10*10*9/ matches "1109" (which is "11-09")
      const searchRegex = normTerm.length > 0 ? new RegExp(normTerm.split('').join('0*')) : null;

      filtered = filtered.filter(s => {
        if (matchesFlatOrName(s, debouncedSearchTerm) || 
            (s.organization || '').toLowerCase().includes(term) ||
            (s.remarks || '').toLowerCase().includes(term) ||
            (s.invoiceDescription || '').toLowerCase().includes(term)) {
          return true;
        }

        if (searchRegex) {
          if (searchRegex.test(normalizeFlat(s.organization)) ||
              searchRegex.test(normalizeFlat(s.remarks)) ||
              searchRegex.test(normalizeFlat(s.invoiceDescription))) {
            return true;
          }
        }
        return false;
      });
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [sponsorships, debouncedSearchTerm, typeFilter, leadFilter, statusFilter, user]);

  const uniqueLeads = useMemo(() => {
    const leads = new Set();
    sponsorships.forEach(s => {
      if (s.trackingLead) leads.add(s.trackingLead);
    });
    return Array.from(leads).sort();
  }, [sponsorships]);

  const handleSave = async () => {
    startProcessing('Saving sponsorship...');
    try {
      if (form.status === 'Received' && !form.transactionDate) {
        alert('Transaction Date is required when status is marked as Received.');
        return;
      }

      const dataPayload = {
        sponsorName: form.sponsorName,
        sponsorType: form.sponsorType || 'External',
        contactNumber: form.contactNumber,
        email: form.email,
        trackingLead: form.trackingLead,
        statusNote: form.statusNote,
        organization: form.organization,
        amount: Number(form.amount) || 0,
        paymentMode: form.paymentMode,
        remarks: form.remarks,
        transactionDate: form.transactionDate || null,
        paymentProofUrl: form.paymentProofUrl || null,
        invoiceRef: form.invoiceRef,
        invoiceDate: form.invoiceDate,
        invoiceDescription: form.invoiceDescription,
        invoiceQuantity: form.invoiceQuantity,
        status: form.status,
        refundDate: form.status === 'Cancelled' ? (form.refundDate || null) : null,
        refundMode: form.status === 'Cancelled' ? (form.refundMode || '') : '',
        refundRemarks: form.status === 'Cancelled' ? (form.refundRemarks || '') : '',
      };

      if (editId) {
        await updateSponsorship(editId, dataPayload, form.proofFiles, form.existingProofs);
      } else {
        await createSponsorship(dataPayload, form.proofFiles);
      }
      setDialogOpen(false);
      resetForm();
      await loadData();
    }
    catch (error) { console.error('Error:', error); }
    finally { stopProcessing(); }
  };

  const handleEdit = async (s) => {
    setEditId(s.id);
    setForm({
      sponsorName: s.sponsorName,
      sponsorType: s.sponsorType || 'External',
      contactNumber: s.contactNumber || '',
      email: s.email || '',
      trackingLead: s.trackingLead || null,
      statusNote: s.statusNote || '',
      organization: s.organization || '',
      amount: s.amount || '',
      paymentMode: s.paymentMode,
      remarks: s.remarks || '',
      proofFiles: [],
      existingProofs: [],
      paymentProofUrl: s.paymentProofUrl || null,
      transactionDate: s.transactionDate || null,
      invoiceRef: s.invoiceRef || '',
      invoiceDate: s.invoiceDate || getLocalISODate(),
      invoiceDescription: s.invoiceDescription || '',
      invoiceQuantity: s.invoiceQuantity || 1,
      status: s.status || 'Pending',
      refundDate: s.refundDate || null,
      refundMode: s.refundMode || '',
      refundRemarks: s.refundRemarks || '',
    });
    setDialogOpen(true);

    if (s.paymentProofUrl) {
      const proofs = await getPaymentProof(s.id, s.paymentProofUrl);
      if (proofs) {
        setForm(prev => {
          if (prev.paymentProofUrl !== s.paymentProofUrl) return prev;
          return {
            ...prev,
            existingProofs: Array.isArray(proofs) ? proofs : [proofs],
          };
        });
      }
    }
  };

  const handleDuplicate = (s) => {
    setEditId(null);
    setForm({
      sponsorName: s.sponsorName || '',
      sponsorType: s.sponsorType || 'External',
      contactNumber: s.contactNumber || '',
      email: s.email || '',
      trackingLead: s.trackingLead || null,
      statusNote: s.statusNote || '',
      organization: s.organization || '',
      amount: s.amount ? s.amount.toString() : '',
      paymentMode: '',
      remarks: s.remarks || '',
      proofFiles: [],
      existingProofs: [],
      paymentProofUrl: null,
      transactionDate: null,
      invoiceRef: generateNextInvoiceRef(),
      invoiceDate: getLocalISODate(),
      invoiceDescription: s.invoiceDescription || '',
      invoiceQuantity: s.invoiceQuantity || 1,
      status: 'Pending',
      refundDate: null,
      refundMode: '',
      refundRemarks: ''
    });
    setDialogOpen(true);
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Sponsorship',
      message: 'Are you sure you want to delete this sponsorship? This action cannot be undone.',
      onConfirm: async () => {
        startProcessing('Deleting sponsorship...');
        try {
          await deleteSponsorship(id);
          await loadData();
        } finally {
          stopProcessing();
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      }
    });
  };

  const generateNextInvoiceRef = () => {
    let maxNum = 0;
    const prefix = `DPC/${config?.year || '2026-27'}/`;
    sponsorships.forEach(s => {
      if (s.invoiceRef && s.invoiceRef.startsWith(prefix)) {
        const numPart = s.invoiceRef.substring(prefix.length);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ sponsorName: '', sponsorType: 'External', contactNumber: '', email: '', trackingLead: null, statusNote: '', organization: '', amount: '', paymentMode: '', remarks: '', proofFiles: [], existingProofs: [], paymentProofUrl: null, transactionDate: null, invoiceRef: generateNextInvoiceRef(), invoiceDate: getLocalISODate(), invoiceDescription: '', invoiceQuantity: 1, status: 'Pending', refundDate: null, refundMode: '', refundRemarks: '' });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setForm((prev) => ({
        ...prev,
        proofFiles: [...(prev.proofFiles || []), ...files],
      }));
    }
  };

  const removeNewProofFile = (index) => {
    setForm(prev => ({
      ...prev,
      proofFiles: prev.proofFiles.filter((_, idx) => idx !== index),
    }));
  };

  const removeExistingProof = (index) => {
    setForm(prev => ({
      ...prev,
      existingProofs: prev.existingProofs.filter((_, idx) => idx !== index),
    }));
  };

  const formatCurrency = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);


  const handlePrintInvoice = async (s) => {
    try {
      const invoiceHtmlStr = await getProFormaInvoiceHTML(s, config || {}, false);
      printHTML(invoiceHtmlStr);
    } catch (error) {
      console.error('Error printing invoice:', error);
      alert('Failed to print invoice. ' + error.message);
    }
  };

  const handlePrintReceipt = (s) => {
    try {
      const receiptHtmlStr = getSponsorshipReceiptHTML(s, config || {}, false);
      printHTML(receiptHtmlStr);
    } catch (error) {
      console.error('Error printing receipt:', error);
      alert('Failed to print receipt. ' + error.message);
    }
  };

  const handleDownloadInvoice = async (s, format = 'image') => {
    try {
      const invoiceHtmlStr = await getProFormaInvoiceHTML(s, config || {}, true);
      if (format === 'pdf') {
        const pdf = await generatePDFFromHTML(invoiceHtmlStr);
        pdf.save(`${s.status === 'Received' ? 'Invoice' : 'Pro_Forma_Invoice'}_${s.sponsorName.replace(/\s+/g, '_')}.pdf`);
      } else {
        const canvas = await generateImageFromHTML(invoiceHtmlStr);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${s.status === 'Received' ? 'Invoice' : 'Pro_Forma_Invoice'}_${s.sponsorName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice. ' + error.message);
    }
  };

  const handleDownloadReceipt = async (s, format = 'image') => {
    try {
      const receiptHtmlStr = getSponsorshipReceiptHTML(s, config || {}, true);
      if (format === 'pdf') {
        const pdf = await generatePDFFromHTML(receiptHtmlStr);
        pdf.save(`Sponsorship_Receipt_${s.sponsorName.replace(/\s+/g, '_')}.pdf`);
      } else {
        const canvas = await generateImageFromHTML(receiptHtmlStr);
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `Sponsorship_Receipt_${s.sponsorName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. ' + error.message);
    }
  };

  const handleShareWhatsApp = async (s) => {
    try {
      const receiptHtmlStr = getSponsorshipReceiptHTML(s, config || {}, true);
      const canvas = await generateImageFromHTML(receiptHtmlStr);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
      const file = new File([blob], `Sponsorship_Receipt_${s.sponsorName.replace(/\\s+/g, '_')}.jpg`, { type: 'image/jpeg' });

      const message = `🙏 Thank You from ${config?.committeeName || 'Committee'} ${config?.year || ''} 🙏

The ${config?.committeeName || 'Committee'} sincerely thanks ${s.sponsorName} for your generous sponsorship of ₹${s.amount} towards Durga Puja.

Your kind support and contribution inspire us to make this year's celebration even more memorable for the entire ${config?.societyName || 'society'} family.

With heartfelt gratitude.
Jai Maa Durga! 🌺🙏
— ${config?.committeeName || 'Committee'} ${config?.year || ''}`;

      if (navigator.share) {
        try {
          await navigator.clipboard.writeText(message);
        } catch (err) {
          console.warn('Clipboard write failed', err);
        }
        await navigator.share({
          files: [file],
          text: message,
          title: 'Sponsorship Receipt'
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();

        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      alert('Failed to share receipt. ' + error.message);
    }
  };

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1, md: 2 }} sx={{ mb: { xs: 1.5, md: 2 }, flexShrink: 0 }}>
        {[
          { label: `Internal (${stats.internalCount || 0})`, value: formatCurrency(stats.internalAmount || 0), color: sponsorshipPalette.internal, icon: <InternalIcon />, xs: 6 },
          { label: `External (${stats.externalCount || 0})`, value: formatCurrency(stats.externalAmount || 0), color: sponsorshipPalette.external, icon: <ExternalIcon />, xs: 6 },
          { label: 'CAM (10% Ext.)', value: formatCurrency(stats.totalCamAmount || 0), color: sponsorshipPalette.cam, icon: <PieChartIcon />, xs: 6 },
          { label: `Total (${stats.totalSponsorships || 0})`, value: formatCurrency(stats.totalAmount || 0), color: sponsorshipPalette.gross, icon: <GroupsIcon />, xs: 6 },
          { label: `Pending (${stats.pendingSponsorships || 0})`, value: formatCurrency(stats.pendingAmount || 0), color: sponsorshipPalette.pending, icon: <HourglassIcon />, xs: 12 },
        ].map((s, i) => (
          <Grid key={s.label} size={{ xs: s.xs, sm: 4, md: 2.4 }}>
            <Fade in timeout={400 + i * 100}>
              <Card sx={{ textAlign: { xs: 'left', sm: 'center' }, position: 'relative', overflow: 'hidden', height: '100%', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, ${s.color}88)` } }}>
                <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } }, display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, alignItems: 'center', gap: { xs: 1, sm: 0 } }}>
                  <Box sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, borderRadius: '8px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: { xs: 0, sm: 'auto' }, mb: { xs: 0, sm: 1 }, flexShrink: 0 }}>
                    {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: { xs: 16, sm: 20 } } })}
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: s.color, fontSize: { xs: '0.85rem', sm: '1.15rem' }, lineHeight: 1.2 }}>{s.value}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.65rem', sm: '0.75rem' }, lineHeight: 1, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{s.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mb: { xs: 1.5, sm: 3 } }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
          <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, flex: { xs: '1 1 100%', sm: 1 }, minWidth: { xs: '100%', sm: 200 } }}>
              <TextField size="small" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} /></InputAdornment> } }}
                sx={{ flex: 1 }} />
              
              {isMobile && (
                <>
                  <Tooltip title="Print Status">
                    <IconButton onClick={() => {
                      const html = getSponsorshipsReportHTML(filteredSponsorships, config);
                      printHTML(html);
                    }} sx={{ border: `1px solid ${statusBadge.warning.border}`, color: statusBadge.warning.text, borderRadius: 1, p: 0.75 }}>
                      <PrintIcon sx={{ fontSize: '1.2rem' }} />
                    </IconButton>
                  </Tooltip>
                  {!isAuditor && (
                    <Tooltip title="Add Sponsor">
                      <IconButton onClick={() => { resetForm(); setDialogOpen(true); }} sx={{ bgcolor: brand.orange, color: primary.contrastText, borderRadius: 1, p: 0.75, '&:hover': { bgcolor: brand.orangeDark } }}>
                        <AddIcon sx={{ fontSize: '1.2rem' }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>

            <FormControl size="small" sx={{ flex: { xs: '1 1 30%', sm: 'none' }, minWidth: { xs: '30%', sm: 150 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Type</InputLabel>
              <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="External">External</MenuItem>
                <MenuItem value="Internal">Internal</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: { xs: '1 1 30%', sm: 'none' }, minWidth: { xs: '30%', sm: 150 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Lead</InputLabel>
              <Select value={leadFilter} label="Lead" onChange={(e) => setLeadFilter(e.target.value)} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                <MenuItem value="All">All Leads</MenuItem>
                <MenuItem value="me">My Leads</MenuItem>
                <MenuItem value="Unassigned">Unassigned</MenuItem>
                {uniqueLeads.map(lead => (
                  <MenuItem key={lead} value={lead}>{lead}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: { xs: '1 1 30%', sm: 'none' }, minWidth: { xs: '30%', sm: 150 } }}>
              <InputLabel sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}>
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Received">Received</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => {
                  const html = getSponsorshipsReportHTML(filteredSponsorships, config);
                  printHTML(html);
                }}>Print Status</Button>
                {!isAuditor && (
                  <Button variant="contained" startIcon={<AddIcon />} onClick={() => { resetForm(); setDialogOpen(true); }}>Sponsor</Button>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card>
        {isMobile ? (
          <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredSponsorships.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => {
              const isExternal = (s.sponsorType || 'External') === 'External';
              const camAmount = (isExternal && s.status !== 'Cancelled') ? Math.round((s.amount || 0) * 0.10) : 0;
              return (
                <Card key={s.id} variant="outlined" sx={{ borderRadius: 2, borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Box sx={{ pr: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Box sx={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: 18, width: 18, minWidth: 18, flexShrink: 0, 
                          borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, mt: 0.2,
                          backgroundColor: isExternal ? statusBadge.warning.bg : statusBadge.expense.bg,
                          color: isExternal ? sponsorshipPalette.cam : sponsorshipPalette.gross,
                          border: `1px solid ${isExternal ? statusBadge.warning.border : statusBadge.expense.border}`
                        }}>
                          {isExternal ? 'E' : 'I'}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: '0.8rem' }}>{s.sponsorName}</Typography>
                          {s.organization && (
                            <Typography sx={{ color: 'text.secondary', display: 'block', fontSize: '0.65rem', mt: 0.25, lineHeight: 1.2 }}>{s.organization}</Typography>
                          )}
                        </Box>
                      </Box>
                      {s.status === 'Pending' ? (
                        <Tooltip title="Pending" placement="left">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 22, borderRadius: '50%', backgroundColor: statusBadge.warning.bg, color: statusBadge.warning.text, flexShrink: 0 }}>
                            <PendingIcon sx={{ fontSize: '1rem' }} />
                          </Box>
                        </Tooltip>
                      ) : s.status === 'Cancelled' ? (
                        <Tooltip title="Cancelled" placement="left">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 22, borderRadius: '50%', backgroundColor: statusBadge.error.bg, color: statusBadge.error.text, flexShrink: 0 }}>
                            <CloseIcon sx={{ fontSize: '1rem' }} />
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip title={s.status || 'Received'} placement="left">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22, width: 22, borderRadius: '50%', backgroundColor: statusBadge.success.bg, color: statusBadge.success.text, flexShrink: 0 }}>
                            <CheckCircleIcon sx={{ fontSize: '1rem' }} />
                          </Box>
                        </Tooltip>
                      )}
                    </Box>
                    
                    <Grid container spacing={0} sx={{ mb: 0.5 }}>
                      <Grid sx={{ display: 'flex', alignItems: 'center', minWidth: 0, pr: 0.5, mb: { xs: 0.5, sm: 0 }, width: '38%' }}>
                        <Typography sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0, fontSize: '0.65rem' }}>Inv:</Typography>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }} noWrap>{s.invoiceRef || '-'}</Typography>
                      </Grid>
                      <Grid sx={{ display: 'flex', alignItems: 'center', minWidth: 0, mb: { xs: 0.5, sm: 0 }, width: '62%' }}>
                        <Typography sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0, fontSize: '0.65rem' }}>For:</Typography>
                        <Tooltip title={s.invoiceDescription || ''}>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }} noWrap>{s.invoiceDescription || '-'}</Typography>
                        </Tooltip>
                      </Grid>
                      <Grid sx={{ display: 'flex', alignItems: 'center', minWidth: 0, pr: 0.5, mb: { xs: 0.5, sm: 0 }, width: '38%' }}>
                        <Typography sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0, fontSize: '0.65rem' }}>Phone:</Typography>
                        {s.contactNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }} noWrap>{s.contactNumber}</Typography>
                            <IconButton size="small" component="a" href={`tel:${s.contactNumber}`} sx={{ p: 0.2, color: statusBadge.success.text, bgcolor: statusBadge.success.bg, flexShrink: 0 }}>
                              <PhoneIcon sx={{ fontSize: '0.75rem' }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }}>-</Typography>
                        )}
                      </Grid>
                      <Grid sx={{ display: 'flex', alignItems: 'center', minWidth: 0, width: '62%' }}>
                        <Typography sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0, fontSize: '0.65rem' }}>Lead:</Typography>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }} noWrap>{s.trackingLead || '-'}</Typography>
                      </Grid>
                      {(() => {
                        const extracted = extractDates(s.remarks);
                        const hasDates = extracted !== '-';
                        return (
                          <Grid size={12} sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography sx={{ color: 'text.secondary', mr: 0.5, flexShrink: 0, whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                              {hasDates ? 'Event On:' : 'Desc:'}
                            </Typography>
                            <Tooltip title={s.remarks || ''}>
                              <Typography sx={{ fontWeight: 500, fontSize: '0.65rem' }} noWrap>
                                {hasDates ? extracted : (s.remarks || '-')}
                              </Typography>
                            </Tooltip>
                          </Grid>
                        );
                      })()}
                    </Grid>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', pt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                          <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>Amount:</Typography>
                          <Typography sx={{ fontWeight: 700, color: sponsorshipPalette.gross, fontSize: '0.8rem' }}>{formatCurrency(s.amount)}</Typography>
                        </Box>
                        {s.transactionDate && (
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>Paid On:</Typography>
                            <Typography sx={{ color: statusBadge.success.text, fontWeight: 600, fontSize: '0.75rem' }}>{formatDate(s.transactionDate, config?.dateFormat)}</Typography>
                          </Box>
                        )}
                        {isExternal && (
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>CAM:</Typography>
                            <Typography sx={{ color: s.status === 'Cancelled' ? 'text.secondary' : statusBadge.warning.text, fontWeight: s.status === 'Cancelled' ? 400 : 600, fontSize: '0.75rem' }}>
                              {s.status === 'Cancelled' ? '-' : formatCurrency(camAmount)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {canEdit && !(user?.role === 'Collection' && s.status !== 'Pending') && (
                          <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: statusBadge.warning.text, p: 0.5 }}>
                            <EditIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={(e) => handleActionMenuOpen(e, s)} sx={{ p: 0.5 }}>
                          <MoreVertIcon sx={{ fontSize: '1.1rem' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
            {filteredSponsorships.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <SponsorIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 1 }} />
                <Typography sx={{ color: 'text.secondary' }}>No sponsors recorded yet</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Sponsor</TableCell>
                  <TableCell>Organization</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Paid On</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Event On</TableCell>
                  <TableCell>CAM (10%)</TableCell>
                  <TableCell>Lead</TableCell>
                  <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSponsorships.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((s) => {
                  const isExternal = (s.sponsorType || 'External') === 'External';
                  const camAmount = (isExternal && s.status !== 'Cancelled') ? Math.round((s.amount || 0) * 0.10) : 0;
                  return (
                    <TableRow key={s.id}>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{s.invoiceRef || '-'}</Typography></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <Box sx={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            height: 20, width: 20, minWidth: 20, flexShrink: 0, 
                            borderRadius: 1, fontSize: '0.75rem', fontWeight: 700, mt: 0.2,
                            backgroundColor: isExternal ? statusBadge.warning.bg : statusBadge.expense.bg,
                            color: isExternal ? sponsorshipPalette.cam : sponsorshipPalette.gross,
                            border: `1px solid ${isExternal ? statusBadge.warning.border : statusBadge.expense.border}`
                          }}>
                            {isExternal ? 'E' : 'I'}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.3 }}>{s.sponsorName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.organization || '-'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: sponsorshipPalette.gross }}>{formatCurrency(s.amount)}</Typography></TableCell>
                      <TableCell>
                        {s.status === 'Pending' ? (
                          <Chip 
                            icon={<PendingIcon sx={{ fontSize: '1rem !important', color: `${brand.orange} !important` }} />} 
                            label="Pending" 
                            size="small" 
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: statusBadge.warning.bg, color: statusBadge.warning.text, border: `1px solid ${statusBadge.warning.border}` }} 
                          />
                        ) : s.status === 'Cancelled' ? (
                          <Chip 
                            label="Cancelled" 
                            size="small" 
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, backgroundColor: statusBadge.error.bg, color: statusBadge.error.text, border: `1px solid ${statusBadge.error.border}` }} 
                          />
                        ) : (
                          <Chip 
                            label={s.status || 'Received'} 
                            size="small" 
                            color="success" 
                            variant="outlined"
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, border: `1px solid ${statusBadge.success.border}`, backgroundColor: statusBadge.success.bg }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {s.statusNote ? (
                          <Tooltip title={s.statusNote} placement="top">
                            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', cursor: 'help' }}>
                              {s.transactionDate ? formatDate(s.transactionDate, config?.dateFormat) : '-'}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            {s.transactionDate ? formatDate(s.transactionDate, config?.dateFormat) : '-'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.paymentMode}</Typography>
                      </TableCell>
                      <TableCell>
                        {s.contactNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{s.contactNumber}</Typography>
                            <IconButton size="small" component="a" href={`tel:${s.contactNumber}`} sx={{ p: 0.5, color: statusBadge.success.text, bgcolor: statusBadge.success.bg }}>
                              <PhoneIcon sx={{ fontSize: '0.9rem' }} />
                            </IconButton>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={s.remarks || ''} placement="top">
                          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 120 }} noWrap>
                            {extractDates(s.remarks)}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: (isExternal && s.status !== 'Cancelled') ? statusBadge.warning.text : 'text.secondary', fontWeight: (isExternal && s.status !== 'Cancelled') ? 600 : 400 }}>
                          {(isExternal && s.status !== 'Cancelled') ? formatCurrency(camAmount) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>{s.trackingLead || '-'}</Typography></TableCell>
                      <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {canEdit && !(user?.role === 'Collection' && s.status !== 'Pending') && (
                            <IconButton size="small" onClick={() => handleEdit(s)} sx={{ color: statusBadge.warning.text }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={(e) => handleActionMenuOpen(e, s)}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredSponsorships.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                      <SponsorIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.1)', mb: 1 }} />
                      <Typography sx={{ color: 'text.secondary' }}>No sponsors recorded yet</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredSponsorships.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        />
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        {dialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{editId ? 'Edit Sponsorship' : 'New Sponsorship'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }} sx={{ pt: 1 }}>
            <Grid size={{ xs: 6, sm: 6 }}>
              <TextField fullWidth size="small" label="Invoice No" value={form.invoiceRef} onChange={(e) => setForm({ ...form, invoiceRef: e.target.value })} placeholder="e.g. DPC/2026-27/0001" />
            </Grid>
            <Grid size={{ xs: 6, sm: 6 }}>
              <DatePicker
                label="Invoice Date"
                value={new Date(form.invoiceDate)}
                onChange={(newValue) => {
                  if (newValue && !isNaN(newValue.getTime())) {
                    setForm({ ...form, invoiceDate: getLocalISODate(newValue) });
                  }
                }}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12 }}>
              <TextField fullWidth size="small" label="Invoice Description" value={form.invoiceDescription} onChange={(e) => setForm({ ...form, invoiceDescription: e.target.value })} placeholder="e.g. Stall arrangement charges" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Sponsor Name" value={form.sponsorName} onChange={(e) => setForm({ ...form, sponsorName: e.target.value })} required />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Sponsor Type</InputLabel>
                <Select value={form.sponsorType} onChange={(e) => setForm({ ...form, sponsorType: e.target.value })} label="Sponsor Type">
                  <MenuItem value="External">External</MenuItem>
                  <MenuItem value="Internal">Internal</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField fullWidth type="number" label="Quantity" value={form.invoiceQuantity || 1} onChange={(e) => setForm({ ...form, invoiceQuantity: parseInt(e.target.value) || 1 })} slotProps={{ htmlInput: { min: 1 } }} />
            </Grid>
            <Grid size={12}><TextField fullWidth label="Organization" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></Grid>
            <Grid size={{ xs: 6, sm: 6 }}><TextField fullWidth label="Contact Number" value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} /></Grid>
            <Grid size={{ xs: 6, sm: 6 }}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
            <Grid size={12}><TextField fullWidth label="Description" multiline rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={(config?.userRoles || []).map(u => u.fullName || u.email)}
                value={form.trackingLead}
                onChange={(e, newValue) => setForm({ ...form, trackingLead: newValue })}
                onInputChange={(e, newInputValue) => setForm({ ...form, trackingLead: newInputValue })}
                renderInput={(params) => <TextField {...params} label="Tracking Lead" />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
            </Grid>
            {form.sponsorType === 'External' && form.amount > 0 && (
              <Grid size={12}>
                <Box sx={{ p: 1.5, borderRadius: 1, backgroundColor: statusBadge.info.bg, border: `1px solid ${statusBadge.info.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: statusBadge.warning.text, fontWeight: 600 }}>
                    CAM Allocation (10%): {formatCurrency(Math.round(form.amount * 0.10))}
                  </Typography>
                  <Typography variant="caption" sx={{ color: statusBadge.success.text, fontWeight: 600 }}>
                    Net Fund (90%): {formatCurrency(Math.round(form.amount * 0.90))}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth><InputLabel>Status</InputLabel>
                <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} label="Status" disabled={!isFinanceUser}>
                  {['Received', 'Pending', 'Cancelled'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <FormControl fullWidth><InputLabel>Payment Mode</InputLabel>
                <Select value={form.paymentMode || ''} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} label="Payment Mode" disabled={form.status !== 'Received'}>
                  {['UPI', 'Cash', 'Cheque', 'Net Banking'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <DatePicker
                label="Transaction Date"
                value={form.transactionDate ? new Date(form.transactionDate) : null}
                onChange={(newValue) => {
                  if (newValue && !isNaN(newValue.getTime())) {
                    setForm({ ...form, transactionDate: getLocalISODate(newValue) });
                  } else {
                    setForm({ ...form, transactionDate: null });
                  }
                }}
                disabled={form.status === 'Pending'}
                format={getDatePickerFormat(config?.dateFormat)}
                sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true, error: form.status === 'Received' && !form.transactionDate, helperText: form.status === 'Received' && !form.transactionDate ? 'Required' : '' } }}
              />
            </Grid>
            {form.status === 'Cancelled' && (
              <Grid size={12} sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>Refund Details</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <DatePicker
                      label="Refund Date"
                      value={form.refundDate ? new Date(form.refundDate) : null}
                      onChange={(newValue) => {
                        if (newValue && !isNaN(newValue.getTime())) {
                          setForm({ ...form, refundDate: getLocalISODate(newValue) });
                        } else {
                          setForm({ ...form, refundDate: null });
                        }
                      }}
                      format={getDatePickerFormat(config?.dateFormat)}
                      sx={{ width: '100%' }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <FormControl fullWidth size="small"><InputLabel>Refund Mode</InputLabel>
                      <Select value={form.refundMode || ''} onChange={(e) => setForm({ ...form, refundMode: e.target.value })} label="Refund Mode">
                        {['UPI', 'Cash', 'Cheque', 'Net Banking'].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Refund Remarks" value={form.refundRemarks} onChange={(e) => setForm({ ...form, refundRemarks: e.target.value })} placeholder="Reference / Note" />
                  </Grid>
                </Grid>
              </Grid>
            )}

            <Grid size={12}>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                Upload Payment Proof (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<CameraIcon />}
                    fullWidth
                    sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    Camera
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Grid>
                <Grid size={6}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    fullWidth
                    sx={{ py: 1.5, borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    Gallery
                    <input
                      type="file"
                      hidden
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            {((form.existingProofs && form.existingProofs.length > 0) || (form.proofFiles && form.proofFiles.length > 0)) && (
              <Grid size={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Attached Proofs:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                  {form.existingProofs && form.existingProofs.map((img, idx) => (
                    <Box key={`exist-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                      <img src={img} alt="Existing proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                      <IconButton
                        size="small"
                        onClick={() => removeExistingProof(idx)}
                        sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: statusBadge.error.text, color: primary.contrastText, '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  ))}
                  {form.proofFiles && form.proofFiles.map((file, idx) => {
                    const localUrl = URL.createObjectURL(file);
                    return (
                      <Box key={`new-${idx}`} sx={{ position: 'relative', width: 64, height: 64 }}>
                        <img src={localUrl} alt="New proof" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4, border: '1px solid rgba(128,128,128,0.2)' }} />
                        <IconButton
                          size="small"
                          onClick={() => removeNewProofFile(idx)}
                          sx={{ position: 'absolute', top: -6, right: -6, backgroundColor: statusBadge.error.text, color: primary.contrastText, '&:hover': { backgroundColor: status.error.dark(true) }, p: 0.2 }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              </Grid>
            )}
            <Grid size={12}><TextField fullWidth label="Status Note" multiline rows={2} value={form.statusNote} onChange={(e) => setForm({ ...form, statusNote: e.target.value })} placeholder="Any specific note on current status" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.sponsorName || Number(form.amount) <= 0 || (form.status === 'Received' && !form.paymentMode)} startIcon={<RupeeIcon />}>{editId ? 'Update' : 'Save'}</Button>
        </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={proofDialogOpen}
        onClose={() => setProofDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {proofDialogOpen && (
          <>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span">Payment Proof</Typography>
          <IconButton onClick={() => setProofDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, textAlign: 'center', maxHeight: '80vh', overflowY: 'auto' }}>
          {proofImages && proofImages.map((img, idx) => (
            <Box key={idx} sx={{ mb: idx === proofImages.length - 1 ? 0 : 3, position: 'relative' }}>
              {proofImages.length > 1 && (
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Image {idx + 1} of {proofImages.length}
                </Typography>
              )}
              <img
                src={img}
                alt={`Payment Proof ${idx + 1}`}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }}
              />
            </Box>
          ))}
        </DialogContent>
          </>
        )}
      </Dialog>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
      />

      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {actionSponsorship?.paymentProofUrl && (
          <MenuItem onClick={async () => {
            handleActionMenuClose();
            const imgs = await getPaymentProof(actionSponsorship.id, actionSponsorship.paymentProofUrl);
            if (imgs && imgs.length > 0) {
              setProofImages(imgs);
              setProofDialogOpen(true);
            }
          }}>
            <ListItemIcon><ImageIcon fontSize="small" sx={{ color: statusBadge.success.text }} /></ListItemIcon>
            <ListItemText>View Proof</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={(e) => { 
          const anchor = actionMenuAnchor;
          handleActionMenuClose(); 
          setDownloadMenuAnchor(anchor);
          setDownloadMenuTarget({ s: actionSponsorship, type: 'invoice' });
        }}>
          <ListItemIcon><ReceiptIcon fontSize="small" sx={{ color: sponsorshipPalette.internal }} /></ListItemIcon>
          <ListItemText>Invoice (Print / Download)</ListItemText>
        </MenuItem>

        {actionSponsorship?.status !== 'Pending' && [
          <MenuItem key="receipt" onClick={(e) => { 
            const anchor = actionMenuAnchor;
            handleActionMenuClose(); 
            setDownloadMenuAnchor(anchor);
            setDownloadMenuTarget({ s: actionSponsorship, type: 'receipt' });
          }}>
            <ListItemIcon><DownloadIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
            <ListItemText>Receipt (Print / Download)</ListItemText>
          </MenuItem>,
          !isAuditor ? (
            <MenuItem key="whatsapp" onClick={() => { handleActionMenuClose(); handleShareWhatsApp(actionSponsorship); }}>
              <ListItemIcon><WhatsAppIcon fontSize="small" sx={{ color: thirdParty.whatsapp }} /></ListItemIcon>
              <ListItemText>Share to WhatsApp</ListItemText>
            </MenuItem>
          ) : null
        ]}

        {isSuperAdmin && [
          <MenuItem key="duplicate" onClick={() => { handleActionMenuClose(); handleDuplicate(actionSponsorship); }}>
            <ListItemIcon><AddIcon fontSize="small" sx={{ color: statusBadge.success.text }} /></ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>,
          <MenuItem key="delete" onClick={() => { handleActionMenuClose(); handleDelete(actionSponsorship.id); }}>
            <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        ]}
      </Menu>

      <Menu
        anchorEl={downloadMenuAnchor}
        open={Boolean(downloadMenuAnchor)}
        onClose={handleDownloadMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => {
          if (downloadMenuTarget) {
            const { s, type } = downloadMenuTarget;
            if (type === 'invoice') handlePrintInvoice(s);
            else handlePrintReceipt(s);
          }
          handleDownloadMenuClose();
        }}>
          <ListItemIcon><PrintIcon fontSize="small" sx={{ color: brand.orange }} /></ListItemIcon>
          <ListItemText primary="Print / Save as PDF" secondary="Native A4 vector text" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (downloadMenuTarget) {
            const { s, type } = downloadMenuTarget;
            if (type === 'invoice') handleDownloadInvoice(s, 'pdf');
            else handleDownloadReceipt(s, 'pdf');
          }
          handleDownloadMenuClose();
        }}>
          <ListItemIcon><PictureAsPdfIcon fontSize="small" sx={{ color: statusBadge.error.text }} /></ListItemIcon>
          <ListItemText primary="Download PDF" secondary="Standard A4 file" />
        </MenuItem>
        <MenuItem onClick={() => {
          if (downloadMenuTarget) {
            const { s, type } = downloadMenuTarget;
            if (type === 'invoice') handleDownloadInvoice(s, 'image');
            else handleDownloadReceipt(s, 'image');
          }
          handleDownloadMenuClose();
        }}>
          <ListItemIcon><ImageIcon fontSize="small" sx={{ color: statusBadge.info.text }} /></ListItemIcon>
          <ListItemText primary="Download Image" secondary="High-res JPEG" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Sponsorships;
