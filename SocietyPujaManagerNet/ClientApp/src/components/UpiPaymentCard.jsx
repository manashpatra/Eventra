import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Fade,
  useMediaQuery,
  useTheme,
  Tooltip,
  Snackbar,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  VolunteerActivism as DonationIcon,
  CurrencyRupee as RupeeIcon,
  Download as DownloadIcon,
  WhatsApp as WhatsAppIcon,
  AccountBalance as BankIcon,
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import { buildUpiUrl, isMobileDevice, UPI_APPS, getIntentUrl } from '../utils/upiHelper';
import { isIOSDevice } from '../utils/deviceUtils';
import { brand, text, surface, overlay, gradient, border, shadow, thirdParty, getUpiAccent } from '../theme/colorTokens';

/**
 * UpiPaymentCard
 *
 * Renders a UPI payment interface:
 *  - Mobile → "Pay via UPI" button that opens the default UPI app
 *  - Desktop → QR code for scanning
 *
 * @param {Object}  props
 * @param {string}  props.flatNumber  – Display flat number, e.g. "10/4B"
 * @param {number}  [props.amount]    – Pre-filled amount (omit for user-entered)
 * @param {'subscription'|'donation'} props.mode
 * @param {string}  [props.pa]        – UPI payee address (from master config)
 * @param {string}  [props.pn]        – UPI payee name (from master config)
 */
