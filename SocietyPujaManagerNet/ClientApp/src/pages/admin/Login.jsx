import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Fade,
  useTheme,
} from '@mui/material';
import ThemeToggle from '../../components/ThemeToggle';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { isConfigured } from '../../services/firebase';
import { getMasterConfig } from '../../services/masterConfigService';
import { brand, surface, text, gradient, status } from '../../theme/colorTokens';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { login } = useAuth();
  const [appConfig, setAppConfig] = useState(null);

  React.useEffect(() => {
    getMasterConfig().then(setAppConfig).catch(() => { });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials.';
      const errString = err.message || '';
      const errCode = err.code || '';

      if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password' || errString.includes('auth/invalid-credential') || errString.includes('auth/wrong-password') || errString.includes('auth/user-not-found')) {
        errorMessage = 'Invalid email address or password.';
      } else if (errCode === 'auth/too-many-requests' || errString.includes('auth/too-many-requests')) {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (errString) {
        // Fallback to error message if it's not a standard firebase one, or clean it up
        errorMessage = errString.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || errorMessage;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        background: isDark
          ? `
            radial-gradient(ellipse at 20% 50%, rgba(255,143,0,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(206,147,216,0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(230,81,0,0.08) 0%, transparent 50%),
            linear-gradient(180deg, ${surface.bgDark} 0%, ${surface.paperDark} 100%)
          `
          : `
            radial-gradient(ellipse at 20% 50%, rgba(255,143,0,0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(206,147,216,0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(230,81,0,0.06) 0%, transparent 50%),
            linear-gradient(180deg, ${surface.bgLight} 0%, ${surface.warmCream} 100%)
          `,
        p: 2,
      }}
    >
      {/* Top right theme toggle */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </Box>
      {/* Floating decorative elements */}
      <Box
        sx={{
          position: 'fixed',
          top: '10%',
          left: '5%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,143,0,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '50%': { transform: 'translate(30px, -30px) scale(1.1)' },
          },
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: '10%',
          right: '10%',
          width: 250,
          height: 250,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(206,147,216,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 10s ease-in-out infinite reverse',
        }}
      />

      <Fade in={true} timeout={800}>
        <Card
          sx={{
            width: '100%',
            maxWidth: 440,
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            background: isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            boxShadow: isDark ? 'none' : '0 10px 40px rgba(0,0,0,0.08)',
            overflow: 'visible',
            position: 'relative',
            '&:hover': {
              transform: 'none',
              boxShadow: isDark ? '0 20px 60px rgba(255,143,0,0.12)' : '0 20px 60px rgba(255,143,0,0.18)',
            },
          }}
        >
          {/* Top Accent */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '60%',
              height: 3,
              background: gradient.accentLine,
              borderRadius: '0 0 4px 4px',
            }}
          />

          <CardContent sx={{ p: 5 }}>
            {/* Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '20px',
                  background: text.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2.5,
                  boxShadow: '0 8px 32px rgba(255,143,0,0.3)',
                  animation: 'glow 3s ease-in-out infinite',
                  '@keyframes glow': {
                    '0%, 100%': { boxShadow: '0 8px 32px rgba(255,143,0,0.3)' },
                    '50%': { boxShadow: '0 8px 48px rgba(255,143,0,0.5)' },
                  },
                }}
              >
                <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: gradient.brandTextFull,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 0.5,
                }}
              >
                {appConfig?.societyName?.toUpperCase() || 'HOME'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {appConfig?.committeeName || ''} {appConfig?.year || ''} Manager
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Fade in={true}>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    backgroundColor: 'rgba(239,83,80,0.08)',
                    border: '1px solid rgba(239,83,80,0.2)',
                  }}
                  onClose={() => setError('')}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@society.com"
                sx={{ mb: 2.5 }}
                autoComplete="email"
                autoFocus
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                sx={{ mb: 3.5 }}
                autoComplete="current-password"
                slotProps={{ input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ mt: 2.5, textAlign: 'center' }}>
              <Button
                variant="text"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/home')}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  '&:hover': { color: brand.orange }
                }}
              >
                Go to Public Home Page
              </Button>
            </Box>

            {/* Hint */}
            {!isConfigured && (
              <Box
                sx={{
                  mt: 3,
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,143,0,0.06)',
                  border: '1px solid rgba(255,143,0,0.1)',
                }}
              >
                <Typography variant="caption" sx={{ color: (theme) => status.error.main(theme.palette.mode === 'dark'), display: 'block' }}>
                  ⚠️ Configure Firebase in <code>.env</code> for multi-device sync. Running locally.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

export default Login;
