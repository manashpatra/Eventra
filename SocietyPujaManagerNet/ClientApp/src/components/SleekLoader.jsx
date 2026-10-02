import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { brand, overlay } from '../theme/colorTokens';

const SleekLoader = ({ message = 'Loading...', minHeight = '200px' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: minHeight,
        p: 3,
        gap: 2,
      }}
    >
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress size={48} thickness={4} sx={{ color: brand.orange, position: 'absolute', zIndex: 1 }} />
        <CircularProgress size={48} thickness={4} value={100} variant="determinate" sx={{ color: 'rgba(255,143,0,0.1)' }} />
      </Box>
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'text.secondary', 
          fontWeight: 600, 
          letterSpacing: 0.5, 
          animation: 'sleekPulse 1.5s infinite ease-in-out' 
        }}
      >
        {message}
      </Typography>
      <style>{`
        @keyframes sleekPulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </Box>
  );
};

export default SleekLoader;
