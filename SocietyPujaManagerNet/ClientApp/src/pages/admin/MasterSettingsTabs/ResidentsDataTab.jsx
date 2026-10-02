import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Grid2 as Grid, MenuItem, FormControl, InputLabel, Select,  } from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { createResident } from '../../../services/residentService';
import { statusBadge } from '../../../theme/colorTokens';

const ResidentsDataTab = ({
  existingResidents,
  setImportDialogOpen,
  handleExportData,
  importDialogOpen,
  importText,
  setImportText,
  handleImportMasterData,
  onResidentAdded,
  config,
}) => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    block: '',
    floor: '',
    flatType: '',
    mobile: '',
    email: '',
    remarks: '',
  });

  const resetForm = () => {
    setForm({ name: '', block: '', floor: '', flatType: '', mobile: '', email: '', remarks: '' });
  };

  const handleAddSingleResident = async () => {
    if (!form.name.trim() || !form.block || !form.floor || !form.flatType.trim()) {
      alert('Please fill in Name, Block, Floor, and Flat Type.');
      return;
    }

    const flatNumber = `${form.block}-${form.floor}-${form.flatType.trim().toUpperCase()}`;
    const exists = existingResidents.some((r) => r.flatNumber === flatNumber);
    if (exists) {
      alert(`Flat ${flatNumber} already exists in database.`);
      return;
    }

    try {
      setSubmitting(true);
      await createResident({
        name: form.name.trim(),
        block: parseInt(form.block),
        floor: parseInt(form.floor),
        flatType: form.flatType.trim().toUpperCase(),
        mobile: form.mobile.trim(),
        email: form.email.trim(),
        remarks: form.remarks.trim(),
      });

      setAddDialogOpen(false);
      resetForm();
      if (onResidentAdded) {
        await onResidentAdded();
      }
    } catch (error) {
      alert(`Error creating resident: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                Master Resident & Flat Data Management
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Add single flat owners or bulk import flat owner records into the master database.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<AddIcon />}
                onClick={() => {
                  resetForm();
                  setAddDialogOpen(true);
                }}
              >
                Flat Owner
              </Button>
              <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setImportDialogOpen(true)}>
                Import Bulk Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleExportData}
                disabled={existingResidents.length === 0}
              >
                Export Data ({existingResidents.length})
              </Button>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
              Bulk Import Format (CSV or Tab-separated):
            </Typography>
            <code style={{ fontSize: '0.8rem' }}>Name, Block, Floor, FlatType, Mobile (optional), Email (optional)</code>
            <br />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
              Example: <code>Rajesh Kumar, 3, 5, A, 9876543210</code>
            </Typography>
          </Alert>

          {existingResidents.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                Current Database Summary
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`${existingResidents.length} Total Flats`} sx={{ backgroundColor: statusBadge.info.bg, color: statusBadge.info.text, fontWeight: 700 }} />
                <Chip label={`${existingResidents.filter((r) => r.subscriptionStatus === 'paid').length} Paid`} sx={{ backgroundColor: statusBadge.success.bg, color: statusBadge.success.text, fontWeight: 700 }} />
                <Chip label={`${existingResidents.filter((r) => r.subscriptionStatus === 'pending').length} Pending`} sx={{ backgroundColor: statusBadge.warning.bg, color: statusBadge.warning.text, fontWeight: 700 }} />
                {[...new Set(existingResidents.map((r) => r.block))].sort((a, b) => a - b).map((block) => (
                  <Chip
                    key={block}
                    label={`Block ${block}: ${existingResidents.filter((r) => r.block === block).length}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add Single Flat Owner Dialog */}
      <Dialog 
        open={addDialogOpen} 
        onClose={() => setAddDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>New Flat Owner</Typography>
          <IconButton onClick={() => setAddDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={12}>
              <TextField
                fullWidth size="small"
                label="Resident Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Grid>
            <Grid size={4}>
              <FormControl fullWidth size="small" required>
                <InputLabel id="resident-block-label">Block</InputLabel>
                <Select
                  labelId="resident-block-label"
                  id="resident-block-select"
                  value={form.block}
                  onChange={(e) => setForm({ ...form, block: e.target.value })}
                  label="Block"
                >
                  {(config?.blocks || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]).map((b) => (
                    <MenuItem key={b} value={b}>Block {b}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth size="small"
                label="Floor"
                type="number"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                required
              />
            </Grid>
            <Grid size={4}>
              <TextField
                fullWidth size="small"
                label="Flat Type (e.g. A, B)"
                value={form.flatType}
                onChange={(e) => setForm({ ...form, flatType: e.target.value })}
                required
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth size="small"
                label="Mobile Number (Optional)"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth size="small"
                label="Email (Optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth size="small"
                label="Remarks / Notes (Optional)"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                multiline rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleAddSingleResident}
            disabled={submitting || !form.name.trim() || !form.block || !form.floor || !form.flatType.trim()}
          >
            Create Flat Owner
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Import Master Data</Typography>
          <IconButton onClick={() => setImportDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Paste your data below. Each line should be: <strong>Name, Block, Floor, FlatType</strong> (comma or tab separated).
            Duplicate flat numbers will be skipped.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={15}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Rajesh Kumar, 1, 1, A, 9876543210\nPriya Sharma, 1, 1, B\nAmit Patel, 1, 2, A, 9123456789, amit@email.com\n...`}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '0.85rem',
              },
            }}
          />
          <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
            Lines parsed: {importText.trim() ? importText.trim().split('\n').filter((l) => l.trim()).length : 0}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportMasterData}
            disabled={!importText.trim()}
            startIcon={<UploadIcon />}
          >
            Import Data
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResidentsDataTab;
