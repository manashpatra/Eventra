import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, IconButton, Chip,
  MenuItem, Grid, FormControl, InputLabel, Select, Tooltip, Fade,
  Alert, ToggleButton, ToggleButtonGroup, Paper, Autocomplete, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Fastfood as FastfoodIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  QrCode as QrCodeIcon,
  PhoneAndroid as PhoneAndroidIcon,
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUrl } from '../../../utils/upiHelper';
import {
  createFoodCoupon,
  calculateCouponTotal,
  getFoodCouponsByResident,
} from '../../../services/foodCouponService';
import { getAvailableFoodTypes } from '../../../services/masterConfigService';
import { getPendingDraftCartsByResidentId, deleteDraftCart, isFoodDayValid } from '../../../services/draftCartService';
import { issueOnlineFoodCoupon, getFoodCouponsDocByFlat } from '../../../services/foodCouponService';
import { printHTML } from '../../../utils/print/core';
import { getPrintHeaderHTML, getPrintHeaderStyles } from '../../../utils/print/shared';
import { autocompleteFlatFilter } from '../../../utils/flatHelper';
import ConfirmDialog from '../../../components/ConfirmDialog';
import UpiQrDialog from '../../../components/UpiQrDialog';
import { useSnackbar } from 'notistack';
import { formatDateTime, formatDate } from '../../../utils/dateUtils';
import { formatMenuText, getMealDisplayName } from '../../../utils/textFormatters';
import { useProcessing } from '../../../contexts/ProcessingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { brand, printTheme, statusBadge, getMealTypeColor, gradient as themeGradient, leadsPalette } from '../../../theme/colorTokens';

