import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Alert, Grid2 as Grid, FormControl, InputLabel, Select, MenuItem, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Tooltip } from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon, Contacts as ContactIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { gradient, text, status, border } from '../../../theme/colorTokens';

const SocietyDirectoryTab = ({ config, setConfig, saveSectionConfig }) => {
  const [societyForm, setSocietyForm] = useState({ roleTemplate: 'Facility Manager', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' });
  const [societyEditIndex, setSocietyEditIndex] = useState(-1);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: gradient.brand,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ContactIcon sx={{ color: text.white, fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Society Contact Directory</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage contact details for society managers, support staff, and technical teams.
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          These contacts will be displayed on the public "Society" directory page. Remember to click "Save Society Directory" after making changes.
        </Alert>

        {/* Add / Edit Form */}
        <Card sx={{ mb: 3, backgroundColor: 'rgba(255,143,0,0.04)', border: '1px solid rgba(255,143,0,0.15)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {societyEditIndex >= 0 ? `Editing Contact #${societyEditIndex + 1}` : 'Add New Contact'}
            </Typography>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="society-role-template-label">Role Template</InputLabel>
                  <Select
                    labelId="society-role-template-label"
                    id="society-role-template-select"
                    value={societyForm.roleTemplate || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Custom') {
                        setSocietyForm({ ...societyForm, roleTemplate: val });
                      } else {
                        setSocietyForm({ ...societyForm, roleTemplate: val, role: val });
                      }
                    }}
                    label="Role Template"
                  >
                    {['Facility Manager', 'Support', 'Technical Manager', 'Civil Manager', 'House Keeping', 'Site Incharge', 'Security', 'Electrical', 'Plumbing', 'Custom'].map(r => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label="Custom Role Name"
                  value={societyForm.role}
                  size="small"
                  disabled={societyForm.roleTemplate !== 'Custom'}
                  onChange={(e) => setSocietyForm({ ...societyForm, role: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <TextField fullWidth label="Name" value={societyForm.name} size="small"
                  onChange={(e) => setSocietyForm({ ...societyForm, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth label="Phone" value={societyForm.phone} size="small"
                  placeholder="e.g. 90076 99408"
                  onChange={(e) => setSocietyForm({ ...societyForm, phone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth label="Email / Details" value={societyForm.email} size="small"
                  placeholder="e.g. manager@society.com"
                  onChange={(e) => setSocietyForm({ ...societyForm, email: e.target.value })} />
              </Grid>
              <Grid sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }} size={12}>
                <Button
                  variant="contained"
                  startIcon={societyEditIndex >= 0 ? <EditIcon /> : <AddIcon />}
                  disabled={!societyForm.role || !societyForm.name || !societyForm.phone}
                  onClick={() => {
                    const iconMap = {
                      'Facility Manager': 'manager', 'Support': 'support',
                      'Technical Manager': 'technical', 'Civil Manager': 'civil',
                      'House Keeping': 'housekeeping', 'Site Incharge': 'incharge',
                      'Security': 'security', 'Electrical': 'electrical', 'Plumbing': 'plumbing'
                    };
                    const contact = {
                      ...societyForm,
                      icon: iconMap[societyForm.role] || 'custom',
                      id: societyEditIndex >= 0 ? config.societyContacts[societyEditIndex].id : uuidv4()
                    };
                    const contacts = [...(config.societyContacts || [])];
                    if (societyEditIndex >= 0) {
                      contacts[societyEditIndex] = contact;
                    } else {
                      contacts.push(contact);
                    }
                    setConfig({ ...config, societyContacts: contacts });
                    setSocietyForm({ roleTemplate: 'Facility Manager', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' });
                    setSocietyEditIndex(-1);
                  }}
                  size="small"
                >
                  {societyEditIndex >= 0 ? 'Update Contact' : 'Add Contact'}
                </Button>
                {societyEditIndex >= 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSocietyForm({ roleTemplate: 'Facility Manager', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' });
                      setSocietyEditIndex(-1);
                    }}
                    size="small"
                  >
                    Cancel
                  </Button>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Contacts Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email / Details</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!config.societyContacts || config.societyContacts.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No society contacts configured. Add contacts above.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                config.societyContacts.map((contact, idx) => (
                  <TableRow key={contact.id || idx} sx={{ backgroundColor: societyEditIndex === idx ? 'rgba(255,143,0,0.06)' : 'transparent' }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Chip label={contact.role} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{contact.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{contact.phone}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{contact.email || '—'}</TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => {
                            const templates = ['Facility Manager', 'Support', 'Technical Manager', 'Civil Manager', 'Security', 'Electrical', 'Plumbing'];
                            const isTemplate = templates.includes(contact.role);
                            setSocietyForm({
                              roleTemplate: isTemplate ? contact.role : 'Custom',
                              role: contact.role,
                              name: contact.name,
                              phone: contact.phone,
                              email: contact.email || '',
                              icon: contact.icon || 'custom',
                            });
                            setSocietyEditIndex(idx);
                          }} sx={{ color: (theme) => status.warning.main(theme.palette.mode === 'dark') }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => {
                            const contacts = config.societyContacts.filter((_, i) => i !== idx);
                            setConfig({ ...config, societyContacts: contacts });
                            if (societyEditIndex === idx) {
                              setSocietyEditIndex(-1);
                              setSocietyForm({ roleTemplate: 'Facility Manager', role: 'Facility Manager', name: '', phone: '', email: '', icon: 'manager' });
                            }
                          }} sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark') }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('Society Directory')} size="small">
            Save Society Directory
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SocietyDirectoryTab;
