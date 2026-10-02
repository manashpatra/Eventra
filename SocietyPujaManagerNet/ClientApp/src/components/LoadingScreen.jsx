import React from 'react';
import { Box, Typography, CircularProgress, keyframes } from '@mui/material';
import { brand, surface, overlay, gradient, text } from '../theme/colorTokens';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

const LoadingScreen = ({ message = 'Initializing...' }) => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: surface.loadingBg,
        color: text.white,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '24px',
          background: gradient.brand,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          animation: `${pulse} 2s infinite ease-in-out`,
          boxShadow: `0 10px 40px ${overlay.brandGlow}`,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800 }}>🙏</Typography>
      </Box>
      <CircularProgress size={32} thickness={4} sx={{ color: brand.orange, mb: 2 }} />
      <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
