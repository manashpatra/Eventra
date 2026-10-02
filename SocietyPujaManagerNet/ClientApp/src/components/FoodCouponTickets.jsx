import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, Chip, IconButton, Divider,
  Button, CircularProgress, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem,
  Checkbox, ListItemText, OutlinedInput, Tooltip
} from '@mui/material';
import { Close as CloseIcon, Share as ShareIcon, Download as DownloadIcon } from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { getMealDisplayName } from '../utils/textFormatters';
import { formatDate } from '../utils/dateUtils';
import { brand, surface, text, overlay, border, status, thirdParty, foodTicketTheme, defaultTicketTheme } from '../theme/colorTokens';

// Color palette per food type from centralized theme tokens
const FOOD_TYPE_THEME = foodTicketTheme;
const DEFAULT_THEME = defaultTicketTheme;

/**
 * Capture a DOM element as a PNG blob using html2canvas.
 * Hides any elements with class 'share-btn' before capture, restores after.
 */
const captureTicketImage = async (element) => {
  // Hide share buttons before capture
  const shareBtns = element.querySelectorAll('.share-btn');
  shareBtns.forEach(btn => { btn.style.display = 'none'; });

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: surface.menuDark,
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  } finally {
    shareBtns.forEach(btn => { btn.style.display = ''; });
  }
};

const getTicketFilename = (coupon, type) => {
  let ddmm = '';
  if (coupon.dayDate) {
    const parts = coupon.dayDate.split('-');
    if (parts.length >= 3) ddmm = `${parts[2]}${parts[1]}`;
  }
  if (!ddmm) ddmm = coupon.day?.toUpperCase() || 'DATE';
  const meal = (coupon.mealType || '').toUpperCase();
  const food = (coupon.foodType || '').toUpperCase();
  const t = type === 'Dine-out' ? 'D' : 'P';
  return `${ddmm}_${meal}_${food}_${t}.png`;
};

/**
 * Share a single ticket as an image via Web Share API (opens WhatsApp on mobile).
 * Falls back to downloading the image on desktop/unsupported browsers, 
 * as the QR code image is mandatory for redemption.
 */
const shareTicket = async (element, coupon, type, plates) => {
  const caption = `🎟️ ${coupon.day} | ${coupon.mealType} | ${coupon.foodType} | ${type.toUpperCase()} | ${plates} plate(s) | Flat: ${coupon.flatNumber}`;

  try {
    const blob = await captureTicketImage(element);
    const filename = getTicketFilename(coupon, type);
    const file = new File([blob], filename, { type: 'image/png' });

    let shared = false;
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `Food Coupon – ${coupon.day} ${coupon.mealType}`,
          text: caption,
        });
        shared = true;
      } catch (shareErr) {
        if (shareErr.name === 'AbortError') return false; // user cancelled
        console.warn('Web Share failed:', shareErr);
      }
    }

    if (!shared) {
      // Fallback: Download the QR image directly
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return true;
  } catch (e) {
    console.error('Error generating ticket image:', e);
    throw e;
  }
};

/**
 * Renders a single coupon as a mobile-friendly ticket stub.
 * The QR code contains only the coupon ID — matches what Scanner.jsx expects.
 */
