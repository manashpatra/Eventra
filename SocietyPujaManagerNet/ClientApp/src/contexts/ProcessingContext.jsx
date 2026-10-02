import React, { createContext, useContext, useState, useCallback } from 'react';
import { Box, Typography, CircularProgress, Backdrop } from '@mui/material';
import { brand, text, overlay } from '../theme/colorTokens';

const ProcessingContext = createContext({
  isProcessing: false,
  startProcessing: (msg) => {},
  stopProcessing: () => {},
});

export const useProcessing = () => useContext(ProcessingContext);

export const ProcessingProvider = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('Processing...');

  const startProcessing = useCallback((msg = 'Processing...') => {
    setMessage(msg);
    setIsProcessing(true);
  }, []);

  const stopProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  return (
    <ProcessingContext.Provider value={{ isProcessing, startProcessing, stopProcessing }}>
      {children}
      
      <Backdrop
        sx={{
          color: text.white,
          zIndex: (theme) => theme.zIndex.modal + 9999, // Super high z-index to cover everything including dialogs
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(4px)',
          backgroundColor: overlay.processingBackdrop,
        }}
        open={isProcessing}
      >
        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
          <CircularProgress size={64} thickness={4} sx={{ color: brand.orange, position: 'absolute', zIndex: 1 }} />
          <CircularProgress size={64} thickness={4} value={100} variant="determinate" sx={{ color: overlay.brandGlowLight }} />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            letterSpacing: 1,
            animation: 'sleekPulse 1.5s infinite ease-in-out' 
          }}
        >
          {message}
        </Typography>
        <style>{`
          @keyframes sleekPulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
          }
        `}</style>
      </Backdrop>
    </ProcessingContext.Provider>
  );
};
