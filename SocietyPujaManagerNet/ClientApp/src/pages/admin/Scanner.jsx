import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, Grid, Fade, Paper, Divider, CircularProgress, IconButton } from '@mui/material';
import { Html5Qrcode } from 'html5-qrcode';
import { getFoodCouponEntry, updateFoodCoupon } from '../../services/foodCouponService';
import {
  CheckCircle, QrCodeScanner as QrIcon, Restaurant as FoodIcon,
  Replay as ReplayIcon, CameraAlt as CameraIcon, FlipCameraAndroid as FlipIcon,
  FlashOn as FlashOnIcon, FlashOff as FlashOffIcon, CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import {
  brand,
  statusBadge,
  surface,
  gradient as themeGradient,
} from '../../theme/colorTokens';

const Scanner = () => {
  const { user } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameras, setCameras] = useState([]);
  const [facingMode, setFacingMode] = useState('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try { scannerRef.current.stop().catch(() => { }); } catch (e) { }
        try { scannerRef.current.clear(); } catch (e) { }
        scannerRef.current = null;
      }
    };
  }, []);

  const processCoupon = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      let flatDocId = null;
      let couponEntryId = null;

      // New format: ONL-{flatDocId}-{couponId} (length 77)
      if (id.startsWith('ONL-') && id.length >= 77) {
        flatDocId = id.substring(4, 40);
        couponEntryId = id.substring(41, 77); // Extract precisely to avoid trailing garbage
      }
      // Old format fallback: {flatDocId}-{couponId} (length 73)
      else if (id.length >= 73 && id.charAt(36) === '-') {
        flatDocId = id.substring(0, 36);
        couponEntryId = id.substring(37, 73);
      }

      if (flatDocId && couponEntryId) {
        const entry = await getFoodCouponEntry(flatDocId, couponEntryId);
        if (entry && entry.isOnline) {
          setCoupon(entry);
          setLoading(false);
          return;
        }
      }
      setError(`Invalid QR Code. Please scan a valid Online Food Coupon. Debug: id=${id}, f=${flatDocId}, c=${couponEntryId}`);
    } catch (e) {
      setError(`Error fetching coupon data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleServe = useCallback(async (field, max) => {
    if (!coupon) return;
    const current = coupon[field] || 0;
    if (current >= max) return; // Already served max

    const updated = { ...coupon, [field]: current + 1 };

    // Check if everything is fully served
    const isFullyServed =
      ((updated.servedNormalDineOut || 0) >= (updated.normalDineOutCount || 0)) &&
      ((updated.servedNormalParcel || 0) >= (updated.normalParcelCount || 0)) &&
      ((updated.servedAdditionalDineOut || 0) >= (updated.additionalDineOutCount || 0)) &&
      ((updated.servedAdditionalParcel || 0) >= (updated.additionalParcelCount || 0));

    const servedBy = user?.fullName || user?.email || 'Admin';
    updated.lastServedBy = servedBy;
    updated.lastServedAt = new Date().toISOString();

    if (isFullyServed) {
      updated.redeemed = true;
      updated.redeemedAt = updated.lastServedAt;
      updated.redeemedBy = servedBy;
      await updateFoodCoupon(coupon.flatDocId, coupon.id, {
        [field]: current + 1,
        redeemed: true,
        redeemedAt: updated.redeemedAt,
        redeemedBy: updated.redeemedBy,
        lastServedBy: updated.lastServedBy,
        lastServedAt: updated.lastServedAt
      });
    } else {
      await updateFoodCoupon(coupon.flatDocId, coupon.id, {
        [field]: current + 1,
        lastServedBy: updated.lastServedBy,
        lastServedAt: updated.lastServedAt
      });
    }
    setCoupon(updated);
  }, [coupon]);

  const handleScanSuccess = useCallback(async (decodedText) => {
    // Stop camera immediately to prevent re-scans
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch (e) { }
    }
    setCameraReady(false);
    setScanResult(decodedText);
    await processCoupon(decodedText);
  }, [processCoupon]);

  const startCamera = useCallback(async (mode) => {
    setCameraStarting(true);
    setError('');

    try {
      // Stop existing scanner if running
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch (e) { }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('scanner-viewfinder');
      }

      await scannerRef.current.start(
        { facingMode: mode || facingMode },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => { } // ignore misses
      );

      setCameraReady(true);
      setFacingMode(mode || facingMode);

      // Check available cameras to show flip button if > 1
      try {
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);
      } catch (e) { }

      // Check torch support
      try {
        const capabilities = scannerRef.current.getRunningTrackCapabilities?.();
        if (capabilities?.torch) {
          setTorchSupported(true);
        }
      } catch (e) { }
    } catch (e) {
      console.error('Camera start error:', e);
      setError(typeof e === 'string' ? e : 'Could not access camera. Please grant camera permission.');
    } finally {
      setCameraStarting(false);
    }
  }, [facingMode, handleScanSuccess]);

  const handleInit = useCallback(async () => {
    try {
      await startCamera('environment');
    } catch (e) {
      setError('Camera permission denied. Please allow camera access and try again.');
    }
  }, [startCamera]);

  // Auto-start camera if permission is already granted
  useEffect(() => {
    let mounted = true;
    const checkPermissionAndInit = async () => {
      try {
        const result = await navigator.permissions.query({ name: 'camera' });
        if (result.state === 'granted' && mounted) {
          handleInit();
        }
      } catch (e) {
        // Permissions API not supported or error, fallback to manual click
      }
    };
    checkPermissionAndInit();
    return () => { mounted = false; };
  }, [handleInit]);


  const handleFlipCamera = useCallback(async () => {
    if (cameras.length < 2) return;
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    await startCamera(newMode);
  }, [cameras, facingMode, startCamera]);

  const handleToggleTorch = useCallback(async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      await scannerRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (e) { }
  }, [torchOn, torchSupported]);

  const handleFileScan = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Stop camera if running
      if (scannerRef.current && cameraReady) {
        try { await scannerRef.current.stop(); } catch (err) { }
        setCameraReady(false);
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('scanner-viewfinder');
      }

      const result = await scannerRef.current.scanFile(file, true);
      setScanResult(result);
      await processCoupon(result);
    } catch (err) {
      setError('No QR code found in the selected image.');
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [cameraReady]);


  const resetScanner = useCallback(() => {
    setScanResult(null);
    setCoupon(null);
    setError('');
    // Wait for React to re-render the viewfinder div before starting the camera
    setTimeout(() => {
      handleInit();
    }, 100);
  }, [handleInit]);

  const getFoodTypeStyle = (foodType) => {
    switch (foodType) {
      case 'Veg': return { bg: statusBadge.success.bg, color: statusBadge.success.text, border: statusBadge.success.border };
      case 'Khichuri': return { bg: statusBadge.lightGreen.bg, color: statusBadge.lightGreen.text, border: statusBadge.lightGreen.border };
      case 'Lucchi': return { bg: statusBadge.success.bg, color: statusBadge.success.text, border: statusBadge.success.border };
      case 'Chicken': return { bg: statusBadge.warning.bg, color: statusBadge.warning.text, border: statusBadge.warning.border };
      case 'Mutton': return { bg: statusBadge.purple.bg, color: statusBadge.purple.text, border: statusBadge.purple.border };
      default: return { bg: statusBadge.warning.bg, color: brand.orange, border: statusBadge.warning.border };
    }
  };

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', px: { xs: 0, sm: 0 } }}>
      {/* ===== Scanner View ===== */}
      {!scanResult && (
        <Fade in timeout={400}>
          <Box>
            {/* Viewfinder Card */}
            <Card
              sx={{
                mb: 2, overflow: 'hidden',
                borderRadius: '16px',
                border: '1px solid rgba(255,143,0,0.15)',
                background: surface.scannerDark,
              }}
            >
              <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                {/* Viewfinder container */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1',
                    maxHeight: 400,
                    overflow: 'hidden',
                    bgcolor: surface.scannerDark,
                  }}
                >
                  {/* Hidden div for html5-qrcode rendering */}
                  <div
                    id="scanner-viewfinder"
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                    }}
                  />

                  {/* Custom viewfinder overlay */}
                  {cameraReady && (
                    <Box
                      sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none', zIndex: 2,
                      }}
                    >
                      {/* Corner brackets */}
                      <Box
                        sx={{
                          width: 220, height: 220, position: 'relative',
                          '&::before, &::after': {
                            content: '""', position: 'absolute',
                            width: 40, height: 40,
                            borderColor: brand.orange,
                            borderStyle: 'solid',
                          },
                          '&::before': { top: 0, left: 0, borderWidth: '3px 0 0 3px', borderRadius: '8px 0 0 0' },
                          '&::after': { top: 0, right: 0, borderWidth: '3px 3px 0 0', borderRadius: '0 8px 0 0' },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute', bottom: 0, left: 0, width: 40, height: 40,
                            borderLeft: `3px solid ${brand.orange}`, borderBottom: `3px solid ${brand.orange}`,
                            borderRadius: '0 0 0 8px',
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute', bottom: 0, right: 0, width: 40, height: 40,
                            borderRight: `3px solid ${brand.orange}`, borderBottom: `3px solid ${brand.orange}`,
                            borderRadius: '0 0 8px 0',
                          }}
                        />
                        {/* Scan line animation */}
                        <Box
                          sx={{
                            position: 'absolute', left: 8, right: 8,
                            height: '2px',
                            background: `linear-gradient(90deg, transparent, ${brand.orange}, transparent)`,
                            animation: 'scanLine 2s ease-in-out infinite',
                            '@keyframes scanLine': {
                              '0%, 100%': { top: 8 },
                              '50%': { top: 'calc(100% - 10px)' },
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  )}

                  {/* Camera starting state */}
                  {cameraStarting && (
                    <Box
                      sx={{
                        position: 'absolute', inset: 0, zIndex: 3,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                      }}
                    >
                      <CircularProgress size={36} sx={{ color: brand.orange, mb: 1.5 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 500 }}>
                        Starting camera…
                      </Typography>
                    </Box>
                  )}

                  {/* Initial state — no camera started yet */}
                  {!cameraReady && !cameraStarting && !error && (
                    <Box
                      sx={{
                        position: 'absolute', inset: 0, zIndex: 3,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'radial-gradient(circle at center, rgba(255,143,0,0.06) 0%, transparent 70%)',
                      }}
                    >
                      <Box
                        sx={{
                          width: 72, height: 72, borderRadius: '20px', mb: 2,
                          background: 'linear-gradient(135deg, rgba(255,143,0,0.15) 0%, rgba(230,81,0,0.1) 100%)',
                          border: '1px solid rgba(255,143,0,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <QrIcon sx={{ fontSize: 36, color: brand.orange }} />
                      </Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 3, color: 'text.primary' }}>
                        Scan Food Coupon
                      </Typography>

                      <Button
                        size="medium"
                        variant="contained"
                        startIcon={<CameraIcon sx={{ fontSize: '18px !important' }} />}
                        onClick={handleInit}
                        sx={{
                          background: themeGradient.brand,
                          borderRadius: '12px', textTransform: 'none',
                          fontWeight: 700, fontSize: '0.9rem',
                          px: 4, py: 1.2,
                          width: '100%',
                          maxWidth: 240,
                          boxShadow: '0 4px 20px rgba(255,143,0,0.35)',
                          '&:hover': {
                            background: themeGradient.brandDark,
                            boxShadow: '0 6px 24px rgba(255,143,0,0.45)',
                          },
                        }}
                      >
                        Open Camera
                      </Button>
                      <Button
                        size="medium"
                        startIcon={<CloudUploadIcon sx={{ fontSize: '18px !important' }} />}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          mt: 2.5, textTransform: 'none', fontWeight: 700,
                          fontSize: '0.9rem', color: brand.orange,
                          border: '2px dashed rgba(255,143,0,0.5)',
                          borderRadius: '12px',
                          px: 4, py: 1.2,
                          width: '100%',
                          maxWidth: 240,
                          '&:hover': {
                            bgcolor: 'rgba(255,143,0,0.08)',
                            borderColor: brand.orange,
                          },
                        }}
                      >
                        Gallery
                      </Button>
                    </Box>
                  )}

                  {/* Error overlay */}
                  {error && !scanResult && (
                    <Box
                      sx={{
                        position: 'absolute', inset: 0, zIndex: 3,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                        px: 3,
                      }}
                    >
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📷</Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: statusBadge.error.text, mb: 0.5, textAlign: 'center' }}>
                        Camera Error
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', textAlign: 'center', mb: 2.5 }}>
                        {error}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<CameraIcon />}
                        onClick={handleInit}
                        sx={{
                          background: themeGradient.brand,
                          borderRadius: '12px', textTransform: 'none',
                          fontWeight: 700, px: 3, py: 1,
                          boxShadow: '0 4px 16px rgba(255,143,0,0.3)',
                        }}
                      >
                        Try Again
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Camera controls bar */}
                {cameraReady && (
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 1.5, py: 1.5, px: 2,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Flip camera */}
                    {cameras.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={handleFlipCamera}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.1)', color: 'common.white',
                          width: 40, height: 40,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        <FlipIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* Torch */}
                    {torchSupported && (
                      <IconButton
                        size="small"
                        onClick={handleToggleTorch}
                        sx={{
                          bgcolor: torchOn ? 'rgba(255,193,7,0.25)' : 'rgba(255,255,255,0.1)',
                          color: torchOn ? brand.gold : 'common.white',
                          width: 40, height: 40,
                          '&:hover': { bgcolor: torchOn ? 'rgba(255,193,7,0.35)' : 'rgba(255,255,255,0.2)' },
                        }}
                      >
                        {torchOn ? <FlashOnIcon fontSize="small" /> : <FlashOffIcon fontSize="small" />}
                      </IconButton>
                    )}

                    {/* File scan */}
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)', color: 'common.white',
                        width: 40, height: 40,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                      }}
                    >
                      <CloudUploadIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileScan}
            />
          </Box>
        </Fade>
      )}

      {/* ===== Loading State ===== */}
      {loading && (
        <Fade in timeout={300}>
          <Card
            sx={{
              textAlign: 'center', borderRadius: '16px', py: 5,
              border: '1px solid rgba(255,143,0,0.15)',
              background: 'linear-gradient(135deg, rgba(255,143,0,0.04) 0%, rgba(230,81,0,0.02) 100%)',
            }}
          >
            <CircularProgress sx={{ color: brand.orange, mb: 2 }} size={40} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Verifying coupon…
            </Typography>
          </Card>
        </Fade>
      )}

      {/* ===== Error State (post-scan) ===== */}
      {error && scanResult && (
        <Fade in timeout={300}>
          <Card
            sx={{
              borderRadius: '16px',
              border: '1px solid rgba(239,83,80,0.3)',
              background: 'linear-gradient(135deg, rgba(239,83,80,0.08) 0%, rgba(239,83,80,0.03) 100%)',
            }}
          >
            <CardContent sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ mb: 1 }}>❌</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: statusBadge.error.text, mb: 0.5 }}>
                Invalid Coupon
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                {error}
              </Typography>
              <Button
                variant="contained"
                startIcon={<ReplayIcon />}
                onClick={resetScanner}
                sx={{
                  background: themeGradient.brand,
                  borderRadius: '12px', textTransform: 'none',
                  fontWeight: 600, px: 4,
                  boxShadow: '0 4px 16px rgba(255,143,0,0.3)',
                }}
              >
                Scan Again
              </Button>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* ===== Valid Coupon Result ===== */}
      {coupon && (
        <Fade in timeout={500}>
          <Card
            sx={{
              borderRadius: '16px', overflow: 'visible',
              border: `1.5px solid ${coupon.redeemed ? 'rgba(102,187,106,0.35)' : 'rgba(255,143,0,0.25)'}`,
              background: coupon.redeemed
                ? 'linear-gradient(135deg, rgba(102,187,106,0.06) 0%, rgba(102,187,106,0.02) 100%)'
                : 'linear-gradient(135deg, rgba(255,143,0,0.04) 0%, rgba(255,143,0,0.01) 100%)',
              transition: 'all 0.3s ease',
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Success Header */}
              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  p: 2,
                  background: coupon.redeemed
                    ? 'linear-gradient(135deg, rgba(102,187,106,0.15) 0%, rgba(102,187,106,0.06) 100%)'
                    : 'linear-gradient(135deg, rgba(255,143,0,0.12) 0%, rgba(255,143,0,0.04) 100%)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px 16px 0 0',
                }}
              >
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: '12px',
                    background: coupon.redeemed
                      ? themeGradient.success
                      : themeGradient.brand,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: coupon.redeemed
                      ? '0 4px 12px rgba(102,187,106,0.35)'
                      : '0 4px 12px rgba(255,143,0,0.35)',
                  }}
                >
                  {coupon.redeemed ? <CheckCircle sx={{ color: 'common.white', fontSize: 24 }} /> : <FoodIcon sx={{ color: 'common.white', fontSize: 24 }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: coupon.redeemed ? statusBadge.success.text : brand.gold, lineHeight: 1.2 }}>
                    {coupon.redeemed ? '✓ Fully Served' : 'Valid Coupon'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {coupon.redeemed ? 'All items have been served' : 'Verified — ready to serve'}
                  </Typography>
                </Box>
                <Chip
                  label={coupon.foodType}
                  size="small"
                  sx={{
                    fontWeight: 700, fontSize: '0.78rem',
                    bgcolor: getFoodTypeStyle(coupon.foodType).bg,
                    color: getFoodTypeStyle(coupon.foodType).color,
                    border: `1px solid ${getFoodTypeStyle(coupon.foodType).border}`,
                  }}
                />
              </Box>

              {/* Coupon Info */}
              <Box sx={{ p: 2 }}>
                <Grid container spacing={1.5}>
                  <Grid size={12}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5, borderRadius: '12px',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem' }}>
                        Resident
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                        {coupon.residentName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.82rem' }}>
                        Flat {coupon.flatNumber}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5, borderRadius: '12px', textAlign: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem' }}>
                        Day
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {coupon.day}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={6}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5, borderRadius: '12px', textAlign: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.62rem' }}>
                        Meal
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {coupon.mealType}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Online Coupon Serving Status */}
              <Box sx={{ px: 2, pb: 2 }}>
                <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.06)' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', mb: 1.5, display: 'block', fontSize: '0.68rem' }}>
                  Serving Status
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {(coupon.normalDineOutCount > 0) && (
                    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: (coupon.servedNormalDineOut || 0) >= coupon.normalDineOutCount ? 'rgba(102,187,106,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(coupon.servedNormalDineOut || 0) >= coupon.normalDineOutCount ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{coupon.foodType} Dine-out</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Served: {coupon.servedNormalDineOut || 0} / {coupon.normalDineOutCount}</Typography>
                      </Box>
                      <Button variant="contained" size="small" disabled={(coupon.servedNormalDineOut || 0) >= coupon.normalDineOutCount} onClick={() => handleServe('servedNormalDineOut', coupon.normalDineOutCount)} sx={{
                        minWidth: 90,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        '&:not(.Mui-disabled)': {
                          background: themeGradient.brand,
                          boxShadow: '0 4px 12px rgba(255,143,0,0.3)',
                          color: 'common.white',
                        },
                        '&:not(.Mui-disabled):hover': {
                          background: themeGradient.brandDark,
                          boxShadow: '0 6px 16px rgba(255,143,0,0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          background: 'rgba(102,187,106,0.12)',
                          color: statusBadge.lightGreen.text,
                          border: '1px solid rgba(102,187,106,0.2)',
                        }
                      }}>
                        {(coupon.servedNormalDineOut || 0) >= coupon.normalDineOutCount ? '✓ Served' : 'Serve +1'}
                      </Button>
                    </Paper>
                  )}

                  {(coupon.normalParcelCount > 0) && (
                    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: (coupon.servedNormalParcel || 0) >= coupon.normalParcelCount ? 'rgba(102,187,106,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(coupon.servedNormalParcel || 0) >= coupon.normalParcelCount ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{coupon.foodType} Parcel</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Served: {coupon.servedNormalParcel || 0} / {coupon.normalParcelCount}</Typography>
                      </Box>
                      <Button variant="contained" size="small" disabled={(coupon.servedNormalParcel || 0) >= coupon.normalParcelCount} onClick={() => handleServe('servedNormalParcel', coupon.normalParcelCount)} sx={{
                        minWidth: 90,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        '&:not(.Mui-disabled)': {
                          background: themeGradient.brand,
                          boxShadow: '0 4px 12px rgba(255,143,0,0.3)',
                          color: 'common.white',
                        },
                        '&:not(.Mui-disabled):hover': {
                          background: themeGradient.brandDark,
                          boxShadow: '0 6px 16px rgba(255,143,0,0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          background: 'rgba(102,187,106,0.12)',
                          color: statusBadge.lightGreen.text,
                          border: '1px solid rgba(102,187,106,0.2)',
                        }
                      }}>
                        {(coupon.servedNormalParcel || 0) >= coupon.normalParcelCount ? '✓ Served' : 'Serve +1'}
                      </Button>
                    </Paper>
                  )}

                  {(coupon.additionalDineOutCount > 0) && (
                    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: (coupon.servedAdditionalDineOut || 0) >= coupon.additionalDineOutCount ? 'rgba(102,187,106,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(coupon.servedAdditionalDineOut || 0) >= coupon.additionalDineOutCount ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Extra {coupon.foodType} Dine-out</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Served: {coupon.servedAdditionalDineOut || 0} / {coupon.additionalDineOutCount}</Typography>
                      </Box>
                      <Button variant="contained" size="small" disabled={(coupon.servedAdditionalDineOut || 0) >= coupon.additionalDineOutCount} onClick={() => handleServe('servedAdditionalDineOut', coupon.additionalDineOutCount)} sx={{
                        minWidth: 90,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        '&:not(.Mui-disabled)': {
                          background: themeGradient.brand,
                          boxShadow: '0 4px 12px rgba(255,143,0,0.3)',
                          color: 'common.white',
                        },
                        '&:not(.Mui-disabled):hover': {
                          background: themeGradient.brandDark,
                          boxShadow: '0 6px 16px rgba(255,143,0,0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          background: 'rgba(102,187,106,0.12)',
                          color: statusBadge.lightGreen.text,
                          border: '1px solid rgba(102,187,106,0.2)',
                        }
                      }}>
                        {(coupon.servedAdditionalDineOut || 0) >= coupon.additionalDineOutCount ? '✓ Served' : 'Serve +1'}
                      </Button>
                    </Paper>
                  )}

                  {(coupon.additionalParcelCount > 0) && (
                    <Paper sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: (coupon.servedAdditionalParcel || 0) >= coupon.additionalParcelCount ? 'rgba(102,187,106,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(coupon.servedAdditionalParcel || 0) >= coupon.additionalParcelCount ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Extra {coupon.foodType} Parcel</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Served: {coupon.servedAdditionalParcel || 0} / {coupon.additionalParcelCount}</Typography>
                      </Box>
                      <Button variant="contained" size="small" disabled={(coupon.servedAdditionalParcel || 0) >= coupon.additionalParcelCount} onClick={() => handleServe('servedAdditionalParcel', coupon.additionalParcelCount)} sx={{
                        minWidth: 90,
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        '&:not(.Mui-disabled)': {
                          background: themeGradient.brand,
                          boxShadow: '0 4px 12px rgba(255,143,0,0.3)',
                          color: 'common.white',
                        },
                        '&:not(.Mui-disabled):hover': {
                          background: themeGradient.brandDark,
                          boxShadow: '0 6px 16px rgba(255,143,0,0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&.Mui-disabled': {
                          background: 'rgba(102,187,106,0.12)',
                          color: statusBadge.lightGreen.text,
                          border: '1px solid rgba(102,187,106,0.2)',
                        }
                      }}>
                        {(coupon.servedAdditionalParcel || 0) >= coupon.additionalParcelCount ? '✓ Served' : 'Serve +1'}
                      </Button>
                    </Paper>
                  )}

                  {/* Complete Redeem All Button (only if not fully served) */}
                  {!coupon.redeemed && (() => {
                    const remainingNormalDineOut = (coupon.normalDineOutCount || 0) - (coupon.servedNormalDineOut || 0);
                    const remainingNormalParcel = (coupon.normalParcelCount || 0) - (coupon.servedNormalParcel || 0);
                    const remainingAdditionalDineOut = (coupon.additionalDineOutCount || 0) - (coupon.servedAdditionalDineOut || 0);
                    const remainingAdditionalParcel = (coupon.additionalParcelCount || 0) - (coupon.servedAdditionalParcel || 0);
                    const totalRemaining = Math.max(0, remainingNormalDineOut) + Math.max(0, remainingNormalParcel) + Math.max(0, remainingAdditionalDineOut) + Math.max(0, remainingAdditionalParcel);

                    return totalRemaining > 0 ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={async () => {
                          const updateData = {
                            redeemed: true,
                            redeemedAt: new Date().toISOString(),
                            redeemedBy: user?.fullName || user?.email || 'Admin',
                            servedNormalDineOut: coupon.normalDineOutCount || 0,
                            servedNormalParcel: coupon.normalParcelCount || 0,
                            servedAdditionalDineOut: coupon.additionalDineOutCount || 0,
                            servedAdditionalParcel: coupon.additionalParcelCount || 0
                          };
                          await updateFoodCoupon(coupon.flatDocId, coupon.id, updateData);
                          setCoupon({
                            ...coupon,
                            ...updateData
                          });
                        }}
                        sx={{
                          mt: 1.5,
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 800,
                          fontSize: '1rem',
                          py: 1.2,
                          background: themeGradient.purpleVibrant,
                          color: 'common.white',
                          boxShadow: '0 4px 16px rgba(124,77,255,0.4)',
                          border: 'none',
                          transition: 'all 0.2s',
                          '&:hover': {
                            background: themeGradient.purpleVibrantHover,
                            boxShadow: '0 6px 20px rgba(124,77,255,0.5)',
                            transform: 'translateY(-2px)',
                          }
                        }}
                      >
                        Serve All ({totalRemaining})
                      </Button>
                    ) : null;
                  })()}
                </Box>
              </Box>


              {/* Scan Next */}
              <Box sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ReplayIcon />}
                  onClick={resetScanner}
                  sx={{
                    borderRadius: '12px', textTransform: 'none',
                    fontWeight: 700, fontSize: '0.88rem',
                    borderColor: 'rgba(255,255,255,0.12)',
                    color: 'text.primary',
                    py: 1.3,
                    '&:hover': {
                      borderColor: brand.orange, bgcolor: 'rgba(255,143,0,0.06)',
                    },
                  }}
                >
                  Scan Next Coupon
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
};

export default Scanner;
