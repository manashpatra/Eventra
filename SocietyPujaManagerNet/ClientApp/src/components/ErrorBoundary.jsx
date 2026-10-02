import React from 'react';
import { Box, Card, CardContent, Typography, Button } from '@mui/material';
import { Refresh as RefreshIcon, Home as HomeIcon } from '@mui/icons-material';
import { errorRed, brand, text, overlay } from '../theme/colorTokens';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.hash = '#/home';
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3,
            width: '100%',
          }}
        >
          <Card
            sx={{
              maxWidth: 480,
              width: '100%',
              textAlign: 'center',
              p: 3,
              borderRadius: '20px',
              border: `1px solid ${overlay.errorBorderStrong}`,
              background: `linear-gradient(135deg, ${overlay.errorLight} 0%, rgba(17, 24, 39, 0.95) 100%)`,
              boxShadow: `0 8px 32px ${overlay.shadowDark}`,
            }}
          >
            <CardContent sx={{ p: 0 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  bgcolor: overlay.errorStrong,
                  color: errorRed,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                ⚠️
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: text.white, mb: 1 }}>
                Something went wrong
              </Typography>
              <Typography variant="body2" sx={{ color: text.secondaryDark, mb: 3, lineHeight: 1.6 }}>
                An unexpected display error occurred. You can refresh this view or return to the main home page.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    color: text.primaryDark,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Reload Page
                </Button>
                <Button
                  variant="contained"
                  startIcon={<HomeIcon />}
                  onClick={this.handleReset}
                  sx={{
                    bgcolor: brand.orange,
                    '&:hover': { bgcolor: brand.orangeDark },
                    color: text.white,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Return to Home
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