const TicketCard = ({ coupon, type, plates, societyName, dateFormat, onShare, onDownload, sharing, downloading }) => {
  const ticketRef = useRef(null);
  const theme = FOOD_TYPE_THEME[coupon.foodType] || DEFAULT_THEME;
  const isDineOut = type === 'Dine-out';
  const icon = isDineOut ? '🍽️' : '📦';

  return (
    <Box sx={{ position: 'relative', maxWidth: { xs: '100%', sm: 400 }, width: '100%', mx: { sm: 'auto' } }}>
      {/* Capturable ticket area */}
      <Box
        ref={ticketRef}
        data-ticket-id={`${coupon.id}-${type}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          border: `1.5px solid ${theme.border}`,
          background: theme.bg,
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Top: QR Code */}
        <Box
          sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            p: 2.5, pb: 2,
            borderBottom: `2px dashed ${theme.border}`,
          }}
        >
          <Box sx={{ bgcolor: text.white, borderRadius: '12px', p: 1.5, display: 'flex' }}>
            <QRCodeCanvas
              value={`ONL-${coupon.flatDocId}-${coupon.id}`}
              size={200}
              level="Q"
              includeMargin={false}
            />
          </Box>
        </Box>

        {/* Bottom: Ticket Info (3-line layout) */}
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, textAlign: 'center' }}>

          {/* Line 1: Day & Date */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: 'text.primary' }}>
              {coupon.day} {coupon.dayDate ? `(${formatDate(coupon.dayDate, dateFormat)})` : ''}
            </Typography>
          </Box>

          {/* Line 2: Meal, Food Type & Dine/Parcel */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.accent }}>
              {getMealDisplayName(coupon.day, coupon.mealType)}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled' }}>•</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: theme.accent }}>
              {theme.label}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled' }}>•</Typography>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: isDineOut ? status.info.light(true) : brand.gold }}>
              {type.toUpperCase()}
            </Typography>
          </Box>

          {/* Line 3: Plates, Flat & Society */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600 }}>
              {icon} {plates} plate{plates !== 1 ? 's' : ''}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>•</Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 700 }}>
              {coupon.flatNumber}
            </Typography>
            {societyName && (
              <>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>•</Typography>
                <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                  {societyName}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Actions — hidden during image capture via className */}
        <Box className="share-btn" sx={{ position: 'absolute', bottom: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between' }}>
          <Tooltip title="Download Coupon" placement="top" arrow>
            <IconButton
              size="small"
              disabled={downloading}
              onClick={() => onDownload(ticketRef.current, coupon, type)}
              sx={{
                width: 28, height: 28,
                bgcolor: 'rgba(33,150,243,0.15)',
                color: status.info.main(true),
                border: '1px solid rgba(33,150,243,0.25)',
                '&:hover': { bgcolor: 'rgba(33,150,243,0.25)' },
              }}
            >
              {downloading ? <CircularProgress size={14} sx={{ color: status.info.main(true) }} /> : <DownloadIcon sx={{ fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Share Coupon" placement="top" arrow>
            <IconButton
              size="small"
              disabled={sharing}
              onClick={() => onShare(ticketRef.current, coupon, type, plates)}
              sx={{
                width: 28, height: 28,
                bgcolor: 'rgba(37,211,102,0.15)',
                color: thirdParty.whatsapp,
                border: '1px solid rgba(37,211,102,0.25)',
                '&:hover': { bgcolor: 'rgba(37,211,102,0.25)' },
              }}
            >
              {sharing ? <CircularProgress size={14} sx={{ color: thirdParty.whatsapp }} /> : <ShareIcon sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Full-screen dialog showing QR coupons for confirmed food coupons.
 * Coupons are grouped by Day → Meal → Food Type so that veg and non-veg
 * coupons are clearly separated (they may be served at different venues).
 */
const FoodCouponTickets = ({ open, onClose, coupons = [], societyName = '', dateFormat }) => {
  const [sharingId, setSharingId] = useState(null); // coupon id currently being shared
  const [downloadingId, setDownloadingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const contentRef = useRef(null);

  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedMeals, setSelectedMeals] = useState([]);

  const availableDates = useMemo(() => {
    const datesMap = {};
    coupons.forEach(c => { if (c.day) datesMap[c.day] = c.dayDate; });
    return Object.keys(datesMap).map(day => ({ day, dayDate: datesMap[day] })).sort((a, b) => {
      const dateA = a.dayDate ? new Date(a.dayDate).getTime() : 0;
      const dateB = b.dayDate ? new Date(b.dayDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [coupons]);

  const availableMeals = useMemo(() => {
    const meals = new Set();
    coupons.forEach(c => { if (c.mealType) meals.add(c.mealType); });
    return Array.from(meals).sort((a, b) => {
      const order = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      return (order[a] || 4) - (order[b] || 4);
    });
  }, [coupons]);

  useEffect(() => {
    if (open && coupons.length > 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${date}`;

      // Check for exact Date & Time match
      const todayCouponsDay = availableDates.find(d => d.dayDate === todayStr);
      
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const timeInHours = hour + (minutes / 60);

      let targetMeal = '';
      if (timeInHours < 11.5) { // Before 11:30 AM
        targetMeal = 'Breakfast';
      } else if (timeInHours < 15.5) { // 11:30 AM to 3:30 PM
        targetMeal = 'Lunch';
      } else { // After 3:30 PM
        targetMeal = 'Dinner';
      }

      let hasExactMatch = false;
      if (todayCouponsDay) {
        const hasMealToday = coupons.some(c => c.day === todayCouponsDay.day && c.mealType === targetMeal);
        if (hasMealToday) {
          hasExactMatch = true;
        }
      }

      if (hasExactMatch) {
        setSelectedDates([todayCouponsDay.day]);
        setSelectedMeals([targetMeal]);
      } else {
        // Fallback: show everything
        setSelectedDates(availableDates.map(d => d.day));
        setSelectedMeals(availableMeals);
      }
    }
  }, [open, coupons, availableDates, availableMeals]);

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c =>
      selectedDates.includes(c.day) &&
      selectedMeals.includes(c.mealType)
    );
  }, [coupons, selectedDates, selectedMeals]);

  // Build grouped structure: { "Day1": { "Lunch": { "Veg": [...], "Non-Veg": [...] } } }
  const grouped = useMemo(() => {
    if (!filteredCoupons || filteredCoupons.length === 0) return {};

    const sortedCoupons = [...filteredCoupons].sort((a, b) => {
      const dateA = a.dayDate ? new Date(a.dayDate).getTime() : 0;
      const dateB = b.dayDate ? new Date(b.dayDate).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;

      const mealOrder = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      const mealA = mealOrder[a.mealType] || 4;
      const mealB = mealOrder[b.mealType] || 4;
      return mealA - mealB;
    });

    const map = {};
    sortedCoupons.forEach((c) => {
      const day = c.day || 'Unknown';
      const meal = c.mealType || 'Unknown';
      const food = c.foodType || 'Unknown';

      if (!map[day]) map[day] = {};
      if (!map[day][meal]) map[day][meal] = {};
      if (!map[day][meal][food]) map[day][meal][food] = [];
      map[day][meal][food].push(c);
    });
    return map;
  }, [filteredCoupons]);

  const dayKeys = Object.keys(grouped);

  const handleShareTicket = useCallback(async (element, coupon, type, plates) => {
    const id = `${coupon.id}-${type}`;
    setSharingId(id);
    try {
      await shareTicket(element, coupon, type, plates);
    } catch (e) {
      setSnackbar({ open: true, message: 'Could not share coupon.' });
    } finally {
      setSharingId(null);
    }
  }, []);

  const handleDownloadTicket = useCallback(async (element, coupon, type) => {
    const id = `${coupon.id}-${type}`;
    setDownloadingId(id);
    try {
      const blob = await captureTicketImage(element);
      const filename = getTicketFilename(coupon, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setSnackbar({ open: true, message: 'Could not download coupon.' });
    } finally {
      setDownloadingId(null);
    }
  }, []);

  // Share functionality for single coupon is maintained above

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      slotProps={{ paper: {
        sx: {
          bgcolor: 'background.default',
          backgroundImage: 'none',
          borderRadius: 0,
        },
      } }}
    >
      <DialogTitle
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          py: 1.5, px: 2,
          background: 'linear-gradient(135deg, rgba(255,143,0,0.12) 0%, rgba(230,81,0,0.06) 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700 }}>🎟️ My QR Food Coupons</Typography>
          <Chip label={`${coupons.length}`} size="small" sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22, bgcolor: overlay.brandMedium(true), color: brand.gold }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent ref={contentRef} sx={{ p: 2, pt: 3 }}>
        {coupons.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', mt: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
              <InputLabel id="filter-dates-label">Filter Dates</InputLabel>
              <Select
                labelId="filter-dates-label"
                multiple
                value={selectedDates}
                onChange={(e) => setSelectedDates(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Filter Dates" />}
                renderValue={(selected) => selected.join(', ')}
                sx={{ fontSize: '0.85rem' }}
              >
                {availableDates.map((d) => (
                  <MenuItem key={d.day} value={d.day} sx={{ py: 0.5 }}>
                    <Checkbox checked={selectedDates.includes(d.day)} size="small" sx={{ p: 0.5 }} />
                    <ListItemText primary={d.day} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140, flex: 1 }}>
              <InputLabel id="filter-meals-label">Filter Meals</InputLabel>
              <Select
                labelId="filter-meals-label"
                multiple
                value={selectedMeals}
                onChange={(e) => setSelectedMeals(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Filter Meals" />}
                renderValue={(selected) => selected.join(', ')}
                sx={{ fontSize: '0.85rem' }}
              >
                {availableMeals.map((m) => (
                  <MenuItem key={m} value={m} sx={{ py: 0.5 }}>
                    <Checkbox checked={selectedMeals.includes(m)} size="small" sx={{ p: 0.5 }} />
                    <ListItemText primary={m} primaryTypographyProps={{ fontSize: '0.85rem' }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {dayKeys.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: '2rem', mb: 1 }}>🎫</Typography>
            <Typography variant="body2" color="text.secondary">No food coupons match the selected filters.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {dayKeys.map((day) => {
              const meals = grouped[day];
              const mealKeys = Object.keys(meals);

              return (
                <Box key={day}>
                  {/* Day Header */}
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', mb: 1.5, color: 'text.primary' }}>
                    📅 {day}
                  </Typography>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {mealKeys.map((meal) => {
                      const foodTypes = meals[meal];
                      const foodKeys = Object.keys(foodTypes);

                      return foodKeys.map((food) => {
                        const ticketCoupons = foodTypes[food];
                        const foodTheme = FOOD_TYPE_THEME[food] || DEFAULT_THEME;

                        return (
                          <Box key={`${day}-${meal}-${food}`}>
                            {/* Section subheader: Meal + Food Type */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: 'text.secondary' }}>
                                {getMealDisplayName(day, meal)}
                              </Typography>
                              <Chip
                                label={food}
                                size="small"
                                sx={{
                                  height: 18, fontSize: '0.65rem', fontWeight: 700,
                                  bgcolor: foodTheme.chipBg, color: foodTheme.accent,
                                  border: `1px solid ${foodTheme.border}`,
                                }}
                              />
                            </Box>

                            {/* Ticket cards */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {ticketCoupons.flatMap((coupon) => {
                                const totalDineOut = (coupon.normalDineOutCount || 0) + (coupon.additionalDineOutCount || 0);
                                const totalParcel = (coupon.normalParcelCount || 0) + (coupon.additionalParcelCount || 0);

                                const tickets = [];
                                if (totalDineOut > 0) {
                                  tickets.push(
                                    <TicketCard
                                      key={`${coupon.id}-dineout`}
                                      coupon={coupon}
                                      type="Dine-out"
                                      plates={totalDineOut}
                                      societyName={societyName}
                                      dateFormat={dateFormat}
                                      onShare={handleShareTicket}
                                      onDownload={handleDownloadTicket}
                                      sharing={sharingId === `${coupon.id}-Dine-out`}
                                      downloading={downloadingId === `${coupon.id}-Dine-out`}
                                    />
                                  );
                                }
                                if (totalParcel > 0) {
                                  tickets.push(
                                    <TicketCard
                                      key={`${coupon.id}-parcel`}
                                      coupon={coupon}
                                      type="Parcel"
                                      plates={totalParcel}
                                      societyName={societyName}
                                      dateFormat={dateFormat}
                                      onShare={handleShareTicket}
                                      onDownload={handleDownloadTicket}
                                      sharing={sharingId === `${coupon.id}-Parcel`}
                                      downloading={downloadingId === `${coupon.id}-Parcel`}
                                    />
                                  );
                                }
                                return tickets;
                              })}
                            </Box>
                          </Box>
                        );
                      });
                    })}
                  </Box>

                  {/* Separator between days */}
                  {dayKeys.indexOf(day) < dayKeys.length - 1 && (
                    <Divider sx={{ mt: 2.5 }} />
                  )}
                </Box>
              );
            })}
          </Box>
        )}

        {/* Footer hint */}
        {dayKeys.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 4, mb: 2 }}>
            <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', lineHeight: 1.4 }}>
              Show the QR code at the serving counter to get your food.
              <br />
              Veg and Non-Veg may be served at different venues.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setSnackbar({ open: false, message: '' })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default FoodCouponTickets;
