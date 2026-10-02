import React from 'react';
import { Card, CardContent, Typography, Alert, Grid, TextField, FormControl, InputLabel, Select, MenuItem, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, IconButton, Box } from '@mui/material';
import { Delete as DeleteIcon, Block as BlockIcon, CheckCircle as CheckCircleIcon, Edit as EditIcon, Cancel as CancelIcon } from '@mui/icons-material';

const UserAccessTab = ({ config, newUserRole, setNewUserRole, addUserRole, removeUserRole, toggleUserStatus, editUserRole }) => {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>User Access & Roles</Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          Add users here to grant them access. A Firebase Auth account will be created with the given email and password. The password is <strong>not</strong> stored in Firestore.
        </Alert>

        <Grid container spacing={2.5} sx={{ mb: 4, alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Username (Email)" value={newUserRole.email}
              onChange={(e) => setNewUserRole({ ...newUserRole, email: e.target.value })} size="small" disabled={newUserRole.isEditing} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Full Name" value={newUserRole.fullName || ''}
              onChange={(e) => setNewUserRole({ ...newUserRole, fullName: e.target.value })} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField fullWidth label="Password" type="text" value={newUserRole.password} placeholder={newUserRole.isEditing ? "(Unchanged)" : ""}
              onChange={(e) => setNewUserRole({ ...newUserRole, password: e.target.value })} size="small" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-role-label">Role</InputLabel>
              <Select labelId="user-role-label" id="user-role-select" value={newUserRole.role} label="Role" onChange={(e) => setNewUserRole({ ...newUserRole, role: e.target.value })}>
                <MenuItem value="Super Admin">Super Admin</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Treasurer">Treasurer</MenuItem>
                <MenuItem value="Auditor">Auditor</MenuItem>
                <MenuItem value="FoodCoupon">FoodCoupon</MenuItem>
                <MenuItem value="Standard">Standard</MenuItem>
                <MenuItem value="Cultural">Cultural</MenuItem>
                <MenuItem value="Collection">Collection</MenuItem>
                <MenuItem value="Food Seller">Food Seller</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-status-label">Status</InputLabel>
              <Select labelId="user-status-label" id="user-status-select" value={newUserRole.isActive !== false ? 'active' : 'inactive'} label="Status" onChange={(e) => setNewUserRole({ ...newUserRole, isActive: e.target.value === 'active' })}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" fullWidth onClick={addUserRole} disabled={!newUserRole.email || (!newUserRole.isEditing && !newUserRole.password)}>
                {newUserRole.isEditing ? 'Update' : 'Add'}
              </Button>
              {newUserRole.isEditing && (
                <IconButton color="error" size="small" onClick={() => setNewUserRole({ email: '', password: '', role: 'FoodCoupon', fullName: '', isActive: true, isEditing: false })} title="Cancel Edit">
                  <CancelIcon />
                </IconButton>
              )}
            </Box>
          </Grid>
        </Grid>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>Existing Users</Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Username (Email)</TableCell>
                <TableCell>Full Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 2, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap', width: 120, minWidth: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!config.userRoles || config.userRoles.length === 0) ? (
                <TableRow><TableCell colSpan={3} align="center">No additional users configured.</TableCell></TableRow>
              ) : (
                config.userRoles.map((ur, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ fontWeight: 500 }}>{ur.email}</TableCell>
                    <TableCell>{ur.fullName || '-'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={ur.role} color={ur.role === 'Super Admin' ? 'error' : ur.role === 'Admin' ? 'primary' : ur.role === 'Treasurer' ? 'info' : ur.role === 'Auditor' ? 'secondary' : ur.role === 'Standard' ? 'warning' : ur.role === 'Cultural' ? 'primary' : ur.role === 'Collection' ? 'secondary' : 'success'} />
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={ur.isActive === false ? 'Inactive' : 'Active'} color={ur.isActive === false ? 'default' : 'success'} variant={ur.isActive === false ? 'outlined' : 'filled'} />
                    </TableCell>
                    <TableCell align="right" sx={{ position: 'sticky', right: 0, zIndex: 1, backgroundColor: 'background.paper', borderLeft: '1px solid rgba(128,128,128,0.2)', whiteSpace: 'nowrap' }}>
                      {ur.role !== 'Super Admin' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <>
                          <IconButton size="small" onClick={() => editUserRole(ur)} color="primary" disabled={ur.email === 'softdev.vivek@gmail.com'} title="Edit User">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => toggleUserStatus(ur.email)} color={ur.isActive === false ? 'success' : 'warning'} disabled={ur.email === 'softdev.vivek@gmail.com'} title={ur.isActive === false ? 'Activate User' : 'Deactivate User'}>
                            {ur.isActive === false ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
                          </IconButton>
                          <IconButton size="small" onClick={() => removeUserRole(ur.email)} color="error" disabled={ur.email === 'softdev.vivek@gmail.com'} title="Remove User">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default UserAccessTab;
