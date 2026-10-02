import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Button, Alert, Grid, FormControl, InputLabel, Select, MenuItem, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Tooltip } from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { status, border } from '../../../theme/colorTokens';

const CommitteeDirectoryTab = ({ config, setConfig, saveSectionConfig }) => {
  const [dpcForm, setDpcForm] = useState({ role: '', name: '', flatNumber: '', phone: '', icon: 'crown' });
  const [dpcEditIndex, setDpcEditIndex] = useState(-1);

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Committee Members</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Manage the committee member directory shown on the public home page.
            </Typography>
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          These members will be displayed on the public home page under the "Committee" tab. Remember to click "Save Directory" after making changes.
        </Alert>

        {/* Add / Edit Form */}
        <Card sx={{ mb: 3, backgroundColor: 'rgba(255,143,0,0.04)', border: '1px solid rgba(255,143,0,0.15)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              {dpcEditIndex >= 0 ? `Editing Member #${dpcEditIndex + 1}` : 'Add New Member'}
            </Typography>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="dpc-role-label">Role</InputLabel>
                  <Select
                    labelId="dpc-role-label"
                    id="dpc-role-select"
                    value={dpcForm.role}
                    onChange={(e) => setDpcForm({ ...dpcForm, role: e.target.value })}
                    label="Role"
                  >
                    {['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Joint Treasurer', 'Convenor', 'Joint Convenor', 'Cultural Committee Secretary', 'Joint Cultural Secretary', 'Member'].map(r => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField fullWidth label="Name" value={dpcForm.name} size="small"
                  onChange={(e) => setDpcForm({ ...dpcForm, name: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth label="Flat No." value={dpcForm.flatNumber} size="small"
                  placeholder="e.g. 6/11D"
                  onChange={(e) => setDpcForm({ ...dpcForm, flatNumber: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField fullWidth label="Phone" value={dpcForm.phone} size="small"
                  placeholder="e.g. 90076 99408"
                  onChange={(e) => setDpcForm({ ...dpcForm, phone: e.target.value })} />
              </Grid>
              <Grid size={{ xs: 12, sm: 2 }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={dpcEditIndex >= 0 ? <EditIcon /> : <AddIcon />}
                    disabled={!dpcForm.role || !dpcForm.name}
                    onClick={() => {
                      const iconMap = {
                        'President': 'crown', 'Vice President': 'crown',
                        'Secretary': 'pen', 'Joint Secretary': 'pen',
                        'Treasurer': 'rupee', 'Joint Treasurer': 'rupee',
                        'Convenor': 'handshake', 'Joint Convenor': 'handshake',
                        'Cultural Committee Secretary': 'music', 'Joint Cultural Secretary': 'music',
                      };
                      const member = { ...dpcForm, icon: iconMap[dpcForm.role] || 'crown' };
                      const members = [...(config.dpcMembers || [])];
                      if (dpcEditIndex >= 0) {
                        members[dpcEditIndex] = member;
                      } else {
                        members.push(member);
                      }
                      setConfig({ ...config, dpcMembers: members });
                      setDpcForm({ role: '', name: '', flatNumber: '', phone: '', icon: 'crown' });
                      setDpcEditIndex(-1);
                    }}
                  >
                    {dpcEditIndex >= 0 ? 'Update' : 'Add'}
                  </Button>
                  {dpcEditIndex >= 0 && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setDpcForm({ role: '', name: '', flatNumber: '', phone: '', icon: 'crown' });
                        setDpcEditIndex(-1);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Members Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Flat No.</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 80, minWidth: 80 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!config.dpcMembers || config.dpcMembers.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography sx={{ color: 'text.secondary' }}>No DPC members configured. Add members above or click "Reset to Defaults".</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                config.dpcMembers.map((member, idx) => (
                  <TableRow key={idx} sx={{ backgroundColor: dpcEditIndex === idx ? 'rgba(255,143,0,0.06)' : 'transparent' }}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Chip label={member.role} size="small" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{member.name}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{member.flatNumber}</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{member.phone}</TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: (theme) => `1px solid ${border.divider(theme.palette.mode === 'dark')}`, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => {
                            setDpcForm({ ...member });
                            setDpcEditIndex(idx);
                          }} sx={{ color: (theme) => status.warning.main(theme.palette.mode === 'dark') }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                          <IconButton size="small" onClick={() => {
                            const members = config.dpcMembers.filter((_, i) => i !== idx);
                            setConfig({ ...config, dpcMembers: members });
                            if (dpcEditIndex === idx) {
                              setDpcEditIndex(-1);
                              setDpcForm({ role: '', name: '', flatNumber: '', phone: '', icon: 'crown' });
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
          <Button variant="contained" startIcon={<SaveIcon />} onClick={() => saveSectionConfig('Committee Directory')} size="small">
            Save Directory
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CommitteeDirectoryTab;