const SellCounterTab = ({ residents, config, coupons, historyLoaded, loadCounterData, loadHistoryData }) => {
  const { enqueueSnackbar } = useSnackbar();
  const { startProcessing, stopProcessing } = useProcessing();
  const { user } = useAuth();

  // Local state
  const [selectedResident, setSelectedResident] = useState(null);
  const [draftCarts, setDraftCarts] = useState([]);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMeal, setSelectedMeal] = useState('');
  const [foodType, setFoodType] = useState('Veg');
  const [totalPlates, setTotalPlates] = useState(0);
  const [parcelCount, setParcelCount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [remarks, setRemarks] = useState('');
  const [couponNumbers, setCouponNumbers] = useState('');
  const [cart, setCart] = useState([]);
  const [loadedDraftId, setLoadedDraftId] = useState(null);
  const [editingCartItemId, setEditingCartItemId] = useState(null);
  const [selectedResidentCoupons, setSelectedResidentCoupons] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [upiPopupOpen, setUpiPopupOpen] = useState(false);
  const [hasShownUPIQR, setHasShownUPIQR] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setHasShownUPIQR(false);
  }, [cart]);

  // Online coupon dialog state
  const [onlineCouponDialogOpen, setOnlineCouponDialogOpen] = useState(false);
  const [onlineAccessCode, setOnlineAccessCode] = useState('');
  const [onlineCodeError, setOnlineCodeError] = useState('');
  const [onlineIssuing, setOnlineIssuing] = useState(false);

  // Fetch draft carts when resident changes
  useEffect(() => {
    if (!selectedResident) {
      setDraftCarts([]);
      return;
    }
    const fetchDrafts = async () => {
      try {
        const drafts = await getPendingDraftCartsByResidentId(selectedResident.id);
        setDraftCarts(drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error('Error fetching drafts for resident:', err);
      }
    };
    fetchDrafts();
  }, [selectedResident]);

  // Fetch resident-specific coupons for quota checking
  useEffect(() => {
    const fetchResidentCoupons = async () => {
      if (!selectedResident) {
        setSelectedResidentCoupons([]);
        return;
      }
      try {
        const resCoupons = await getFoodCouponsByResident(selectedResident.id);
        setSelectedResidentCoupons(resCoupons);
      } catch (err) {
        console.error('Error fetching resident coupons:', err);
      }
    };
    fetchResidentCoupons();
  }, [selectedResident]);

  const handleManualRefresh = async () => {
    setLoading(true);
    await loadCounterData();
    if (selectedResident) {
      try {
        const drafts = await getPendingDraftCartsByResidentId(selectedResident.id);
        setDraftCarts(drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (err) {
        console.error('Error fetching drafts for resident:', err);
      }
    }
    setLoading(false);
  };

  const facilityTeams = useMemo(() => {
    if (user?.role === 'Admin' || user?.role === 'Super Admin') {
      return [
        { id: 'house_keeping', flatNumber: 'House Keeping', name: 'Facility Team', subscriptionStatus: 'paid', isFacility: true },
        { id: 'security', flatNumber: 'Security', name: 'Facility Team', subscriptionStatus: 'paid', isFacility: true }
      ];
    }
    return [];
  }, [user]);

  const paidResidents = useMemo(() => {
    const regularPaid = residents
      .filter((r) => r.subscriptionStatus === 'paid')
      .sort((a, b) => (a.flatNumber || '').localeCompare(b.flatNumber || '', undefined, { numeric: true, sensitivity: 'base' }));
    return [...facilityTeams, ...regularPaid];
  }, [residents, facilityTeams]);

  const enabledDays = useMemo(() => {
    return (config?.foodDays || []).filter((d) => d.enabled && isFoodDayValid(d.date));
  }, [config]);

  const enabledMeals = useMemo(() => {
    if (!config || !selectedDay) return [];
    const dayConfig = config.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig || !dayConfig.mealPrices) return [];
    return ['Breakfast', 'Lunch', 'Dinner'].filter(meal =>
      dayConfig.mealPrices[meal] && dayConfig.mealPrices[meal].enabled !== false
    );
  }, [config, selectedDay]);

  useEffect(() => {
    if (enabledMeals.length > 0 && !enabledMeals.includes(selectedMeal)) {
      setSelectedMeal(enabledMeals[0]);
    } else if (enabledMeals.length === 0 && selectedMeal !== '') {
      setSelectedMeal('');
    }
  }, [enabledMeals, selectedMeal]);

  const currentPrices = useMemo(() => {
    if (!config || !selectedDay || !selectedMeal || !foodType) return null;
    const dayConfig = config.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig) return null;
    return dayConfig.mealPrices?.[selectedMeal]?.[foodType] || dayConfig.mealPrices?.[selectedMeal]?.['Non-Veg'] || null;
  }, [config, selectedDay, selectedMeal, foodType]);

  const isParcelEnabled = currentPrices?.parcelEnabled !== false;

  const alreadyPurchasedNormal = useMemo(() => {
    if (!selectedResident || !selectedDay || !selectedMeal) return 0;
    const list = coupons.length > 0 ? coupons : selectedResidentCoupons;
    const residentCoupons = list.filter(c =>
      c.residentId === selectedResident.id &&
      c.day === selectedDay &&
      c.mealType === selectedMeal
    );
    return residentCoupons.reduce((sum, c) => sum + (c.normalDineOutCount || 0) + (c.normalParcelCount || 0), 0);
  }, [coupons, selectedResidentCoupons, selectedResident, selectedDay, selectedMeal]);

  const remainingQuota = useMemo(() => {
    if (!config) return 0;
    const cartNormal = cart
      .filter(i => i.day === selectedDay && i.mealType === selectedMeal && i.id !== editingCartItemId)
      .reduce((sum, i) => sum + i.normalDineOutCount + i.normalParcelCount, 0);
    return Math.max(0, (config.normalQuota || 4) - alreadyPurchasedNormal - cartNormal);
  }, [config, alreadyPurchasedNormal, cart, selectedDay, selectedMeal, editingCartItemId]);

  const isVegOnlyMeal = useMemo(() => {
    if (!config || !selectedDay || !selectedMeal) return false;
    const dayConfig = config.foodDays?.find(d => d.dayName === selectedDay);
    if (!dayConfig || !dayConfig.mealPrices || !dayConfig.mealPrices[selectedMeal]) return false;
    return dayConfig.mealPrices[selectedMeal].vegOnly || false;
  }, [config, selectedDay, selectedMeal]);

  const availableFoodTypes = useMemo(() => {
    if (!config || !selectedDay || !selectedMeal) return ['Veg'];
    const dayConfig = config.foodDays?.find(d => d.dayName === selectedDay);
    return getAvailableFoodTypes(dayConfig, selectedMeal);
  }, [config, selectedDay, selectedMeal]);

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

  // Auto-load pending draft cart when resident is selected
  useEffect(() => {
    if (selectedResident && draftCarts && draftCarts.length > 0) {
      const activeDraft = draftCarts.find(d => d.residentId === selectedResident.id && d.status === 'pending');
      if (activeDraft && cart.length === 0 && loadedDraftId !== activeDraft.id) {
        const validItems = (activeDraft.items || []).map(item => {
          let normalPriceVar = Number(item.normalPrice) || 0;
          let addlPrice = Number(item.additionalPrice) || 0;
          let packCharge = Number(item.parcelPackingCharge) || 0;

          const dayConfig = config?.foodDays?.find(d => d.dayName === item.day);
          if (dayConfig && dayConfig.mealPrices && dayConfig.mealPrices[item.mealType]) {
            const mealConfig = dayConfig.mealPrices[item.mealType][item.foodType] || dayConfig.mealPrices[item.mealType]['Non-Veg'];
            if (mealConfig) {
              normalPriceVar = Number(mealConfig.normal) || 0;
              addlPrice = Number(mealConfig.additional) || 0;
              packCharge = Number(mealConfig.parcelPacking) || 0;
            }
          }

          return {
            ...item,
            id: Date.now().toString() + Math.random(),
            residentId: selectedResident.id,
            residentName: selectedResident.name,
            flatNumber: selectedResident.flatNumber,
            normalPrice: normalPriceVar,
            additionalPrice: addlPrice,
            parcelPackingCharge: packCharge,
            totalAmount: calculateCouponTotal(
              item.normalDineOutCount || 0,
              item.normalParcelCount || 0,
              item.additionalDineOutCount || 0,
              item.additionalParcelCount || 0,
              normalPriceVar, addlPrice, packCharge
            )
          };
        });
        setCart(validItems);
        setPaymentMode(activeDraft.paymentMode || 'Cash');
        setLoadedDraftId(activeDraft.id);
      }
    }
  }, [selectedResident, draftCarts, config]);

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

  const handleDeleteDraftCart = async (draftId) => {
    try {
      await deleteDraftCart(draftId);
      setConfirmDialog(prev => ({ ...prev, open: false }));
      setDraftCarts(prev => prev.filter(d => d.id !== draftId));
      if (loadedDraftId === draftId) {
        setCart([]);
        setLoadedDraftId(null);
      }
    } catch (error) {
      alert(`Error deleting draft: ${error.message}`);
    }
  };

  const openDraftDeleteDialog = (draftId) => {
    setConfirmDialog({
      open: true,
      title: 'Discard Resident Draft Cart',
      message: 'Are you sure you want to discard this resident draft cart?',
      onConfirm: () => handleDeleteDraftCart(draftId),
    });
  };

  const handleAddToCart = (autoAdvance = false) => {
    if (!selectedResident || !selectedDay || !selectedMeal || totalPlates === 0) return;

    if (selectedResident.subscriptionStatus !== 'paid') {
      alert('Cannot sell coupons. Flat subscription is not paid.');
      return;
    }

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
      residentId: selectedResident.id,
      residentName: selectedResident.name,
      flatNumber: selectedResident.flatNumber,
      day: selectedDay,
      dayDate: enabledDays.find((d) => d.dayName === selectedDay)?.date || '',
      mealType: selectedMeal,
      foodType,
      normalDineOutCount: normalDineOut,
      normalParcelCount: normalParcel,
      additionalDineOutCount: additionalDineOut,
      additionalParcelCount: additionalParcel,
      normalPrice: currentPrices?.normal || 0,
      additionalPrice: currentPrices?.additional || 0,
      parcelPackingCharge: currentPrices?.parcelPacking || 0,
      totalAmount: selectedResident.isFacility ? 0 : totalAmount,
      focValue: selectedResident.isFacility ? totalAmount : 0,
      couponNumbers,
    };

    if (editingCartItemId) {
      setCart(cart.map(item => item.id === editingCartItemId ? newItem : item));
      setEditingCartItemId(null);
    } else {
      setCart([...cart, newItem]);
    }

    // Reset item form & smart auto-advance to next meal/day
    if (autoAdvance) {
      const currentMealIdx = enabledMeals.indexOf(selectedMeal);
      if (currentMealIdx !== -1 && currentMealIdx < enabledMeals.length - 1) {
        setSelectedMeal(enabledMeals[currentMealIdx + 1]);
      } else if (currentMealIdx === enabledMeals.length - 1) {
        const currentDayIdx = enabledDays.findIndex(d => d.dayName === selectedDay);
        if (currentDayIdx !== -1 && currentDayIdx < enabledDays.length - 1) {
          const nextDay = enabledDays[currentDayIdx + 1];
          setSelectedDay(nextDay.dayName);
          const nextDayConfig = config?.foodDays?.find(d => d.dayName === nextDay.dayName);
          if (nextDayConfig?.mealPrices) {
            const nextDayMeals = ['Breakfast', 'Lunch', 'Dinner'].filter(
              meal => nextDayConfig.mealPrices[meal] && nextDayConfig.mealPrices[meal].enabled !== false
            );
            if (nextDayMeals.length > 0) {
              setSelectedMeal(nextDayMeals[0]);
            }
          }
          enqueueSnackbar(`⏭️ Advanced to ${nextDay.dayName} — ${['Breakfast', 'Lunch', 'Dinner'].find(m => {
            const mp = config?.foodDays?.find(d => d.dayName === nextDay.dayName)?.mealPrices;
            return mp?.[m] && mp[m].enabled !== false;
          }) || 'Breakfast'}`, { variant: 'info', autoHideDuration: 2000 });
        }
      }
    }
    setTotalPlates(0);
    setParcelCount(0);
    setCouponNumbers('');
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleEditCartItem = (id) => {
    const itemToEdit = cart.find(item => item.id === id);
    if (!itemToEdit) return;

    setSelectedDay(itemToEdit.day || '');
    setSelectedMeal(itemToEdit.mealType || '');
    setFoodType(itemToEdit.foodType || 'Veg');
    setTotalPlates((itemToEdit.normalDineOutCount || 0) + (itemToEdit.normalParcelCount || 0) + (itemToEdit.additionalDineOutCount || 0) + (itemToEdit.additionalParcelCount || 0));
    setParcelCount((itemToEdit.normalParcelCount || 0) + (itemToEdit.additionalParcelCount || 0));
    setCouponNumbers(itemToEdit.couponNumbers || '');

    setEditingCartItemId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelCartItemEdit = () => {
    setEditingCartItemId(null);
    setSelectedDay('');
    setSelectedMeal('');
    setFoodType('Veg');
    setTotalPlates(0);
    setParcelCount(0);
    setCouponNumbers('');
  };

  const resetForm = () => {
    setSelectedResident(null);
    setSelectedDay('');
    setSelectedMeal('');
    setFoodType('Veg');
    setCouponNumbers('');
    setPaymentMode('Cash');
    setRemarks('');
    setCart([]);
    setLoadedDraftId(null);
    setEditingCartItemId(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);
  };

  const renderPlatesBreakdown = (item) => {
    const parts = [];
    if (item.normalDineOutCount) parts.push(`Dine: ${item.normalDineOutCount}`);
    if (item.normalParcelCount) parts.push(`Parcel: ${item.normalParcelCount}`);
    if (item.additionalDineOutCount) parts.push(`Dine(A): ${item.additionalDineOutCount}`);
    if (item.additionalParcelCount) parts.push(`Parcel(A): ${item.additionalParcelCount}`);
    return parts.join(', ');
  };

  const printIssuedCoupons = async (issuedItems) => {
    if (!issuedItems || issuedItems.length === 0) return;
    
    const sortedItems = [...issuedItems].sort((a, b) => {
      const dayConfigA = config?.foodDays?.find(d => d.dayName === a.day);
      const dayConfigB = config?.foodDays?.find(d => d.dayName === b.day);
      const dateA = dayConfigA?.date ? new Date(dayConfigA.date).getTime() : 0;
      const dateB = dayConfigB?.date ? new Date(dayConfigB.date).getTime() : 0;
      if (dateA !== dateB) return dateA - dateB;

      const mealOrder = { Breakfast: 1, Lunch: 2, Dinner: 3 };
      const mealA = mealOrder[a.mealType] || 4;
      const mealB = mealOrder[b.mealType] || 4;
      return mealA - mealB;
    });

    const residentName = sortedItems[0]?.residentName || '';
    const flatNumber = sortedItems[0]?.flatNumber || '';
    const payMode = sortedItems[0]?.paymentMode || 'Cash';
    const totalPaid = sortedItems.reduce((s, c) => s + (c.totalAmount || 0), 0);

    const headerHtml = getPrintHeaderHTML(config || {});
    const styles = getPrintHeaderStyles();

    // QR codes are not needed for physical coupons since they are managed by physical handover

    let itemsHtml = '';
    sortedItems.forEach((c) => {
      itemsHtml += `
        <div style="border: 2px dashed ${printTheme.orangeBanner}; border-radius: 8px; padding: 15px; margin-bottom: 20px; background: ${printTheme.orangeBannerBg}; page-break-inside: avoid; text-align: center;">
            <div>
              <div style="font-size: 18px; font-weight: bold; color: ${printTheme.orangeBanner}; margin-bottom: 6px;">${c.day || ''} - ${getMealDisplayName(c.day, c.mealType || '')} (${c.foodType || ''})</div>
              <div style="font-size: 15px; margin-bottom: 4px; color: ${printTheme.text};"><strong>Plates:</strong> ${renderPlatesBreakdown(c)}</div>
              ${c.couponNumbers ? `<div style="font-size: 12px; color: ${printTheme.textSecondary}; margin-bottom: 4px;">Coupon #: ${c.couponNumbers}</div>` : ''}
              <div style="font-size: 16px; font-weight: bold; margin-top: 6px; color: ${printTheme.text};">Amount Paid: ${formatCurrency(c.totalAmount)}</div>
            </div>
        </div>
      `;
    });

    const fullHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Food Coupon Receipt - ${flatNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: ${printTheme.text}; margin: 0; }
            ${styles}
            .receipt-title { text-align: center; font-size: 16px; font-weight: bold; margin: 15px 0; color: ${printTheme.orangeBanner}; text-transform: uppercase; letter-spacing: 1px; }
            .info-box { margin-bottom: 20px; font-size: 14px; line-height: 1.6; border-bottom: 1px solid ${printTheme.borderDivider}; padding-bottom: 12px; }
            .total-row { font-size: 16px; font-weight: bold; color: ${printTheme.orangeBanner}; text-align: right; margin-top: 20px; padding: 12px; background: ${printTheme.orangeBannerHighlight}; border-radius: 6px; }
            .footer-msg { text-align: center; margin-top: 25px; color: ${printTheme.footerText}; font-size: 12px; border-top: 1px dashed ${printTheme.borderDashed}; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${headerHtml}
          <div class="receipt-title">Food Coupons Receipt</div>
          <div class="info-box">
            <strong>Flat Number:</strong> ${flatNumber}<br/>
            <strong>Resident Name:</strong> ${residentName}<br/>
            <strong>Payment Mode:</strong> ${payMode}<br/>
            <strong>Date & Time:</strong> ${formatDateTime(new Date(), config?.dateFormat)}
          </div>

          <div style="margin-top: 15px;">
            ${itemsHtml}
          </div>

          <div class="total-row">
            Total Amount Paid: ${formatCurrency(totalPaid)}
          </div>

          <div class="footer-msg">
            🙏 Thank you for your food coupon purchase! Jai Maa Durga! 🌺
          </div>
        </body>
      </html>
    `;

    printHTML(fullHTML);
  };

  const handleSellCart = async (andPrint = false) => {
    if (cart.length === 0) return;

    startProcessing('Issuing coupons...');
    try {
      const createdCoupons = [];
      for (const item of cart) {
        const itemPaymentMode = selectedResident?.isFacility ? 'FOC' : paymentMode;
        const created = await createFoodCoupon({
          ...item,
          paymentMode: itemPaymentMode,
          remarks,
          issuedBy: user?.displayName || user?.email || user?.role || 'Admin',
        });
        createdCoupons.push(created);
      }
      if (loadedDraftId) {
        await deleteDraftCart(loadedDraftId);
        setDraftCarts(prev => prev.filter(d => d.id !== loadedDraftId));
      }
      resetForm();
      await loadCounterData();
      if (historyLoaded) {
        await loadHistoryData();
      }

      if (andPrint && createdCoupons.length > 0) {
        printIssuedCoupons(createdCoupons);
      }
      enqueueSnackbar('Food coupons issued successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error creating coupons:', error);
      enqueueSnackbar('Error issuing coupons: ' + error.message, { variant: 'error' });
    } finally {
      stopProcessing();
    }
  };

  // --- Online Food Coupon Handlers ---
  const handleOpenOnlineCouponDialog = async () => {
    if (cart.length === 0) return;
    setOnlineCodeError('');
    setOnlineIssuing(false);
    // Pre-fill access code if flat already has one
    try {
      const existing = await getFoodCouponsDocByFlat(selectedResident.flatNumber);
      setOnlineAccessCode(existing?.accessCode || '');
    } catch {
      setOnlineAccessCode('');
    }
    setOnlineCouponDialogOpen(true);
  };

  const handleIssueOnlineCoupons = async () => {
    // Validate 6-digit numeric
    const code = onlineAccessCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setOnlineCodeError('Please enter a valid 6-digit numeric code');
      return;
    }
    setOnlineCodeError('');
    setOnlineIssuing(true);
    try {
      await issueOnlineFoodCoupon({
        residentId: selectedResident.id,
        flatNumber: selectedResident.flatNumber,
        residentName: selectedResident.name,
        accessCode: code,
        cartItems: cart,
        paymentMode: selectedResident?.isFacility ? 'FOC' : paymentMode,
        remarks,
        issuedBy: user?.displayName || user?.email || user?.role || 'Admin',
      });
      if (loadedDraftId) {
        await deleteDraftCart(loadedDraftId);
        setDraftCarts(prev => prev.filter(d => d.id !== loadedDraftId));
      }
      setOnlineCouponDialogOpen(false);
      resetForm();
      await loadCounterData();
      if (historyLoaded) {
        await loadHistoryData();
      }
      enqueueSnackbar('Online food coupons issued successfully!', { variant: 'success' });
    } catch (error) {
      console.error('Error issuing online coupons:', error);
      enqueueSnackbar('Error issuing online coupons: ' + error.message, { variant: 'error' });
    } finally {
      setOnlineIssuing(false);
    }
  };

  return (
    <Fade in={true}>
      <Grid container spacing={{ xs: 1.5, sm: 2 }}>
        {/* LEFT COLUMN: Resident Selection & Item Config */}
        <Grid size={{ xs: 12, md: 7 }}>
          {/* Resident Selection Card */}
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  1. Select Resident Flat
                </Typography>
                <Tooltip title="Refresh Resident Data & Pre-bookings">
                  <IconButton onClick={handleManualRefresh} size="small" disabled={loading} color="primary">
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Autocomplete
                options={paidResidents}
                filterOptions={autocompleteFlatFilter}
                getOptionLabel={(option) => `${option.flatNumber} — ${option.name}`}
                value={selectedResident}
                onChange={(_, value) => setSelectedResident(value)}
                renderInput={(params) => <TextField {...params} label="Select Flat Owner (Paid Subscribers Only)" />}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.flatNumber}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{option.name}</Typography>
                    </Box>
                  </li>
                )}
                noOptionsText="No paid subscribers found"
              />

              {selectedResident === null && residents.length > 0 && paidResidents.length === 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  No residents have paid subscriptions yet. Subscriptions must be paid first.
                </Alert>
              )}

              {/* Draft Carts Alert for Selected Resident */}
              {selectedResident && draftCarts.some(d => d.residentId === selectedResident.id) && (
                <Box sx={{ mt: 2 }}>
                  {draftCarts.filter(d => d.residentId === selectedResident.id).map(activeDraft => {
                    const validTotal = activeDraft.items.filter(item => isFoodDayValid(item.dayDate)).reduce((sum, i) => sum + (i.totalAmount || 0), 0);
                    return (
                      <Alert key={activeDraft.id} severity={loadedDraftId === activeDraft.id ? "success" : "warning"} sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                              {loadedDraftId === activeDraft.id ? '⚡ Resident Draft Cart Auto-Loaded' : 'Pending Draft Cart Found'} ({activeDraft.items.length} items)
                            </Typography>
                            <Typography variant="body2">
                              Total: {formatCurrency(validTotal)} | Mode: {activeDraft.paymentMode}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="outlined" color="error" onClick={() => openDraftDeleteDialog(activeDraft.id)}>
                              Discard Draft
                            </Button>
                            {loadedDraftId === activeDraft.id ? (
                              <Button size="small" variant="outlined" color="warning" onClick={() => resetForm()}>
                                Clear Cart
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => {
                                  const validItems = activeDraft.items.filter(item => isFoodDayValid(item.dayDate)).map(item => {
                                    let normalPriceVar = item.normalPrice || 0;
                                    let addlPrice = item.additionalPrice || 0;
                                    let packCharge = item.parcelPackingCharge || 0;

                                    if (!normalPriceVar && !addlPrice && !packCharge && config) {
                                      const dayConfig = config.foodDays?.find(d => d.dayName === item.day);
                                      const mealConfig = dayConfig?.mealPrices?.[item.mealType]?.[item.foodType];
                                      if (mealConfig) {
                                        normalPriceVar = Number(mealConfig.normal) || 0;
                                        addlPrice = Number(mealConfig.additional) || 0;
                                        packCharge = Number(mealConfig.parcelPacking) || 0;
                                      }
                                    }

                                    return {
                                      ...item,
                                      id: Date.now().toString() + Math.random(),
                                      residentId: selectedResident.id,
                                      residentName: selectedResident.name,
                                      flatNumber: selectedResident.flatNumber,
                                      normalPrice: normalPriceVar,
                                      additionalPrice: addlPrice,
                                      parcelPackingCharge: packCharge,
                                      totalAmount: calculateCouponTotal(
                                        item.normalDineOutCount || 0,
                                        item.normalParcelCount || 0,
                                        item.additionalDineOutCount || 0,
                                        item.additionalParcelCount || 0,
                                        normalPriceVar, addlPrice, packCharge
                                      )
                                    };
                                  });
                                  setCart([...cart, ...validItems]);
                                  setPaymentMode(activeDraft.paymentMode || 'Cash');
                                  setLoadedDraftId(activeDraft.id);
                                }}
                              >
                                Load Draft Items
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Alert>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Item Configuration Card */}
          {selectedResident && (
            <Card>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                2. Configure Meal Items
              </Typography>

              <Grid container spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: 1.5 }}>
                {/* Day Selection */}
                <Grid size={6}>
                  <FormControl fullWidth size="small" disabled={!selectedResident}>
                    <InputLabel>Puja Day</InputLabel>
                    <Select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} label="Puja Day">
                      {selectedDay && !enabledDays.find(d => d.dayName === selectedDay) && (
                        <MenuItem value={selectedDay} disabled>
                          {selectedDay} (Unavailable)
                        </MenuItem>
                      )}
                      {enabledDays.map((d) => {
                        const formattedDate = formatDate(d.date, config?.dateFormat);
                        const dayNameStr = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
                        return (
                          <MenuItem key={d.dayName} value={d.dayName}>{d.dayName} ({formattedDate} - {dayNameStr})</MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Meal Selection */}
                <Grid size={6}>
                  <FormControl fullWidth size="small" disabled={!selectedResident || !selectedDay}>
                    <InputLabel>Meal</InputLabel>
                    <Select
                      value={selectedMeal}
                      onChange={(e) => setSelectedMeal(e.target.value)}
                      label="Meal"
                      disabled={enabledMeals.length === 0 && !selectedMeal}
                    >
                      {enabledMeals.length === 0 && !selectedMeal && (
                        <MenuItem value="" disabled>No meals enabled</MenuItem>
                      )}
                      {selectedMeal && !enabledMeals.includes(selectedMeal) && (
                        <MenuItem value={selectedMeal} disabled>
                          {selectedMeal} (Unavailable)
                        </MenuItem>
                      )}
                      {enabledMeals.map(meal => (
                        <MenuItem key={meal} value={meal}>
                          {meal === 'Breakfast' ? '🌅' : meal === 'Lunch' ? '☀️' : '🌙'} {getMealDisplayName(selectedDay, meal)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {selectedResident && selectedDay && selectedMeal && currentPrices && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  {/* Food Type Toggle */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                    <ToggleButtonGroup
                      value={foodType}
                      exclusive
                      onChange={(_, val) => val && setFoodType(val)}
                      size="small"
                      sx={{
                        display: 'flex', flexWrap: 'wrap', gap: 0.5,
                        '& .MuiToggleButtonGroup-grouped': { border: '1px solid rgba(255,255,255,0.1) !important', borderRadius: '4px !important', margin: '0 !important' },
                        '& .MuiToggleButton-root': { py: 0.5, px: 1, fontSize: '0.75rem', fontWeight: 700 }
                      }}
                    >
                      {availableFoodTypes.includes('Chicken') && (
                        <ToggleButton value="Chicken" color="warning">Chicken</ToggleButton>
                      )}
                      {availableFoodTypes.includes('Mutton') && (
                        <ToggleButton value="Mutton" sx={{ color: statusBadge.error.text, '&.Mui-selected': { bgcolor: statusBadge.error.bg, color: statusBadge.error.text } }}>Mutton</ToggleButton>
                      )}
                      {availableFoodTypes.includes('Non-Veg') && (
                        <ToggleButton value="Non-Veg" color="error">Non-Veg</ToggleButton>
                      )}
                      {availableFoodTypes.includes('Veg') && (
                        <ToggleButton value="Veg" color="success">Veg</ToggleButton>
                      )}
                      {availableFoodTypes.includes('Khichuri') && (
                        <ToggleButton value="Khichuri" sx={{ color: statusBadge.lightGreen.text, '&.Mui-selected': { bgcolor: statusBadge.lightGreen.bg, color: statusBadge.lightGreen.text } }}>Khichuri</ToggleButton>
                      )}
                      {availableFoodTypes.includes('Lucchi') && (
                        <ToggleButton value="Lucchi" sx={{ color: statusBadge.success.text, '&.Mui-selected': { bgcolor: statusBadge.success.bg, color: statusBadge.success.text } }}>Lucchi</ToggleButton>
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
                    const theme = getMealTypeColor(foodType, false);

                    return (
                      <Box sx={{
                        mb: 1.5, p: 1, borderRadius: 1,
                        background: `linear-gradient(90deg, ${theme.bg} 0%, transparent 100%)`,
                        borderLeft: `3px solid ${theme.color}`,
                        display: 'flex', alignItems: 'center'
                      }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', letterSpacing: '0px', fontSize: '0.75rem', lineHeight: 1.2 }}>
                          {formatMenuText(currentPrices.menu)}
                        </Typography>
                      </Box>
                    );
                  })()}

                  {/* Plate Inputs with Presets */}
                  <Grid container spacing={{ xs: 1, sm: 1.5 }}>
                    <Grid size={6}>
                      <TextField
                        fullWidth size="small"
                        label={currentPrices.normal !== currentPrices.additional ? `Plates (Rate ₹${currentPrices.normal}/₹${currentPrices.additional})` : `Plates (Rate ₹${currentPrices.normal})`}
                        type="number"
                        value={totalPlates}
                        onChange={(e) => setTotalPlates(Math.max(0, parseInt(e.target.value) || 0))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddToCart();
                          }
                        }}
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
                      <Grid size={6}>
                        <TextField
                          fullWidth size="small"
                          label={`Parcel (+₹${Number(currentPrices.parcelPacking) || 0}/pk)`}
                          type="number"
                          value={parcelCount}
                          onChange={(e) => setParcelCount(Math.min(totalPlates, Math.max(0, parseInt(e.target.value) || 0)))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddToCart();
                            }
                          }}
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
                    <Grid size={12}>
                      <TextField
                        fullWidth size="small"
                        label="Coupon Numbers (Optional)"
                        placeholder="e.g. 101, 102, 103"
                        value={couponNumbers}
                        onChange={(e) => setCouponNumbers(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddToCart();
                          }
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>Total: {formatCurrency(totalAmount)}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, flex: 1, justifyContent: 'flex-end' }}>
                      {editingCartItemId && (
                        <Button size="small" variant="outlined" color="inherit" onClick={handleCancelCartItemEdit} sx={{ px: 1, minWidth: 0, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>Cancel</Button>
                      )}
                      {!editingCartItemId && (
                        <Tooltip title="Add to cart and stay on current meal">
                          <span>
                            <Button size="small" variant="contained" color="primary" onClick={() => handleAddToCart(false)} disabled={totalPlates === 0} sx={{ px: 1, minWidth: 0, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                              + Cart
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                      <Tooltip title={editingCartItemId ? "Update cart item" : "Add to cart and proceed to next meal"}>
                        <span>
                          <Button size="small" variant="contained" color="primary" onClick={() => handleAddToCart(true)} disabled={totalPlates === 0} sx={{ px: 1, minWidth: 0, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                            {editingCartItemId ? 'Update' : '+ Cart & Next'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Paper>
              )}
            </CardContent>
          </Card>
          )}
        </Grid>

        {/* RIGHT COLUMN: Live Cart Summary & Checkout */}
        {selectedResident && (
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 1.5, flexGrow: 1, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  🛒 Cart Summary {cart.length > 0 ? `(${cart.length} items)` : ''}
                </Typography>
                {cart.length > 0 && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={resetForm}
                    startIcon={<ClearIcon />}
                  >
                    Clear
                  </Button>
                )}
              </Box>

              {cart.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3, opacity: 0.6 }}>
                  <ShoppingCartIcon sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Cart is empty. Select items on the left to add to order.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Paper
                    sx={{
                      p: 1.5,
                      background: 'linear-gradient(135deg, rgba(255,143,0,0.08) 0%, rgba(230,81,0,0.04) 100%)',
                      border: '1px solid rgba(255,143,0,0.2)',
                      borderRadius: 2,
                      mb: 2,
                    }}
                  >
                    {cart.map(item => (
                      <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: '1px dashed rgba(255,143,0,0.2)' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.day} - {getMealDisplayName(item.day, item.mealType)} ({item.foodType})</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {renderPlatesBreakdown(item)}
                            {item.couponNumbers ? ` | Coupons: ${item.couponNumbers}` : ''}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" onClick={() => handleEditCartItem(item.id)} color="primary"><EditIcon fontSize="small" /></IconButton>
                            <IconButton size="small" onClick={() => handleRemoveFromCart(item.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: brand.gold }}>
                        Grand Total
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: brand.gold }}>
                        {formatCurrency(cart.reduce((sum, i) => sum + i.totalAmount, 0))}
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Payment Mode Selection */}
                  <FormControl fullWidth size="small" sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}>
                    <InputLabel>Cart Payment Mode</InputLabel>
                    <Select
                      value={paymentMode}
                      onChange={(e) => {
                        setPaymentMode(e.target.value);
                        setHasShownUPIQR(false);
                        if (e.target.value.toLowerCase() === 'upi' && cart.reduce((sum, i) => sum + i.totalAmount, 0) > 0) {
                          setUpiPopupOpen(true);
                          setHasShownUPIQR(true);
                        }
                      }}
                      label="Cart Payment Mode"
                    >
                      {(config?.paymentModes || ['UPI', 'Cash', 'Cheque', 'Net Banking']).map((mode) => (
                        <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Remarks Input */}
                  <TextField
                    fullWidth size="small"
                    label="Payment / Transaction Notes (Optional)"
                    placeholder="e.g. Cash received by Counter 1"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
                  />

                  {/* UPI QR Code Trigger Button */}
                  {cart.reduce((sum, i) => sum + i.totalAmount, 0) > 0 && paymentMode?.toLowerCase() === 'upi' && (
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      startIcon={<QrCodeIcon />}
                      onClick={() => { setUpiPopupOpen(true); setHasShownUPIQR(true); }}
                      sx={{ fontWeight: 600, borderRadius: 1, mb: 2 }}
                    >
                      Show UPI QR Code
                    </Button>
                  )}

                  {/* Counter Action Buttons */}
                  {!(cart.reduce((sum, i) => sum + i.totalAmount, 0) > 0 && paymentMode?.toLowerCase() === 'upi' && !hasShownUPIQR) && (
                  <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      onClick={() => handleSellCart(false)}
                      disabled={cart.length === 0}
                      startIcon={<FastfoodIcon />}
                      fullWidth
                    >
                      Issue Physical Food Coupons
                    </Button>
                    {config?.onlineFoodCouponEnabled && (
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleOpenOnlineCouponDialog}
                        disabled={cart.length === 0}
                        startIcon={<PhoneAndroidIcon />}
                        fullWidth
                        sx={{
                          background: themeGradient.purpleVibrant,
                          '&:hover': { background: themeGradient.purpleVibrantHover },
                          fontWeight: 700,
                        }}
                      >
                        Issue Online Food Coupons
                      </Button>
                    )}
                  </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        )}

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        />

        {/* UPI QR Code Popup */}
        <UpiQrDialog
          open={upiPopupOpen}
          onClose={() => setUpiPopupOpen(false)}
          amount={cart.reduce((sum, i) => sum + i.totalAmount, 0)}
          flatNumber={selectedResident
            ? `${selectedResident.block}/${selectedResident.floor}${selectedResident.flatType}`
            : cart[0]?.flatNumber || ''}
          config={config}
          mode="food"
        />

        {/* Online Food Coupon Access Code Dialog */}
        <Dialog
          open={onlineCouponDialogOpen}
          onClose={() => setOnlineCouponDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 800, color: leadsPalette.total.color }}>
              📱 Issue Online Food Coupons
            </Typography>
            <IconButton onClick={() => setOnlineCouponDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Enter a 6-digit numeric code for <strong>{selectedResident?.flatNumber}</strong>. This code will be required by the resident to access their online food coupons.
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="6-Digit Access Code"
              placeholder="e.g. 482913"
              value={onlineAccessCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOnlineAccessCode(val);
                if (onlineCodeError) setOnlineCodeError('');
              }}
              error={!!onlineCodeError}
              helperText={onlineCodeError || 'Resident will need this code to view their QR coupons'}
              slotProps={{ htmlInput: { maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' } }}
              sx={{ mb: 2 }}
            />
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: leadsPalette.total.bg, border: `1px solid ${statusBadge.purple.border}` }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 600 }}>
                Cart Summary ({cart.length} items)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: leadsPalette.total.color }}>
                Total: {formatCurrency(cart.reduce((sum, i) => sum + i.totalAmount, 0))}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setOnlineCouponDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={handleIssueOnlineCoupons}
              variant="contained"
              disabled={onlineIssuing || onlineAccessCode.length !== 6}
              sx={{
                background: themeGradient.purpleVibrant,
                '&:hover': { background: themeGradient.purpleVibrantHover },
                fontWeight: 700,
              }}
            >
              {onlineIssuing ? 'Issuing...' : 'Issue Online Coupons'}
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
    </Fade>
  );
};

export default SellCounterTab;