const UpiPaymentCard = ({ flatNumber, amount: fixedAmount, mode = 'subscription', pa, pn, tn, mc, societyName = '', committeeName = '', year = '', isTestPage = false, bankName = '', bankAccountNumber = '', bankIfscCode = '', chequeFavourName = '', enabledUpiApps, showIntentButtons = true, showImportantNotice = true, whatsappGroupLink }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobileBreakpoint = useMediaQuery(theme.breakpoints.down('sm'));
  const mobile = isMobileDevice() || isMobileBreakpoint;

  // For donation mode the amount is user-entered
  const [donationAmount, setDonationAmount] = useState('');

  const effectiveAmount = mode === 'donation' ? donationAmount : fixedAmount;
  const amountNum = Number(effectiveAmount) || 0;

  const upiUrl = useMemo(
    () => buildUpiUrl({ amount: effectiveAmount, flatNumber, mode, pa, pn, tn, mc }),
    [effectiveAmount, flatNumber, mode, pa, pn, tn, mc],
  );

  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  const copyToClipboard = async (textToCopy) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        return true;
      }
    } catch (err) {
      console.warn('navigator.clipboard failed, attempting fallback...', err);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      console.error('Fallback copy failed:', err);
      return false;
    }
  };

  const getFormattedBankDetailsText = () => {
    const title = `${societyName || committeeName || 'Puja'} - Bank & Payment Details`;
    const accName = chequeFavourName || pn || committeeName || societyName || '';
    const lines = [
      `🏛️ *${title}*`,
      year ? `📅 Year: ${year}` : null,
      '──────────────────────',
      '🏦 *Net Banking Details:*',
      bankName ? `• Bank Name: ${bankName}` : null,
      accName ? `• Account Name: ${accName}` : null,
      bankAccountNumber ? `• A/C Number: ${bankAccountNumber}` : null,
      bankIfscCode ? `• IFSC Code: ${bankIfscCode}` : null,
      pa ? '' : null,
      pa ? '📱 *Direct UPI Details:*' : null,
      pa ? `• UPI ID: ${pa}` : null,
      pn ? `• UPI Payee: ${pn}` : null,
      '──────────────────────',
      'Mode of Payment: Net Banking (NEFT/RTGS/IMPS) / Direct UPI',
    ].filter(line => line !== null);

    return lines.join('\n');
  };

  const handleCopyDetails = async (textToCopy, label, fieldKey) => {
    if (!textToCopy || textToCopy === 'N/A') return;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedField(fieldKey);
      setSnackbarMessage(`${label} copied to clipboard!`);
      setSnackbarOpen(true);
      setTimeout(() => setCopiedField(curr => (curr === fieldKey ? null : curr)), 2000);
    }
  };

  const handleCopyAllBankDetails = async () => {
    const textToCopy = getFormattedBankDetailsText();
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopiedField('all');
      setSnackbarMessage('All bank & payment details copied to clipboard!');
      setSnackbarOpen(true);
      setTimeout(() => setCopiedField(curr => (curr === 'all' ? null : curr)), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const textToShare = getFormattedBankDetailsText();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(textToShare)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareBankDetails = async () => {
    const textToShare = getFormattedBankDetailsText();
    const title = `${societyName || committeeName || 'Puja'} Bank Details`;

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: textToShare,
        });
        setSnackbarMessage('Bank details shared successfully!');
        setSnackbarOpen(true);
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.warn('Web Share failed, falling back to WhatsApp:', err);
      }
    }

    handleWhatsAppShare();
  };

  useEffect(() => {
    if (upiUrl) {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, upiUrl, {
        margin: 3,
        width: 256,
        errorCorrectionLevel: 'H'
      })
        .then(() => {
          const ctx = canvas.getContext('2d');
          const logoImg = new Image();

          logoImg.onload = () => {
            const logoSize = 44; // size of the logo in pixels (~17% of canvas width)
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;

            // Draw white circle background mask (creates a clean 4px outer border ring for proper margin and QR validity)
            ctx.fillStyle = text.white;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, (logoSize / 2) + 4, 0, 2 * Math.PI);
            ctx.fill();

            // Save canvas context to apply circular clip
            ctx.save();

            // Create a circular clipping path
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
            ctx.clip();

            // Use full image since the new durga_icon.png is already pre-cropped
            const sx = 0;
            const sy = 0;
            const sWidth = logoImg.width;
            const sHeight = logoImg.height;

            // Draw Durga logo to canvas (clipped to a perfect circle)
            ctx.drawImage(logoImg, sx, sy, sWidth, sHeight, x, y, logoSize, logoSize);

            // Restore canvas context to remove clipping mask for future operations
            ctx.restore();

            // Flatten the canvas onto a solid white background to eliminate any
            // transparent pixels (which render as black in dark-themed photo galleries)
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const finalCtx = finalCanvas.getContext('2d');
            finalCtx.fillStyle = text.white;
            finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
            finalCtx.drawImage(canvas, 0, 0);

            // Get final merged data URL from the flattened canvas
            setQrImageUrl(finalCanvas.toDataURL('image/png'));
          };
          logoImg.onerror = (err) => {
            console.error('Failed to load Durga icon logo:', err);
            // Fallback to standard QR without logo
            setQrImageUrl(canvas.toDataURL('image/png'));
          };
          logoImg.src = '/durga_icon.png';
        })
        .catch(err => {
          console.error('Failed to generate QR canvas:', err);
        });
    } else {
      setQrImageUrl('');
    }
  }, [upiUrl]);

  const handleCopyVpa = () => {
    if (!pa) return;
    navigator.clipboard.writeText(pa).then(() => {
      setCopied(true);
      setSnackbarMessage('UPI ID copied to clipboard!');
      setSnackbarOpen(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy VPA: ', err);
    });
  };

  const handleDownloadQR = async () => {
    if (!upiUrl || !qrImageUrl) return;

    const isIOS = isIOSDevice();

    // Use Web Share API on iOS devices where standard download fails but share sheet supports "Save Image"
    if (isIOS && navigator.share && navigator.canShare) {
      try {
        const res = await fetch(qrImageUrl);
        const blob = await res.blob();
        const formattedFlat = flatNumber ? flatNumber.replace(/[^a-zA-Z0-9]/g, '_') : 'flat';
        const file = new File([blob], `puja_payment_${mode}_${formattedFlat}.png`, { type: 'image/png' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${societyName || 'Society'} Puja QR Code`,
            text: `UPI QR Code for ${flatNumber ? `Flat ${flatNumber}` : 'Contribution'}`,
          });
          return; // Share sheet successfully triggered, avoid running standard download
        }
      } catch (err) {
        console.error('Web Share API error, falling back to download:', err);
      }
    }

    // Fallback: standard anchor tag download
    try {
      const link = document.createElement('a');
      const formattedFlat = flatNumber ? flatNumber.replace(/[^a-zA-Z0-9]/g, '_') : 'flat';
      link.download = `puja_payment_${mode}_${formattedFlat}.png`;
      link.href = qrImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // if (amountNum > 2000) {
      //   setSnackbarMessage('QR downloaded! Note: UPI apps limit gallery QR uploads to ₹2,000. Please scan from another screen or copy the UPI ID.');
      // } else {
      //   setSnackbarMessage('QR Code downloaded successfully!');
      // }
      //setSnackbarOpen(true);
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  const handleAppClick = (e, app) => {
    if (app.requiresQrFallback) {
      e.preventDefault();

      if (!qrImageUrl) {
        setSnackbarMessage('Generating QR code, please wait...');
        setSnackbarOpen(true);
        return;
      }

      try {
        const link = document.createElement('a');
        const formattedFlat = flatNumber ? flatNumber.replace(/[^a-zA-Z0-9]/g, '_') : 'flat';
        link.download = `puja_payment_${mode}_${formattedFlat}.png`;
        link.href = qrImageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSnackbarMessage(`QR Saved! Open ${app.name}, tap 'Scan Any QR' -> 'Upload from Gallery'`);
        setSnackbarOpen(true);

        // Launch app home screen after short delay
        setTimeout(() => {
          window.location.href = `intent://#Intent;package=${app.androidPackage};end`;
        }, 800);
      } catch (err) {
        console.error('Error in QR fallback:', err);
      }
    }
  };

  const isDonation = mode === 'donation';
  const isEvent = mode === 'event';
  const { accent: accentColor, gradientStart, gradientEnd } = getUpiAccent(isDonation, isEvent);

  return (
    <>
      <Fade in timeout={500}>
        <Box
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: '16px',
            background: `linear-gradient(135deg, ${accentColor}08 0%, ${accentColor}04 100%)`,
            border: `1px solid ${accentColor}25`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`,
            },
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            {isDonation ? (
              <DonationIcon sx={{ color: accentColor, fontSize: 20 }} />
            ) : (
              <PaymentIcon sx={{ color: accentColor, fontSize: 20 }} />
            )}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem' }}>
              {isDonation ? 'Donation via UPI' : isEvent ? 'Event Payment' : 'Subscription Payment'}
            </Typography>
          </Box>

          {/* Support Request Message */}
          {!isDonation && !isEvent && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                mb: 1,
                lineHeight: 1.3,
              }}
            >
              Please contribute to make <strong>Durga Puja {year || ''}</strong> a grand success.
            </Typography>
          )}

          {/* Donation amount input */}
          {isDonation && (
            <TextField
              label="Donation Amount"
              type="number"
              size="small"
              fullWidth
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="Enter amount"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <RupeeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
          )}

          {/* Subscription fixed amount display */}
          {!isDonation && fixedAmount && (
            <Box sx={{ mb: 0.5, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0 }}>
                Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: accentColor }}>
                ₹{Number(fixedAmount).toLocaleString('en-IN')}
              </Typography>
            </Box>
          )}

          {/* Dynamic QR Code Section */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
            {/* Active QR Code */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title="Click to download/share QR code" arrow>
                <Box
                  onClick={handleDownloadQR}
                  sx={{
                    p: 0.5,
                    borderRadius: '10px',
                    backgroundColor: text.white,
                    display: 'inline-flex',
                    cursor: 'pointer',
                    position: 'relative',
                    boxShadow: `0 4px 24px ${accentColor}20`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '2px solid transparent',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      borderColor: accentColor,
                      boxShadow: `0 8px 32px ${accentColor}35`,
                      '& .qr-overlay': {
                        opacity: 1,
                      }
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    }
                  }}
                >
                  {qrImageUrl ? (
                    <Box
                      component="img"
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      sx={{
                        width: 160,
                        height: 160,
                        display: 'block',
                        borderRadius: '8px',
                      }}
                    />
                  ) : (
                    <Box sx={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Generating QR...</Typography>
                    </Box>
                  )}
                  {/* Subtle download icon positioned just above Maa Durga's face */}
                  <Box
                    className="qr-overlay"
                    sx={{
                      position: 'absolute',
                      top: 30,
                      left: 0,
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.2s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    <DownloadIcon
                      sx={{
                        color: accentColor,
                        fontSize: 26,
                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.45))',
                      }}
                    />
                  </Box>
                </Box>
              </Tooltip>
            </Box>

            {/* Guidelines / Help instructions */}
            <Box sx={{ textAlign: 'center', px: 1, width: '100%' }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  lineHeight: 1.4,
                }}
              >
                {mobile && showIntentButtons ? (
                  <>
                    📱 <strong>Tap/Click the QR code</strong> to download it, then upload in your UPI app to pay.
                  </>
                ) : (
                  <>
                    📷 <strong>Scan this QR code</strong> with any UPI app on your phone.
                  </>
                )}
              </Typography>
            </Box>

            {/* UPI Intent Buttons (Mobile Only) */}
            {mobile && showIntentButtons && (
              <Box sx={{ width: '100%', mt: 0, textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mb: 1.5,
                    color: 'text.secondary',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}
                >
                  — Or Pay With (If Installed) —
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.5,
                    justifyContent: 'center'
                  }}
                >
                  {UPI_APPS.filter(app => isTestPage || (enabledUpiApps ? enabledUpiApps.includes(app.id) : app.live)).map((app) => (
                    <Button
                      key={app.id}
                      component="a"
                      href={getIntentUrl(app, upiUrl, isTestPage)}
                      onClick={(e) => handleAppClick(e, app)}
                      variant="contained"
                      startIcon={
                        <Avatar
                          src={app.iconUrl}
                          alt={`${app.name} icon`}
                          sx={{ width: 22, height: 22, fontSize: 12, bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                        >
                          {app.name.charAt(0)}
                        </Avatar>
                      }
                      sx={{
                        backgroundColor: app.color,
                        color: app.textColor,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontWeight: 700,
                        minWidth: 'auto',
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                        boxShadow: `0 2px 8px ${overlay.neutralStrong(isDark)}`,
                        border: (app.color?.toLowerCase() === text.white.toLowerCase() || app.color?.replace('#', '').toLowerCase() === 'fff') ? `1px solid ${border.divider(isDark)}` : 'none',
                        '&:hover': {
                          backgroundColor: app.color,
                          filter: 'brightness(0.95)',
                        }
                      }}
                    >
                      {app.name}
                    </Button>
                  ))}

                  {/* Fallback pure UPI link */}
                  {isTestPage && (
                    <Button
                      component="a"
                      href={upiUrl}
                      variant="outlined"
                      sx={{
                        borderColor: accentColor,
                        color: accentColor,
                        borderRadius: '16px',
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2,
                        py: 0.5,
                        fontSize: '0.75rem',
                      }}
                    >
                      Other App
                    </Button>
                  )}
                </Box>

                {isTestPage && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.disabled', fontSize: '0.65rem' }}>
                    If buttons are unresponsive, tap <b>⋮</b> (top right) and select <b>Open in Chrome</b>.
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0, mb: 0 }}>
              <Button
                variant="text"
                startIcon={<BankIcon />}
                onClick={() => setBankDetailsOpen(true)}
                sx={{ color: accentColor, fontWeight: 700, textTransform: 'none', fontSize: '0.8rem', opacity: 0.9, '&:hover': { opacity: 1 } }}
              >
                Or Pay via Net Banking
              </Button>
            </Box>
          </Box>

          {/* Reminder to share screenshot */}
          {showImportantNotice && (
            <Box
              sx={{
                mb: 0,
                borderRadius: '12px',
                overflow: 'hidden',
                border: '1px solid rgba(255,179,0,0.2)',
              }}
            >
              <Box
                sx={{
                  px: 1.5,
                  py: 0.8,
                  background: `linear-gradient(135deg, ${brand.orange}, ${brand.gold})`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, color: text.dark, letterSpacing: '0.02em' }}>
                  📌 Important
                </Typography>
              </Box>
              <Box sx={{ px: 1.5, py: 1, background: 'rgba(255,179,0,0.06)' }}>
                <Typography
                  component="div"
                  variant="body2"
                  sx={{
                    color: 'text.primary',
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                  }}
                >
                  To help us update your records, please share your payment{' '}
                  <Box component="span" sx={{ fontWeight: 700, color: brand.gold }}>screenshot</Box>{' '}
                  {whatsappGroupLink ? (
                    <>
                      in our{' '}
                      <Box
                        component="a"
                        href={whatsappGroupLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontWeight: 800,
                          color: thirdParty.whatsapp,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.4,
                          verticalAlign: 'middle',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        <WhatsAppIcon sx={{ fontSize: 16 }} />
                        Festival WhatsApp Group
                      </Box>.
                    </>
                  ) : (
                    <>with the committee/organizers.</>
                  )}
                  {amountNum > 2000 && (
                    <>
                      <Box component="hr" sx={{ my: 0.5, border: 'none', borderTop: '1px dashed rgba(255,179,0,0.2)' }} />
                      ⚠️ <strong>UPI limits gallery QR uploads to ₹2,000.</strong> For higher amounts, please scan directly from another device.
                    </>
                  )}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Toast Notification */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            message={snackbarMessage}
            ContentProps={{
              sx: {
                backgroundColor: text.dark,
                color: text.white,
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: `1px solid ${accentColor}40`,
                boxShadow: `0 4px 20px ${accentColor}25`,
              }
            }}
          />
        </Box>
      </Fade>

      {/* Bank Details Dialog */}
      <Dialog
        open={bankDetailsOpen}
        onClose={() => setBankDetailsOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: '16px',
              backgroundColor: isDark ? text.dark : surface.paperLight,
              color: isDark ? text.white : 'text.primary',
              border: isDark ? `1px solid ${accentColor}40` : `1px solid ${border.divider(false)}`,
              boxShadow: isDark ? `0 8px 32px ${accentColor}30` : shadow.dialogLight,
            }
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BankIcon sx={{ color: accentColor }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isDark ? text.white : 'text.primary' }}>Bank Details</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title={copiedField === 'all' ? 'Copied all details!' : 'Copy all details'} arrow>
              <IconButton
                size="small"
                onClick={handleCopyAllBankDetails}
                aria-label="Copy all bank details"
                sx={{
                  color: copiedField === 'all' ? 'success.main' : 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': { color: accentColor, backgroundColor: `${accentColor}15` },
                }}
              >
                {copiedField === 'all' ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Share on WhatsApp" arrow>
              <IconButton
                size="small"
                onClick={handleWhatsAppShare}
                aria-label="Share on WhatsApp"
                sx={{
                  color: '#25D366',
                  transition: 'all 0.2s',
                  '&:hover': { backgroundColor: '#25D36620' },
                }}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Share details" arrow>
              <IconButton
                size="small"
                onClick={handleShareBankDetails}
                aria-label="Share bank details"
                sx={{
                  color: 'text.secondary',
                  transition: 'all 0.2s',
                  '&:hover': { color: accentColor, backgroundColor: `${accentColor}15` },
                }}
              >
                <ShareIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <IconButton
              size="small"
              onClick={() => setBankDetailsOpen(false)}
              aria-label="Close"
              sx={{
                color: 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': { color: 'text.primary' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pb: 2.5 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.5 }}>
            You can pay your {isDonation ? 'donation' : 'subscription'} directly using Net Banking or Direct UPI.
          </Typography>

          <Box sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', p: 1.5, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="subtitle2" sx={{ color: accentColor, fontWeight: 700, mb: 1.5 }}>Net Banking</Typography>

            {bankName && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minWidth: 0 }}>
                <Box sx={{ minWidth: 0, pr: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Bank Name</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{bankName}</Typography>
                </Box>
                <Tooltip title={copiedField === 'bankName' ? 'Copied!' : 'Copy Bank Name'} arrow>
                  <IconButton
                    size="small"
                    onClick={() => handleCopyDetails(bankName, 'Bank Name', 'bankName')}
                    sx={{
                      color: copiedField === 'bankName' ? 'success.main' : 'text.secondary',
                      flexShrink: 0,
                      transition: 'all 0.2s',
                      '&:hover': { color: accentColor },
                    }}
                  >
                    {copiedField === 'bankName' ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minWidth: 0 }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Account Name</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>{chequeFavourName || pn || committeeName || societyName || 'N/A'}</Typography>
              </Box>
              <Tooltip title={copiedField === 'accountName' ? 'Copied!' : 'Copy Account Name'} arrow>
                <IconButton
                  size="small"
                  onClick={() => handleCopyDetails(chequeFavourName || pn || committeeName || societyName || '', 'Account Name', 'accountName')}
                  sx={{
                    color: copiedField === 'accountName' ? 'success.main' : 'text.secondary',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { color: accentColor },
                  }}
                >
                  {copiedField === 'accountName' ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, minWidth: 0 }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>A/C Number</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{bankAccountNumber || 'N/A'}</Typography>
              </Box>
              <Tooltip title={copiedField === 'bankAccountNumber' ? 'Copied!' : 'Copy A/C Number'} arrow>
                <IconButton
                  size="small"
                  onClick={() => handleCopyDetails(bankAccountNumber, 'Account Number', 'bankAccountNumber')}
                  sx={{
                    color: copiedField === 'bankAccountNumber' ? 'success.main' : 'text.secondary',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { color: accentColor },
                  }}
                >
                  {copiedField === 'bankAccountNumber' ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>IFSC Code</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{bankIfscCode || 'N/A'}</Typography>
              </Box>
              <Tooltip title={copiedField === 'bankIfscCode' ? 'Copied!' : 'Copy IFSC Code'} arrow>
                <IconButton
                  size="small"
                  onClick={() => handleCopyDetails(bankIfscCode, 'IFSC Code', 'bankIfscCode')}
                  sx={{
                    color: copiedField === 'bankIfscCode' ? 'success.main' : 'text.secondary',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { color: accentColor },
                  }}
                >
                  {copiedField === 'bankIfscCode' ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '12px', p: 1.5, mt: 2, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
            <Typography variant="subtitle2" sx={{ color: accentColor, fontWeight: 700, mb: 1.5 }}>Direct UPI</Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minWidth: 0 }}>
              <Box sx={{ minWidth: 0, pr: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>UPI ID</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all' }}>{pa || 'N/A'}</Typography>
              </Box>
              <Tooltip title={copiedField === 'upiId' ? 'Copied!' : 'Copy UPI ID'} arrow>
                <IconButton
                  size="small"
                  onClick={() => handleCopyDetails(pa, 'UPI ID', 'upiId')}
                  sx={{
                    color: copiedField === 'upiId' ? 'success.main' : 'text.secondary',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { color: accentColor },
                  }}
                >
                  {copiedField === 'upiId' ? <CheckIcon sx={{ fontSize: 16 }} /> : <CopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UpiPaymentCard;
