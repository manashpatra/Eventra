import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, IconButton, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, ToggleButton, ToggleButtonGroup, Alert, Paper, CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, useTheme } from '@mui/material';
import {
  Fastfood as FoodIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon,
  QrCode2 as QrCodeIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Lock as LockIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  RestaurantMenu as RestaurantMenuIcon,
} from '@mui/icons-material';


const FoodCouponTickets = lazy(() => import('../../components/FoodCouponTickets'));
import { getFlatDetails } from '../../services/publicDataService';
import { getSelectedFlat } from '../../components/FlatSelectionDialog';
import { getMasterConfig, getAvailableFoodTypes } from '../../services/masterConfigService';
import { createDraftCart, updateDraftCart, deleteDraftCart, isFoodDayValid } from '../../services/draftCartService';
import { validateAccessCode, calculateCouponTotal } from '../../services/foodCouponService';
import { useSnackbar } from 'notistack';
import FoodMenuPopup from '../../components/FoodMenuPopup';
import { formatDate } from '../../utils/dateUtils';
import { formatMenuText, getMealDisplayName } from '../../utils/textFormatters';
import { brand, surface, text, overlay, border, gradient, shadow, status, roleColors, getMealTypeColor } from '../../theme/colorTokens';

const MyFoodSection = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [selectedFlat, setSelectedFlat] = useState(getSelectedFlat());

  const [flatData, setFlatData] = useState(null);
  const [appConfig, setAppConfig] = useState(null);
  const [menuPopupOpen, setMenuPopupOpen] = useState(false);
  const [ticketsOpen, setTicketsOpen] = useState(false);

  // Draft Cart states
  const [draftCart, setDraftCart] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [foodType, setFoodType] = useState('Non-Veg');
  const [totalPlates, setTotalPlates] = useState(0);
  const [parcelCount, setParcelCount] = useState(0);
  const [draftPaymentMode, setDraftPaymentMode] = useState('UPI');
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState(null);
  const [submittingDraft, setSubmittingDraft] = useState(false);
  const [editingCartItemId, setEditingCartItemId] = useState(null);

  // Online Food Coupon states
  const [onlinePinDialogOpen, setOnlinePinDialogOpen] = useState(false);
  const [onlinePin, setOnlinePin] = useState('');
  const [onlinePinError, setOnlinePinError] = useState('');
  const [onlinePinLoading, setOnlinePinLoading] = useState(false);
  const pinInputRef = useRef(null);

  useEffect(() => {
    if (onlinePinDialogOpen) {
      setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
    }
  }, [onlinePinDialogOpen]);

  const loadFlatData = useCallback(async (flat, existingConfig = null) => {
    if (!flat) {
      setFlatData(null);
      return;
    }
    try {
      const [data, config] = await Promise.all([
        getFlatDetails(flat.flatNumberForLookup),
        existingConfig ? Promise.resolve(existingConfig) : getMasterConfig(),
      ]);
      setFlatData(data);
    } catch (error) {
      console.error('Error loading flat data in MyFoodSection:', error);
    }
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const config = await getMasterConfig();
      if (config) {
        setAppConfig(config);
      }
      if (selectedFlat) {
        await loadFlatData(selectedFlat, config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUrlChange = () => {
      setMenuPopupOpen(window.location.hash.includes('?menu'));
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const handleOpenMenu = () => {
    if (!menuPopupOpen) {
      const currentHash = window.location.hash.split('?')[0];
      window.history.pushState(null, '', `${currentHash}?menu`);
      setMenuPopupOpen(true);
    }
  };

  const handleCloseMenu = () => {
    if (menuPopupOpen) {
      if (window.location.hash.includes('?menu')) {
        const cleanHash = window.location.hash.split('?')[0];
        window.history.replaceState(null, '', cleanHash);
      }
      setMenuPopupOpen(false);
    }
  };

  useEffect(() => {
    loadAll();
    const handleFlatChange = () => {
      const flat = getSelectedFlat();
      setSelectedFlat(flat);
      loadFlatData(flat);
    };
    window.addEventListener('flatSelectionChanged', handleFlatChange);
    return () => {
      window.removeEventListener('flatSelectionChanged', handleFlatChange);
    };
  }, [loadFlatData]);

  // --- Draft Cart Logic ---
  const enabledDays = useMemo(() => {
    return (appConfig?.foodDays || []).filter((d) => d.enabled && isFoodDayValid(d.date));
  }, [appConfig]);

  const enabledMeals = useMemo(() => {
    if (!appConfig || !selectedDay) return [];
    const dayConfig = appConfig.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig || !dayConfig.mealPrices) return [];

    return ['Breakfast', 'Lunch', 'Dinner'].filter(meal =>
      dayConfig.mealPrices[meal] && dayConfig.mealPrices[meal].enabled !== false
    );
  }, [appConfig, selectedDay]);

  useEffect(() => {
    if (enabledMeals.length > 0 && !enabledMeals.includes(selectedMeal)) {
      setSelectedMeal(enabledMeals[0]);
    } else if (enabledMeals.length === 0 && selectedMeal !== '') {
      setSelectedMeal('');
    }
  }, [enabledMeals, selectedMeal]);

  const currentPrices = useMemo(() => {
    if (!appConfig || !selectedDay || !selectedMeal || !foodType) return null;
    const dayConfig = appConfig.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig) return null;
    return dayConfig.mealPrices?.[selectedMeal]?.[foodType] || null;
  }, [appConfig, selectedDay, selectedMeal, foodType]);

  const alreadyPurchasedNormal = useMemo(() => {
    if (!flatData || !selectedDay || !selectedMeal) return 0;
    const residentCoupons = (flatData.foodCoupons || []).filter(c =>
      c.day === selectedDay &&
      c.mealType === selectedMeal
    );
    return residentCoupons.reduce((sum, c) => sum + (c.normalDineOutCount || 0) + (c.normalParcelCount || 0), 0);
  }, [flatData, selectedDay, selectedMeal]);

  const remainingQuota = useMemo(() => {
    if (!appConfig) return 0;
    const cartNormal = draftCart
      .filter(i => i.day === selectedDay && i.mealType === selectedMeal && i.id !== editingCartItemId)
      .reduce((sum, i) => sum + i.normalDineOutCount + i.normalParcelCount, 0);
    return Math.max(0, (appConfig.normalQuota || 4) - alreadyPurchasedNormal - cartNormal);
  }, [appConfig, alreadyPurchasedNormal, draftCart, selectedDay, selectedMeal, editingCartItemId]);

  const isVegOnlyMeal = useMemo(() => {
    if (!appConfig || !selectedDay || !selectedMeal) return false;
    const dayConfig = appConfig.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig || !dayConfig.mealPrices || !dayConfig.mealPrices[selectedMeal]) return false;
    return dayConfig.mealPrices[selectedMeal].vegOnly || false;
  }, [appConfig, selectedDay, selectedMeal]);

  const isParcelEnabled = currentPrices?.parcelEnabled !== false;

  const availableFoodTypes = useMemo(() => {
    if (!appConfig || !selectedDay || !selectedMeal) return ['Veg'];
    const dayConfig = appConfig.foodDays?.find(d => d.dayName === selectedDay);
    return getAvailableFoodTypes(dayConfig, selectedMeal);
  }, [appConfig, selectedDay, selectedMeal]);

  useEffect(() => {
    if (availableFoodTypes.length > 0) {
      const prefOrder = ['Chicken', 'Mutton', 'Non-Veg', 'Veg', 'Khichuri', 'Lucchi'];
      let selected = availableFoodTypes[0];
      for (const type of prefOrder) {
        if (availableFoodTypes.includes(type)) {
          selected = type;
          break;
        }
      }
      setFoodType(selected);
    }
  }, [availableFoodTypes]);

  const totalAmount = useMemo(() => {
    if (!currentPrices) return 0;
    const normalPriceVar = Number(currentPrices.normal) || 0;
    const additionalPrice = Number(currentPrices.additional) || 0;
    const packCharge = Number(currentPrices.parcelPacking) || 0;

    const isSamePrice = normalPriceVar === additionalPrice;
    const allocatedNormal = isSamePrice ? totalPlates : Math.min(totalPlates, remainingQuota);
    const allocatedAdditional = isSamePrice ? 0 : Math.max(0, totalPlates - remainingQuota);

    const allocatedNormalParcel = Math.min(parcelCount, allocatedNormal);
    const allocatedAdditionalParcel = Math.max(0, parcelCount - allocatedNormal);

    const normalDineOut = allocatedNormal - allocatedNormalParcel;
    const normalParcel = allocatedNormalParcel;
    const additionalDineOut = allocatedAdditional - allocatedAdditionalParcel;
    const additionalParcel = allocatedAdditionalParcel;

    return calculateCouponTotal(
      normalDineOut, normalParcel, additionalDineOut, additionalParcel,
      normalPriceVar, additionalPrice, packCharge
    );
  }, [currentPrices, totalPlates, parcelCount, remainingQuota]);

  const sortedPurchasedCoupons = useMemo(() => {
    if (!flatData?.foodCoupons) return [];
    return [...flatData.foodCoupons].sort((a, b) => {
      const dateA = a.dayDate ? new Date(a.dayDate).getTime() : 0;
      const dateB = b.dayDate ? new Date(b.dayDate).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;

      const mealOrder = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      const mealA = mealOrder[a.mealType] || 4;
      const mealB = mealOrder[b.mealType] || 4;
      return mealA - mealB;
    });
  }, [flatData?.foodCoupons]);

  // --- Handlers ---
  const handleAddToCart = (autoAdvance = false) => {
    if (!selectedDay || !selectedMeal || !foodType) return;
    if (totalPlates === 0) return;

    const isSamePrice = currentPrices && currentPrices.normal === currentPrices.additional;
    const allocatedNormal = isSamePrice ? totalPlates : Math.min(totalPlates, remainingQuota);
    const allocatedAdditional = isSamePrice ? 0 : Math.max(0, totalPlates - remainingQuota);

    const allocatedNormalParcel = Math.min(parcelCount, allocatedNormal);
    const allocatedAdditionalParcel = Math.max(0, parcelCount - allocatedNormal);

    const normalDineOut = allocatedNormal - allocatedNormalParcel;
    const normalParcel = allocatedNormalParcel;
    const additionalDineOut = allocatedAdditional - allocatedAdditionalParcel;
    const additionalParcel = allocatedAdditionalParcel;

    const newItem = {
      id: editingCartItemId || Date.now().toString(),
      day: selectedDay,
      dayDate: enabledDays.find((d) => d.dayName === selectedDay)?.date || '',
      mealType: selectedMeal,
      foodType,
      normalDineOutCount: normalDineOut,
      normalParcelCount: normalParcel,
      additionalDineOutCount: additionalDineOut,
      additionalParcelCount: additionalParcel,
      normalPrice: Number(currentPrices?.normal) || 0,
      additionalPrice: Number(currentPrices?.additional) || 0,
      parcelPackingCharge: Number(currentPrices?.parcelPacking) || 0,
      totalAmount,
    };

    if (editingCartItemId) {
      setDraftCart(draftCart.map(item => item.id === editingCartItemId ? newItem : item));
      setEditingCartItemId(null);
    } else {
      setDraftCart([...draftCart, newItem]);
    }

    // Reset item form & smart auto-advance to next meal/day
    if (autoAdvance) {
      const currentMealIdx = enabledMeals.indexOf(selectedMeal);
      if (currentMealIdx !== -1 && currentMealIdx < enabledMeals.length - 1) {
        // Next meal on the same day
        setSelectedMeal(enabledMeals[currentMealIdx + 1]);
      } else if (currentMealIdx === enabledMeals.length - 1) {
        // Last meal of the day → advance to next day's first meal
        const currentDayIdx = enabledDays.findIndex(d => d.dayName === selectedDay);
        if (currentDayIdx !== -1 && currentDayIdx < enabledDays.length - 1) {
          const nextDay = enabledDays[currentDayIdx + 1];
          setSelectedDay(nextDay.dayName);
          const nextDayConfig = appConfig?.foodDays?.find(d => d.dayName === nextDay.dayName);
          if (nextDayConfig?.mealPrices) {
            const nextDayMeals = ['Breakfast', 'Lunch', 'Dinner'].filter(
              meal => nextDayConfig.mealPrices[meal] && nextDayConfig.mealPrices[meal].enabled !== false
            );
            if (nextDayMeals.length > 0) {
              setSelectedMeal(nextDayMeals[0]);
            }
          }
          enqueueSnackbar(`⏭️ Advanced to ${nextDay.dayName} — ${['Breakfast', 'Lunch', 'Dinner'].find(m => {
            const mp = appConfig?.foodDays?.find(d => d.dayName === nextDay.dayName)?.mealPrices;
            return mp?.[m] && mp[m].enabled !== false;
          }) || 'Breakfast'}`, { variant: 'info', autoHideDuration: 2000 });
        } else {
          // Last day, last meal — reset selectors
          setSelectedDay('');
          setSelectedMeal('');
        }
      } else {
        setSelectedDay('');
        setSelectedMeal('');
      }
    }
    setTotalPlates(0);
    setParcelCount(0);
  };

  const handleRemoveFromCart = (id) => {
    setDraftCart(draftCart.filter(item => item.id !== id));
  };

  const handleEditCartItem = (id) => {
    const itemToEdit = draftCart.find(item => item.id === id);
    if (!itemToEdit) return;

    setSelectedDay(itemToEdit.day);
    setSelectedMeal(itemToEdit.mealType);
    setFoodType(itemToEdit.foodType);
    setTotalPlates((itemToEdit.normalDineOutCount || 0) + (itemToEdit.normalParcelCount || 0) + (itemToEdit.additionalDineOutCount || 0) + (itemToEdit.additionalParcelCount || 0));
    setParcelCount((itemToEdit.normalParcelCount || 0) + (itemToEdit.additionalParcelCount || 0));

    setEditingCartItemId(id);
  };

  const handleCancelCartItemEdit = () => {
    setEditingCartItemId(null);
    setSelectedDay('');
    setSelectedMeal('');
    setFoodType('Non-Veg');
    setTotalPlates(0);
    setParcelCount(0);
  };

  const pendingDraft = useMemo(() => {
    if (!flatData || !flatData.draftCarts || flatData.draftCarts.length === 0) return null;
    return flatData.draftCarts[0];
  }, [flatData]);

  const handleEditDraft = () => {
    if (!pendingDraft) return;

    const validItems = pendingDraft.items.filter(item => isFoodDayValid(item.dayDate));
    if (validItems.length < pendingDraft.items.length) {
      enqueueSnackbar('Some items in your draft were for past days and have been removed.', { variant: 'warning' });
    }

    setDraftCart(validItems);
    setDraftPaymentMode(pendingDraft.paymentMode || 'Cash');
    setIsEditingDraft(true);
    setEditingDraftId(pendingDraft.id);
  };

  const handleSubmitDraft = async () => {
    if (draftCart.length === 0 || !flatData) return;
    setSubmittingDraft(true);
    try {
      const draftData = {
        residentId: flatData.resident.id,
        residentName: flatData.resident.name,
        flatNumber: flatData.resident.flatNumber,
        items: draftCart,
        paymentMode: draftPaymentMode,
        totalAmount: draftCart.reduce((sum, item) => sum + item.totalAmount, 0),
      };

      if (isEditingDraft && editingDraftId) {
        await updateDraftCart(editingDraftId, draftData);
        enqueueSnackbar('Draft updated successfully! Tell the admin your flat number.', { variant: 'success' });
      } else {
        await createDraftCart(draftData);
        enqueueSnackbar('Draft saved successfully! Tell the admin your flat number.', { variant: 'success' });
      }

      setDraftCart([]);
      setIsEditingDraft(false);
      setEditingDraftId(null);
      loadFlatData(selectedFlat);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    } finally {
      setSubmittingDraft(false);
    }
  };

  const handleDeleteDraft = async () => {
    if (!pendingDraft) return;
    try {
      await deleteDraftCart(pendingDraft.id);
      enqueueSnackbar('Draft deleted.', { variant: 'info' });
      loadFlatData(selectedFlat);
    } catch (error) {
      enqueueSnackbar(error.message, { variant: 'error' });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress sx={{ color: brand.orange }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1.5, sm: 2 }, flexWrap: 'nowrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 28, height: 28, borderRadius: '8px',
              background: gradient.brand,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FoodIcon sx={{ color: text.white, fontSize: 16 }} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              My Food
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.1, fontSize: '0.65rem' }}>
              Manage your food coupons and pre-bookings
            </Typography>
          </Box>
        </Box>
        {appConfig?.isFoodSellWindowOpen !== false && (
          <Button
            variant="contained"
            color="primary"
            size="small"
            startIcon={<RestaurantMenuIcon sx={{ fontSize: '16px' }} />}
            onClick={handleOpenMenu}
            sx={{
              height: 28, fontSize: '0.75rem', fontWeight: 700, borderRadius: 2, textTransform: 'none', px: 2,
              background: gradient.menuButton,
              boxShadow: shadow.menuButton,
              '&:hover': {
                background: gradient.menuButtonHover
              }
            }}
          >
            Menu
          </Button>
        )}
      </Box>

      {!selectedFlat ? (
        <Alert severity="warning" sx={{ mb: 4 }}>
          Please select your flat to view and order food coupons.
        </Alert>
      ) : (
        <>
          {/* Sell Window Status Alert (Visible to everyone) */}
          {appConfig?.isFoodSellWindowOpen === false && (
            <Alert severity="warning" sx={{ mb: { xs: 1.5, sm: 2 } }}>
              Food coupon pre-booking is currently closed.
            </Alert>
          )}
          {flatData?.resident?.subscriptionStatus !== 'paid' && (
            <Alert severity="warning" sx={{ mb: { xs: 1.5, sm: 2 } }}>
              Please pay your subscription to pre-book food coupons.
            </Alert>
          )}
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {/* Draft Cart Builder (Paid Subscribers Only) */}
            {flatData?.resident?.subscriptionStatus === 'paid' && appConfig?.isFoodSellWindowOpen !== false && (
              <Grid size={12}>
                <Card
                  sx={{
                    border: isDark ? `1px solid ${border.brandMedium(true)}` : `1px solid ${border.brandSubtle(false)}`,
                    bgcolor: isDark ? overlay.brandXLight(true) : surface.paperLight,
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(255, 143, 0, 0.06)',
                    borderRadius: '16px',
                  }}
                >
                  <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1.25, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: brand.orange, mb: '8px', fontSize: '1rem' }}>
                      Pre-book Food Coupons
                    </Typography>

                    <>
                      {pendingDraft && !isEditingDraft ? (
                        <Alert severity="info" sx={{ mb: 1.5, py: 0.5, px: 1.5, alignItems: 'center', '& .MuiAlert-message': { width: '100%', p: 0.5 } }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', lineHeight: 1.3 }}>
                              Pre-booking saved (<strong>{formatCurrency(pendingDraft.totalAmount)}</strong>). Please visit the Clubhouse and share your flat number to pay and confirm.
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button variant="outlined" color="info" size="small" onClick={handleEditDraft} startIcon={<EditIcon sx={{ fontSize: '1rem !important' }} />} sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>
                                Modify Pre-booking
                              </Button>
                              <Button variant="outlined" color="error" size="small" onClick={handleDeleteDraft} startIcon={<DeleteIcon sx={{ fontSize: '1rem !important' }} />} sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>
                                Delete
                              </Button>
                            </Box>
                          </Box>
                        </Alert>
                      ) : (
                        <Box>
                          <Grid container spacing={{ xs: 1, sm: 2 }}>
                            <Grid size={{ xs: 6, sm: 6 }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Day</InputLabel>
                                <Select value={selectedDay} label="Day" onChange={(e) => setSelectedDay(e.target.value)}>
                                  {enabledDays.map((d) => {
                                    const formattedDate = formatDate(d.date, appConfig?.dateFormat);
                                    const dayNameStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                                    return (
                                      <MenuItem key={d.dayName} value={d.dayName}>{d.dayName} ({formattedDate} - {dayNameStr})</MenuItem>
                                    );
                                  })}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6, sm: 6 }}>
                              <FormControl fullWidth size="small" disabled={!selectedDay || enabledMeals.length === 0}>
                                <InputLabel>Meal</InputLabel>
                                <Select value={selectedMeal} label="Meal" onChange={(e) => setSelectedMeal(e.target.value)}>
                                  {enabledMeals.map((m) => (
                                    <MenuItem key={m} value={m}>{getMealDisplayName(selectedDay, m)}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>

                            {selectedMeal && currentPrices && (
                              <Grid size={12}>
                                <Paper
                                  variant="outlined"
                                  sx={{
                                    p: { xs: 1.25, sm: 2 },
                                    borderRadius: '12px',
                                    bgcolor: isDark ? overlay.shadowBlack : surface.pageLight,
                                    borderColor: isDark ? border.subtle(true) : border.subtle(false),
                                    boxShadow: isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.03)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                                    <ToggleButtonGroup
                                      value={foodType}
                                      exclusive
                                      onChange={(e, val) => val && setFoodType(val)}
                                      size="small"
                                      sx={{
                                        display: 'flex', flexWrap: 'wrap', gap: 0.5,
                                        '& .MuiToggleButtonGroup-grouped': {
                                          border: `1px solid ${border.divider(isDark)} !important`,
                                          borderRadius: '6px !important',
                                          margin: '0 !important'
                                        },
                                        '& .MuiToggleButton-root': { py: 0.5, px: 1.25, fontSize: '0.75rem', fontWeight: 700 }
                                      }}
                                    >
                                      {availableFoodTypes.includes('Chicken') && (
                                        <ToggleButton value="Chicken" color="warning" disabled={isVegOnlyMeal}>Chicken</ToggleButton>
                                      )}
                                      {availableFoodTypes.includes('Mutton') && (
                                        <ToggleButton value="Mutton" sx={{ color: status.error.dark(isDark), '&.Mui-selected': { bgcolor: isDark ? 'rgba(211,47,47,0.25)' : 'rgba(211,47,47,0.15)', color: status.error.dark(isDark) } }}>Mutton</ToggleButton>
                                      )}
                                      {availableFoodTypes.includes('Non-Veg') && (
                                        <ToggleButton value="Non-Veg" color="error" disabled={isVegOnlyMeal}>Non-Veg</ToggleButton>
                                      )}
                                      {availableFoodTypes.includes('Veg') && (
                                        <ToggleButton value="Veg" color="success">Veg</ToggleButton>
                                      )}
                                      {availableFoodTypes.includes('Khichuri') && (
                                        <ToggleButton value="Khichuri" sx={{ color: status.success.light(isDark), '&.Mui-selected': { bgcolor: isDark ? 'rgba(129,199,132,0.25)' : 'rgba(129,199,132,0.15)', color: status.success.light(isDark) } }}>Khichuri</ToggleButton>
                                      )}
                                      {availableFoodTypes.includes('Lucchi') && (
                                        <ToggleButton value="Lucchi" sx={{ color: status.success.main(isDark), '&.Mui-selected': { bgcolor: isDark ? 'rgba(76,175,80,0.25)' : 'rgba(76,175,80,0.15)', color: status.success.main(isDark) } }}>Lucchi</ToggleButton>
                                      )}
                                    </ToggleButtonGroup>
                                    {currentPrices?.normal !== currentPrices?.additional && (
                                      <Chip
                                        label={remainingQuota > 0 ? `${remainingQuota} @ ₹${currentPrices?.normal || 0}, then @ ₹${currentPrices?.additional}` : `@ ₹${currentPrices?.additional}`}
                                        size="small"
                                        color={remainingQuota > 0 ? "success" : "error"}
                                        sx={{ borderRadius: 1, fontWeight: 700, height: 24, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Box>

                                  {currentPrices?.menu && (() => {
                                    const { color, bg } = getMealTypeColor(foodType, isDark);

                                    return (
                                      <Box sx={{
                                        mb: 1.5, p: 1, borderRadius: 1,
                                        background: `linear-gradient(90deg, ${bg} 0%, transparent 100%)`,
                                        borderLeft: `3px solid ${color}`,
                                        display: 'flex', alignItems: 'center'
                                      }}>
                                        <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0px', fontSize: '0.75rem', lineHeight: 1.2 }}>
                                          {formatMenuText(currentPrices.menu)}
                                        </Typography>
                                      </Box>
                                    );
                                  })()}

                                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                                    <Grid size={{ xs: 6, sm: 6 }}>
                                      <TextField
                                        label={currentPrices.normal !== currentPrices.additional ? `Plates (Rate ₹${currentPrices.normal}/₹${currentPrices.additional})` : `Plates (Rate ₹${currentPrices.normal})`}
                                        type="number" size="small" fullWidth
                                        value={totalPlates}
                                        onChange={(e) => setTotalPlates(Math.max(0, parseInt(e.target.value) || 0))}
                                        slotProps={{ htmlInput: { min: 0 } }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                      />
                                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                        {[1, 2, 4].map((num, idx) => (
                                          <Chip key={`add-${num}-${idx}`} label={`+${num}`} size="small" variant="outlined" clickable
                                            onClick={() => setTotalPlates(totalPlates + num)}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                          />
                                        ))}
                                      </Box>
                                    </Grid>
                                    {isParcelEnabled && (
                                      <Grid size={{ xs: 6, sm: 6 }}>
                                        <TextField
                                          label={`Parcel (+₹${Number(currentPrices.parcelPacking) || 0}/pk)`}
                                          type="number" size="small" fullWidth
                                          value={parcelCount}
                                          onChange={(e) => setParcelCount(Math.min(totalPlates, Math.max(0, parseInt(e.target.value) || 0)))}
                                          slotProps={{ htmlInput: { min: 0, max: totalPlates } }}
                                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                          {Array.from(new Set([1, 2, totalPlates])).map((num, idx) => (
                                            num > 0 && (
                                              <Chip key={`add-parcel-${num}-${idx}`} label={num === totalPlates ? `All (${num})` : `+${num}`} size="small" variant="outlined" clickable
                                                onClick={() => setParcelCount(Math.min(totalPlates, parcelCount + num))}
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                              />
                                            )
                                          ))}
                                        </Box>
                                      </Grid>
                                    )}
                                  </Grid>

                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2.5, gap: 1.5, flexWrap: 'wrap' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: { xs: '0.95rem', sm: '1.05rem' }, color: isDark ? brand.gold : brand.orangeDark }}>
                                      Total: {formatCurrency(totalAmount)}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                      {editingCartItemId && (
                                        <Button size="small" variant="outlined" color="inherit" onClick={handleCancelCartItemEdit} sx={{ px: 1.5, minWidth: 0, whiteSpace: 'nowrap', fontSize: '0.75rem', borderRadius: '8px' }}>
                                          Cancel
                                        </Button>
                                      )}
                                      {!editingCartItemId && (
                                        <Tooltip title="Add to cart and stay on current meal" arrow>
                                          <span>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => handleAddToCart(false)}
                                              disabled={totalPlates === 0}
                                              sx={{
                                                px: 1.5,
                                                whiteSpace: 'nowrap',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                borderColor: isDark ? border.brandMedium(true) : border.brandMedium(false),
                                                color: isDark ? brand.orange : brand.orangeDark,
                                                '&:hover': { borderColor: isDark ? brand.orange : brand.orangeDark, bgcolor: overlay.brandLight(isDark) }
                                              }}
                                            >
                                              + Cart
                                            </Button>
                                          </span>
                                        </Tooltip>
                                      )}
                                      <Tooltip title={editingCartItemId ? "Update cart item" : "Add to cart and proceed to next meal"} arrow>
                                        <span>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            onClick={() => handleAddToCart(true)}
                                            disabled={totalPlates === 0}
                                            sx={{
                                              px: 1.8,
                                              whiteSpace: 'nowrap',
                                              fontSize: '0.78rem',
                                              fontWeight: 700,
                                              borderRadius: '8px',
                                              background: gradient.brand,
                                              color: text.white
                                            }}
                                          >
                                            {editingCartItemId ? 'Update Item' : '+ Cart & Next ➔'}
                                          </Button>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                </Paper>
                              </Grid>
                            )}
                          </Grid>

                          {draftCart.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                                    🛒 Cart Items
                                  </Typography>
                                  <Chip label={`${draftCart.length} item${draftCart.length > 1 ? 's' : ''}`} size="small" color="primary" sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                  <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel id="draft-payment-mode-label" sx={{ fontSize: '0.8rem' }}>Payment Mode</InputLabel>
                                    <Select
                                      labelId="draft-payment-mode-label"
                                      value={draftPaymentMode}
                                      label="Payment Mode"
                                      onChange={(e) => setDraftPaymentMode(e.target.value)}
                                      sx={{ fontSize: '0.8rem', borderRadius: '8px' }}
                                    >
                                      {(appConfig?.paymentModes || ['UPI', 'Cash', 'Cheque', 'Net Banking']).map((mode) => (
                                        <MenuItem key={mode} value={mode} sx={{ fontSize: '0.8rem' }}>{mode}</MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                  {isEditingDraft && (
                                    <Button size="small" variant="outlined" onClick={() => { setIsEditingDraft(false); setDraftCart([]); }} sx={{ borderRadius: '8px' }}>
                                      Cancel
                                    </Button>
                                  )}
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={handleSubmitDraft}
                                    disabled={submittingDraft || draftCart.length === 0}
                                    startIcon={submittingDraft ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
                                    sx={{
                                      whiteSpace: 'nowrap',
                                      fontWeight: 700,
                                      borderRadius: '8px',
                                      background: gradient.brand,
                                      color: text.white
                                    }}
                                  >
                                    {isEditingDraft ? 'Update Draft' : 'Save Draft'}
                                  </Button>
                                </Box>
                              </Box>
                              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', borderRadius: '12px', bgcolor: isDark ? 'background.paper' : surface.paperLight, border: '1px solid', borderColor: 'divider' }}>
                                <Table size="small" sx={{ '& .MuiTableCell-root': { px: { xs: 1, sm: 2 }, py: { xs: 1, sm: 1.5 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}>
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: isDark ? surface.tableHeadDark : surface.tableHeadLight }}>
                                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>Day</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>Meal</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>Plates</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>Amt</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: { xs: '0.72rem', sm: '0.85rem' } }}>Action</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {draftCart.map((item) => (
                                      <TableRow key={item.id} hover>
                                        <TableCell><Chip label={item.day} size="small" sx={{ fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 22, sm: 24 }, bgcolor: overlay.goldMedium(isDark), color: isDark ? brand.gold : brand.orangeDark, border: '1px solid', borderColor: border.goldMedium(isDark) }} /></TableCell>
                                        <TableCell>
                                          <Typography sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' }, color: 'text.primary' }}>{getMealDisplayName(item.day, item.mealType)}</Typography>
                                          <Chip
                                            label={item.foodType}
                                            size="small"
                                            sx={{
                                              height: 18,
                                              fontSize: '0.65rem',
                                              fontWeight: 700,
                                              mt: 0.5,
                                              bgcolor: getMealTypeColor(item.foodType, isDark).bg,
                                              color: getMealTypeColor(item.foodType, isDark).color,
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {item.normalDineOutCount > 0 && <Box sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Dine: <strong>{item.normalDineOutCount}</strong></Box>}
                                          {item.normalParcelCount > 0 && <Box sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Parcel: <strong>{item.normalParcelCount}</strong></Box>}
                                          {item.additionalDineOutCount > 0 && <Box sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Dine(A): <strong>{item.additionalDineOutCount}</strong></Box>}
                                          {item.additionalParcelCount > 0 && <Box sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>Parcel(A): <strong>{item.additionalParcelCount}</strong></Box>}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: { xs: '0.8rem', sm: '0.9rem' }, color: isDark ? brand.gold : brand.orangeDark }}>{formatCurrency(item.totalAmount)}</TableCell>
                                        <TableCell align="center">
                                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                            <IconButton size="small" color="info" onClick={() => handleEditCartItem(item.id)} title="Edit item">
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleRemoveFromCart(item.id)} title="Delete item">
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: isDark ? 'rgba(255,143,0,0.06)' : 'rgba(255,143,0,0.08)' }}>
                                      <TableCell colSpan={3} sx={{ fontWeight: 800, textAlign: 'right', fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Grand Total</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1rem' }, color: isDark ? brand.gold : brand.orangeDark }}>
                                        {formatCurrency(draftCart.reduce((sum, i) => sum + i.totalAmount, 0))}
                                      </TableCell>
                                      <TableCell></TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                        </Box>
                      )}
                    </>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Past Purchases for Selected Resident */}
            {flatData?.foodCoupons && flatData.foodCoupons.length > 0 && (
              <Grid size={12}>
                <Card>
                  <CardContent sx={{ py: { xs: 1.5, sm: 2 }, px: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            Your Food Coupons
                          </Typography>
                          <Chip
                            label={flatData.foodCoupons.length}
                            size="small"
                            sx={{ backgroundColor: overlay.brandMedium(isDark), color: brand.orange, fontWeight: 700, height: 22, fontSize: '0.75rem' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', flexWrap: 'wrap' }}>
                          {appConfig?.onlineFoodCouponEnabled && (
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<QrCodeIcon sx={{ fontSize: '14px !important' }} />}
                              onClick={() => setOnlinePinDialogOpen(true)}
                              sx={{
                                py: 0.25, px: 1.5, fontSize: '0.72rem', fontWeight: 700,
                                borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap',
                                borderColor: border.goldMedium(isDark), color: brand.gold,
                                '&:hover': { borderColor: brand.orange, bgcolor: overlay.brandLight(isDark) },
                              }}
                            >
                              QR Food Coupon
                            </Button>
                          )}
                        </Box>
                      </Box>
                      <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                        {sortedPurchasedCoupons.map((coupon) => (
                          <Grid key={coupon.id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card variant="outlined" sx={{
                              bgcolor: coupon.status === 'pending' ? 'rgba(255, 152, 0, 0.05)' : 'rgba(76, 175, 80, 0.05)',
                              borderColor: coupon.status === 'pending' ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)'
                            }}>
                              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    <Chip label={coupon.day} size="small" />
                                    <Tooltip title={coupon.isOnline ? "Online Coupon" : "Physical Coupon"} arrow placement="top">
                                      <Box sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        width: 24, height: 24, borderRadius: '6px',
                                        bgcolor: coupon.isOnline ? 'rgba(33, 150, 243, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                        border: `1px solid ${coupon.isOnline ? 'rgba(33, 150, 243, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`,
                                        color: coupon.isOnline ? status.info.main(isDark) : 'text.disabled'
                                      }}>
                                        {coupon.isOnline ? <PhoneAndroidIcon sx={{ fontSize: 14 }} /> : <QrCodeIcon sx={{ fontSize: 14 }} />}
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                  <Chip
                                    label={coupon.status === 'pending' ? 'Pending' : 'Issued'}
                                    size="small"
                                    color={coupon.status === 'pending' ? 'warning' : 'success'}
                                    icon={coupon.status === 'pending' ? <PendingIcon /> : <CheckIcon />}
                                  />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  {getMealDisplayName(coupon.day, coupon.mealType)}
                                  {(() => {
                                    const mealStyle = getMealTypeColor(coupon.foodType, isDark);
                                    return (
                                      <span style={{
                                        color: mealStyle.color,
                                        backgroundColor: mealStyle.bg,
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem'
                                      }}>
                                        {coupon.foodType}
                                      </span>
                                    );
                                  })()}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {coupon.normalDineOutCount > 0 && <Chip size="small" label={`Dine: ${coupon.normalDineOutCount}`} sx={{ fontSize: '0.65rem', height: 18 }} />}
                                  {coupon.normalParcelCount > 0 && <Chip size="small" label={`Parcel: ${coupon.normalParcelCount}`} sx={{ fontSize: '0.65rem', height: 18 }} />}
                                  {coupon.additionalDineOutCount > 0 && <Chip size="small" label={`Dine (A): ${coupon.additionalDineOutCount}`} sx={{ fontSize: '0.65rem', height: 18 }} />}
                                  {coupon.additionalParcelCount > 0 && <Chip size="small" label={`Parcel (A): ${coupon.additionalParcelCount}`} sx={{ fontSize: '0.65rem', height: 18 }} />}
                                </Box>
                                {coupon.couponNumbers && (
                                  <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                                    Coupons: {coupon.couponNumbers}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}

      <FoodMenuPopup
        open={menuPopupOpen}
        onClose={handleCloseMenu}
        config={appConfig}
      />

      {appConfig?.onlineFoodCouponEnabled && flatData?.foodCoupons?.length > 0 && (
        <Suspense fallback={null}>
          <FoodCouponTickets
            open={ticketsOpen}
            onClose={() => setTicketsOpen(false)}
            coupons={(flatData.foodCoupons || []).filter(c => c.isOnline)}
            societyName={appConfig?.societyName || ''}
            dateFormat={appConfig?.dateFormat}
          />
        </Suspense>
      )}

      {/* Online Food Coupons Section */}
      {appConfig?.onlineFoodCouponEnabled && selectedFlat && flatData && (
        <>
          {/* PIN Entry Dialog */}
          <Dialog
            open={onlinePinDialogOpen}
            onClose={() => { setOnlinePinDialogOpen(false); setOnlinePin(''); setOnlinePinError(''); }}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
              <LockIcon sx={{ color: roleColors['Food Seller'].text }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>Enter Access Code</Typography>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Enter the 6-digit access code provided by the committee to view your online food coupons.
              </Typography>
              <TextField
                autoFocus
                inputRef={pinInputRef}
                fullWidth
                autoComplete="off"
                label="6-Digit Access Code"
                placeholder="e.g. 482913"
                value={onlinePin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOnlinePin(val);
                  if (onlinePinError) setOnlinePinError('');
                }}
                error={!!onlinePinError}
                helperText={onlinePinError}
                slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' } }}
                sx={{ mb: 1 }}
              />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => { setOnlinePinDialogOpen(false); setOnlinePin(''); setOnlinePinError(''); }} color="inherit">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const code = onlinePin.trim();
                  if (!/^\d{6}$/.test(code)) {
                    setOnlinePinError('Please enter a valid 6-digit code');
                    return;
                  }
                  setOnlinePinLoading(true);
                  try {
                    const result = await validateAccessCode(selectedFlat.flatNumberForLookup, code);
                    if (result) {
                      setTicketsOpen(true);
                      setOnlinePinDialogOpen(false);
                      setOnlinePin('');
                      setOnlinePinError('');
                    } else {
                      setOnlinePinError('Invalid access code. Please try again.');
                    }
                  } catch (err) {
                    setOnlinePinError('Error verifying code. Please try again.');
                  } finally {
                    setOnlinePinLoading(false);
                  }
                }}
                variant="contained"
                disabled={onlinePinLoading || onlinePin.length !== 6}
                sx={{
                  background: gradient.indigoPurple,
                  '&:hover': { background: gradient.indigoPurpleHover },
                  fontWeight: 700,
                }}
              >
                {onlinePinLoading ? 'Verifying...' : 'Unlock'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default MyFoodSection;
