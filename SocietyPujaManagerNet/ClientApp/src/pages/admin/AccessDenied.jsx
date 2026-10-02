import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutlined as ErrorIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: '16px' }}>
        <ErrorIcon color="error" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Please contact the administrator for access.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/login')}
          sx={{ borderRadius: '8px', px: 4 }}
        >
          Back to Login
        </Button>
      </Paper>
    </Container>
  );
};

export default AccessDenied;
