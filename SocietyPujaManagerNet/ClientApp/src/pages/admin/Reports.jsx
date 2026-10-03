import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Tabs, Tab, Fade, } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  People as PeopleIcon, Fastfood as FoodIcon, VolunteerActivism as DonationIcon,
  Business as SponsorIcon, CurrencyRupee as RupeeIcon, AccountBalanceWallet as WalletIcon,
  MenuBook as SouvenirIcon
} from '@mui/icons-material';
import { getAllResidents, getSubscriptionStats } from '../../services/residentService';
import { getAllDonations, getDonationStats } from '../../services/donationService';
import { getAllSouvenirs, getSouvenirStats } from '../../services/souvenirService';
import { getAllSponsorships, getSponsorshipStats } from '../../services/sponsorshipService';
import { getAllFoodCoupons, getFoodCouponStats } from '../../services/foodCouponService';
import { getAllExpenses } from '../../services/expenseService';
import { getMasterConfig } from '../../services/masterConfigService';
import { printHTML } from '../../utils/print/core';
import { getPrintHeaderHTML, getPrintFooterHTML, getPrintHeaderStyles } from '../../utils/print/shared';
import { formatDateTime } from '../../utils/dateUtils';

import BlockSubscriptionReportTab from './ReportTabs/BlockSubscriptionReportTab';
import FoodCouponReportTab from './ReportTabs/FoodCouponReportTab';
import DonationReportTab from './ReportTabs/DonationReportTab';
import SouvenirReportTab from './ReportTabs/SouvenirReportTab';
import SponsorshipReportTab from './ReportTabs/SponsorshipReportTab';
import ExpenseSubCategoryReportTab from './ReportTabs/ExpenseSubCategoryReportTab';
import IncomeSubCategoryReportTab from './ReportTabs/IncomeSubCategoryReportTab';
import PaymentModeReportTab from './ReportTabs/PaymentModeReportTab';
import PaidSubscriptionsReportTab from './ReportTabs/PaidSubscriptionsReportTab';
import SleekLoader from '../../components/SleekLoader';
import { brand, printTheme, statusBadge } from '../../theme/colorTokens';

const Reports = () => {
  const navigate = useNavigate();
  const { tab } = useParams();

  const activeTab = useMemo(() => {
    switch (tab) {
      case 'donations': return 1;
      case 'souvenirs': return 2;
      case 'sponsorships': return 3;
      case 'food-coupons': return 4;
      case 'expense-sub-category': return 5;
      case 'income-sub-category': return 6;
      case 'payment-mode': return 7;
      case 'block-wise': return 8;
      default: return 0; // covers undefined or 'subscriptions'
    }
  }, [tab]);

  const handleTabChange = (_, newValue) => {
    const routes = [
      '',
      'donations',
      'souvenirs',
      'sponsorships',
      'food-coupons',
      'expense-sub-category',
      'income-sub-category',
      'payment-mode',
      'block-wise'
    ];
    navigate(`/admin-reports${routes[newValue] ? '/' + routes[newValue] : ''}`);
  };


  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState([]);
  const [donations, setDonations] = useState([]);
  const [souvenirs, setSouvenirs] = useState([]);
  const [sponsorships, setSponsorships] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [config, setConfig] = useState(null);
  const [subStats, setSubStats] = useState({});
  const [donStats, setDonStats] = useState({});
  const [souvStats, setSouvStats] = useState({});
  const [sponStats, setSponStats] = useState({});
  const [couponStats, setCouponStats] = useState({});
  const [filterBlock, setFilterBlock] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [res, don, souv, spon, coup, exp, cfg] = await Promise.all([
        getAllResidents(), getAllDonations(), getAllSouvenirs(), getAllSponsorships(), getAllFoodCoupons(), getAllExpenses(),
        getMasterConfig(),
      ]);
      // Compute stats from already-fetched data (no duplicate Firestore reads)
      const [ss, ds, souvs, sps, cs] = await Promise.all([
        getSubscriptionStats(res), getDonationStats(don), getSouvenirStats(souv), getSponsorshipStats(spon), getFoodCouponStats(coup),
      ]);
      setResidents(res); setDonations(don); setSouvenirs(souv); setSponsorships(spon); setCoupons(coup); setExpenses(exp);
      setConfig(cfg); setSubStats(ss); setDonStats(ds); setSouvStats(souvs); setSponStats(sps); setCouponStats(cs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (a) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(a);

  // Apply Date Range Filter
  const isWithinDate = (dateString) => {
    if (!startDate && !endDate) return true;
    if (!dateString) return false;
    const d = new Date(dateString).getTime();
    const s = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : 0;
    const e = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
    return d >= s && d <= e;
  };

  const filteredResidentsData = useMemo(() => residents.filter(r => isWithinDate(r.transactionDate || r.paymentDate)), [residents, startDate, endDate]);
  const filteredDonations = useMemo(() => {
    return donations
      .filter(d => isWithinDate(d.transactionDate || d.createdAt))
      .sort((a, b) => new Date(a.transactionDate || a.createdAt) - new Date(b.transactionDate || b.createdAt));
  }, [donations, startDate, endDate]);
  const filteredSouvenirs = useMemo(() => {
    return souvenirs
      .filter(d => isWithinDate(d.transactionDate || d.createdAt))
      .sort((a, b) => new Date(a.transactionDate || a.createdAt) - new Date(b.transactionDate || b.createdAt));
  }, [souvenirs, startDate, endDate]);

  const filteredSponsorships = useMemo(() => {
    return sponsorships
      .filter(s => (s.status === 'Received' || s.status === 'Cancelled') && isWithinDate(s.transactionDate || s.createdAt))
      .sort((a, b) => new Date(a.transactionDate || a.createdAt) - new Date(b.transactionDate || b.createdAt));
  }, [sponsorships, startDate, endDate]);
  const filteredCoupons = useMemo(() => coupons.filter(c => isWithinDate(c.createdAt)), [coupons, startDate, endDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => isWithinDate(e.expenseDate || e.createdAt)), [expenses, startDate, endDate]);

  const fSubTotal = filteredResidentsData.filter(r => r.subscriptionStatus === 'paid').reduce((acc, r) => acc + (r.subscriptionAmount || 0), 0);
  const fDonTotal = filteredDonations.reduce((acc, d) => acc + (d.amount || 0), 0);
  const fSouvTotal = filteredSouvenirs.reduce((acc, d) => acc + (d.amount || 0), 0);
  const fSponTotal = filteredSponsorships.filter(s => s.status === 'Received').reduce((acc, s) => acc + (s.amount || 0), 0);
  const fSponCam = Math.round(filteredSponsorships.filter(s => s.status === 'Received' && (s.sponsorType || 'External') === 'External').reduce((acc, s) => acc + (s.amount || 0), 0) * 0.10);
  const fCoupTotal = filteredCoupons.reduce((acc, c) => acc + (c.totalAmount || 0), 0);
  const fExpTotal = filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const totalIncome = fSubTotal + fDonTotal + fSouvTotal + fSponTotal + fCoupTotal;

  const fSubCount = filteredResidentsData.filter(r => r.subscriptionStatus === 'paid').length;
  const fDonCount = filteredDonations.length;
  const fSouvCount = filteredSouvenirs.length;
  const fSponCount = filteredSponsorships.filter(s => s.status === 'Received').length;
  const fCoupCount = filteredCoupons.length;
  const fExpCount = filteredExpenses.length;
  const totalIncomeCount = fSubCount + fDonCount + fSouvCount + fSponCount + fCoupCount;

  // Block-wise subscription summary (using filtered data)
  const blockSummary = useMemo(() => {
    const blocks = {};
    filteredResidentsData.forEach(r => {
      const b = r.block;
      if (!blocks[b]) blocks[b] = { block: b, total: 0, paid: 0, pending: 0, amount: 0 };
      blocks[b].total++;
      if (r.subscriptionStatus === 'paid') { blocks[b].paid++; blocks[b].amount += r.subscriptionAmount || 0; }
      else blocks[b].pending++;
    });
    return Object.values(blocks).sort((a, b) => a.block - b.block);
  }, [filteredResidentsData]);

  // Day-wise food coupon summary (Sorted by Date ASC, with Breakfast, Lunch, Dinner for each day)
  const dayCouponSummary = useMemo(() => {
    const configFoodDays = Array.isArray(config?.foodDays) ? config.foodDays : [];

    // Map config food days by trimmed dayName
    const dayConfigMap = new Map();
    configFoodDays.forEach((d, idx) => {
      if (d && d.dayName && String(d.dayName).trim()) {
        const name = String(d.dayName).trim();
        dayConfigMap.set(name, {
          dayName: name,
          date: d.date || '',
          enabled: d.enabled !== false,
          mealPrices: d.mealPrices || {},
          configIndex: idx,
        });
      }
    });

    // Gather distinct days from filteredCoupons
    const couponDaysSet = new Set();
    filteredCoupons.forEach(c => {
      const dName = (c.day || '').trim();
      if (dName) couponDaysSet.add(dName);
    });

    // Collect all day names: all enabled days from config + any days that have coupons
    const allDayNamesSet = new Set([
      ...Array.from(dayConfigMap.values()).filter(d => d.enabled).map(d => d.dayName),
      ...couponDaysSet,
    ]);

    // If config has days but enabled filter left it empty, include all config days with names
    if (allDayNamesSet.size === 0 && dayConfigMap.size > 0) {
      Array.from(dayConfigMap.keys()).forEach(name => allDayNamesSet.add(name));
    }

    // Helper to get date for a day
    const getDayDate = (dayName) => {
      const cfg = dayConfigMap.get(dayName);
      if (cfg && cfg.date) return cfg.date;
      // Fallback: check if any coupon has dayDate or date
      const c = filteredCoupons.find(coupon => (coupon.day || '').trim() === dayName && (coupon.dayDate || coupon.date));
      return c ? (c.dayDate || c.date) : '';
    };

    // Sort days chronologically ascending by Date
    const sortedDayNames = Array.from(allDayNamesSet).sort((a, b) => {
      const dateA = getDayDate(a);
      const dateB = getDayDate(b);

      const timeA = dateA ? new Date(dateA).getTime() : NaN;
      const timeB = dateB ? new Date(dateB).getTime() : NaN;

      const validA = !isNaN(timeA);
      const validB = !isNaN(timeB);

      if (validA && validB) {
        if (timeA !== timeB) return timeA - timeB;
      } else if (validA && !validB) {
        return -1;
      } else if (!validA && validB) {
        return 1;
      }

      // If dates match or are missing, preserve config index
      const idxA = dayConfigMap.has(a) ? dayConfigMap.get(a).configIndex : 999;
      const idxB = dayConfigMap.has(b) ? dayConfigMap.get(b).configIndex : 999;
      if (idxA !== idxB) return idxA - idxB;

      return a.localeCompare(b);
    });

    const standardMeals = ['Breakfast', 'Lunch', 'Dinner'];
    const mealOrder = { 'Breakfast': 1, 'Lunch': 2, 'Dinner': 3 };

    // Initialize rows in sorted day order, and for each day, Breakfast, Lunch, Dinner
    const rowsMap = new Map();
    const rows = [];

    sortedDayNames.forEach(dayName => {
      const dayDate = getDayDate(dayName);

      // Determine meals for this day: standard Breakfast, Lunch, Dinner
      const dayMealsSet = new Set(standardMeals);

      // If any coupons exist for this day with a custom mealType, include that too
      filteredCoupons.forEach(c => {
        if ((c.day || '').trim() === dayName && c.mealType && c.mealType.trim()) {
          dayMealsSet.add(c.mealType.trim());
        }
      });

      const dayMeals = Array.from(dayMealsSet).sort((m1, m2) => {
        const o1 = mealOrder[m1] || 99;
        const o2 = mealOrder[m2] || 99;
        if (o1 !== o2) return o1 - o2;
        return m1.localeCompare(m2);
      });

      dayMeals.forEach(meal => {
        const key = `${dayName}-${meal}`;
        const row = {
          day: dayName,
          date: dayDate,
          meal,
          veg: 0,
          khichuri: 0,
          lucchi: 0,
          chicken: 0,
          mutton: 0,
          nonVegOther: 0,
          nonVeg: 0,
          dineOut: 0,
          parcel: 0,
          amount: 0,
        };
        rowsMap.set(key, row);
        rows.push(row);
      });
    });

    // Populate rows with coupon sales
    filteredCoupons.forEach(c => {
      const dName = (c.day || '').trim();
      const mName = (c.mealType || '').trim();
      const key = `${dName}-${mName}`;

      let row = rowsMap.get(key);
      if (!row) {
        // Fallback in case of any coupon with unexpected day/meal
        row = {
          day: dName || 'Unknown',
          date: c.dayDate || c.date || '',
          meal: mName || 'Unknown',
          veg: 0,
          khichuri: 0,
          lucchi: 0,
          chicken: 0,
          mutton: 0,
          nonVegOther: 0,
          nonVeg: 0,
          dineOut: 0,
          parcel: 0,
          amount: 0,
        };
        rowsMap.set(key, row);
        rows.push(row);
      }

      const totalDineOut = (c.normalDineOutCount || 0) + (c.additionalDineOutCount || 0);
      const totalParcel = (c.normalParcelCount || 0) + (c.additionalParcelCount || 0);
      const totalPlates = totalDineOut + totalParcel;

      if (c.foodType === 'Veg') {
        row.veg += totalPlates;
      } else if (c.foodType === 'Khichuri') {
        row.khichuri += totalPlates;
      } else if (c.foodType === 'Lucchi') {
        row.lucchi += totalPlates;
      } else if (c.foodType === 'Chicken') {
        row.chicken += totalPlates;
        row.nonVeg += totalPlates;
      } else if (c.foodType === 'Mutton') {
        row.mutton += totalPlates;
        row.nonVeg += totalPlates;
      } else {
        row.nonVegOther += totalPlates;
        row.nonVeg += totalPlates;
      }

      row.dineOut += totalDineOut;
      row.parcel += totalParcel;
      row.amount += c.totalAmount || 0;
    });

    return rows;
  }, [filteredCoupons, config]);

  // Payment mode breakdown
  const paymentModeSummary = useMemo(() => {
    const modes = {};
    const addMode = (mode, amount) => {
      const m = mode || 'Unknown';
      if (!modes[m]) modes[m] = { mode: m, count: 0, amount: 0 };
      modes[m].count++;
      modes[m].amount += amount || 0;
    };

    [...filteredResidentsData.filter(r => r.subscriptionStatus === 'paid'), ...filteredDonations, ...filteredSouvenirs, ...filteredSponsorships.filter(s => s.status === 'Received')].forEach(item => {
      addMode(item.paymentMode || 'Unknown', item.subscriptionAmount || item.amount || 0);
    });

    filteredCoupons.forEach(c => {
      if (c.paymentMode === 'FOC') return;
      if (c.paymentMode === 'Cash + UPI') {
        const total = Number(c.totalAmount) || 0;
        const cashPart = Math.min(total, Number(c.mixedCashAmount) || 0);
        const upiPart = total - cashPart;
        if (cashPart > 0) addMode('Cash', cashPart);
        if (upiPart > 0) addMode('UPI', upiPart);
      } else {
        addMode(c.paymentMode || 'Cash', c.totalAmount || 0);
      }
    });

    return Object.values(modes);
  }, [filteredResidentsData, filteredDonations, filteredSouvenirs, filteredSponsorships, filteredCoupons]);

  const filteredPaidResidents = useMemo(() => {
    let paid = residents.filter(r => r.subscriptionStatus === 'paid');
    paid = paid.filter(r => isWithinDate(r.transactionDate || r.paymentDate));
    if (filterBlock !== 'all') paid = paid.filter(r => String(r.block) === filterBlock);

    return paid.sort((a, b) => {
      const getFlatStr = (r) => {
        let f = r.flatNumber || r.flat || '';
        if (!f && r.block !== undefined && r.floor !== undefined && r.flatType) {
          f = `${r.block}-${r.floor}-${r.flatType}`;
        }
        return String(f).trim();
      };

      const flatA = getFlatStr(a);
      const flatB = getFlatStr(b);

      const blockA = Number(a.block) || 0;
      const blockB = Number(b.block) || 0;
      if (blockA !== blockB) return blockA - blockB;

      if (flatA && flatB) {
        return flatA.localeCompare(flatB, undefined, { numeric: true, sensitivity: 'base' });
      }

      const floorA = Number(a.floor) || 0;
      const floorB = Number(b.floor) || 0;
      if (floorA !== floorB) return floorA - floorB;

      const typeA = String(a.flatType || '').trim().toLowerCase();
      const typeB = String(b.flatType || '').trim().toLowerCase();
      return typeA.localeCompare(typeB);
    });
  }, [residents, filterBlock, startDate, endDate]);
  // Income Sub-Category Summary
  const incomeSubCategorySummary = useMemo(() => {
    const cats = {};

    const addIncome = (category, mode, amount) => {
      const catName = category;
      let subName = 'Cash';

      const pMode = (mode || '').toLowerCase();
      if (pMode === 'cash' || (pMode.includes('cash') && pMode !== 'cash + upi')) subName = 'Cash';
      else subName = 'Bank';

      if (!cats[catName]) {
        cats[catName] = { category: catName, count: 0, amount: 0, subCategories: {} };
      }
      cats[catName].count++;
      cats[catName].amount += amount || 0;

      if (!cats[catName].subCategories[subName]) {
        cats[catName].subCategories[subName] = { subCategory: subName, count: 0, amount: 0 };
      }
      cats[catName].subCategories[subName].count++;
      cats[catName].subCategories[subName].amount += amount || 0;
    };

    filteredResidentsData.filter(r => r.subscriptionStatus === 'paid').forEach(r => {
      addIncome('Subscriptions', r.paymentMode, r.subscriptionAmount);
    });
    filteredDonations.forEach(d => {
      addIncome('Donations', d.paymentMode, d.amount);
    });
    filteredSouvenirs.forEach(d => {
      addIncome('Souvenirs', d.paymentMode, d.amount);
    });
    filteredSponsorships.filter(s => s.status === 'Received').forEach(s => {
      addIncome('Sponsorships', s.paymentMode, s.amount);
    });
    filteredCoupons.forEach(c => {
      if (c.paymentMode === 'Cash + UPI') {
        const total = Number(c.totalAmount) || 0;
        const cashPart = Math.min(total, Number(c.mixedCashAmount) || 0);
        const bankPart = total - cashPart;

        if (!cats['Food Coupons']) {
          cats['Food Coupons'] = { category: 'Food Coupons', count: 0, amount: 0, subCategories: {} };
        }
        cats['Food Coupons'].count++;
        cats['Food Coupons'].amount += total;

        if (cashPart > 0) {
          if (!cats['Food Coupons'].subCategories['Cash']) {
            cats['Food Coupons'].subCategories['Cash'] = { subCategory: 'Cash', count: 0, amount: 0 };
          }
          cats['Food Coupons'].subCategories['Cash'].count++;
          cats['Food Coupons'].subCategories['Cash'].amount += cashPart;
        }
        if (bankPart > 0) {
          if (!cats['Food Coupons'].subCategories['Bank']) {
            cats['Food Coupons'].subCategories['Bank'] = { subCategory: 'Bank', count: 0, amount: 0 };
          }
          cats['Food Coupons'].subCategories['Bank'].count++;
          cats['Food Coupons'].subCategories['Bank'].amount += bankPart;
        }
      } else {
        addIncome('Food Coupons', c.paymentMode || 'Cash', c.totalAmount);
      }
    });

    return Object.values(cats).map(cat => ({
      ...cat,
      subCategories: Object.values(cat.subCategories).sort((a, b) => b.amount - a.amount)
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredResidentsData, filteredDonations, filteredSouvenirs, filteredSponsorships, filteredCoupons]);

  const escapeHtml = (unsafe) => {
    return (unsafe || '').toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const sanitizeCsvCell = (value) => {
    let str = (value ?? '').toString();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    if (str.includes('"')) {
      str = str.replace(/"/g, '""');
    }
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      str = `"${str}"`;
    }
    return str;
  };

  const printReport = (title, contentId) => {
    const content = document.getElementById(contentId);
    if (!content) return;

    let reportType = 'REPORT';
    const tLower = title.toLowerCase();
    if (tLower.includes('block-wise') || tLower.includes('block wise')) reportType = 'BLK_SUB';
    else if (tLower.includes('subscription')) reportType = 'SUB';
    else if (tLower.includes('souvenir')) reportType = 'SOUV';
    else if (tLower.includes('donation')) reportType = 'DON';
    else if (tLower.includes('expense')) reportType = 'EXP';
    else if (tLower.includes('sponsorship')) reportType = 'SPO';
    else if (tLower.includes('food')) reportType = 'FOOD';
    else if (tLower.includes('income')) reportType = 'INC';
    else if (tLower.includes('payment')) reportType = 'PAY';

    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    const prefix = config?.societyName ? config.societyName.toUpperCase().replace(/\s+/g, '_') : 'SOCIETY';
    const docTitle = `${prefix}_DPC_${reportType}_${day}_${month}_${year}`;

    const html = `<html><head><title>${docTitle}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;padding:20px;color:${printTheme.text}}
      ${getPrintHeaderStyles()}
      .report-title{text-align:center; color:${brand.orangeDark}; font-size: 18px; margin: 15px 0; text-transform: uppercase; font-weight: bold; border-bottom: 2px solid ${brand.orangeDark}; padding-bottom: 8px;}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th{background:${printTheme.priceBg};padding:8px;border:1px solid ${printTheme.borderTable};font-size:12px;text-align:left}
      td{padding:6px 8px;border:1px solid ${printTheme.borderTable};font-size:12px}
      .summary{background:${printTheme.summaryBg};padding:12px;border-radius:8px;margin:12px 0}
      @media print{body{padding:10px}}
    </style></head><body>
    ${getPrintHeaderHTML(config)}
    <div class="report-title">${escapeHtml(title)}</div>
    ${content.innerHTML}
    ${getPrintFooterHTML(config)}
    </body></html>`;
    printHTML(html);
  };

  const exportCSV = (data, filename, headers) => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
    const yearStr = d.getFullYear();
    const baseName = (filename || 'export').replace('.csv', '').toUpperCase();
    const finalFilename = `${baseName}_${day}_${month}_${yearStr}.csv`;

    const csv = [
      headers.map(h => sanitizeCsvCell(h)).join(','),
      ...data.map(row => headers.map(h => sanitizeCsvCell(row[h])).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = finalFilename; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <SleekLoader message="Loading Reports..." />;

  return (
    <Box>
      {/* Grand Summary & Filters */}
      <Fade in timeout={400}>
        <Card sx={{ mb: 3, background: 'linear-gradient(135deg, rgba(255,143,0,0.05) 0%, rgba(206,147,216,0.03) 100%)', border: '1px solid rgba(255,143,0,0.15)', borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: '12px !important', sm: '16px !important' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                GRAND COLLECTION & EXPENSE SUMMARY
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 190 } }} slotProps={{ actionBar: { actions: ['clear', 'cancel', 'accept'] }, textField: { size: 'small' } }}
                />
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5, md: 2 }, overflowX: 'auto', pb: 0.5, justifyContent: { xs: 'flex-start', lg: 'space-between' }, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 }, mx: { xs: -0.5, sm: 0 } }}>
              {[
                { label: 'Subscriptions', value: fmt(fSubTotal), count: fSubCount, icon: <PeopleIcon />, color: statusBadge.info.text },
                { label: 'Donations', value: fmt(fDonTotal), count: fDonCount, icon: <DonationIcon />, color: statusBadge.donation.text },
                { label: 'Souvenirs', value: fmt(fSouvTotal), count: fSouvCount, icon: <SouvenirIcon />, color: statusBadge.souvenir.text },
                { label: 'Sponsors', value: fmt(fSponTotal), count: fSponCount, icon: <SponsorIcon />, color: statusBadge.expense.text },
                { label: 'Food Coupons', value: fmt(fCoupTotal), count: fCoupCount, icon: <FoodIcon />, color: brand.orange },
                { label: 'TOTAL IN', value: fmt(totalIncome), count: totalIncomeCount, icon: <RupeeIcon />, color: statusBadge.success.text },
                { label: 'EXPENSES', value: fmt(fExpTotal), count: fExpCount, icon: <RupeeIcon />, color: statusBadge.error.text },
                { label: 'CAM', value: fmt(fSponCam), icon: <SponsorIcon />, color: statusBadge.warning.text },
                { label: 'BALANCE', value: fmt(totalIncome - fExpTotal - fSponCam), icon: <WalletIcon />, color: (totalIncome - fExpTotal - fSponCam) >= 0 ? statusBadge.teal.text : statusBadge.error.text },
              ].map((item, idx) => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, md: 1.5 }, minWidth: 'max-content', pr: { xs: 1, md: 2 }, borderRight: idx < 7 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center', width: { xs: 28, md: 40 }, height: { xs: 28, md: 40 }, borderRadius: '50%', backgroundColor: `${item.color}15`, flexShrink: 0 }}>
                    {React.cloneElement(item.icon, { sx: { color: item.color, fontSize: { xs: 16, md: 22 } } })}
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' }, lineHeight: 1, whiteSpace: 'nowrap' }}>
                      {item.label} {item.count !== undefined && <span style={{ opacity: 0.7 }}>({item.count})</span>}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: item.color, lineHeight: 1.2, mt: 0.3, fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' } }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Fade>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }} variant="scrollable" scrollButtons="auto">
        <Tab label="Subscription" />
        <Tab label="Donation" />
        <Tab label="Souvenir" />
        <Tab label="Sponsorship" />
        <Tab label="Food Coupon" />
        <Tab label="Expense Sub-Category" />
        <Tab label="Income Sub-Category" />
        <Tab label="Payment Mode" />
        <Tab label="Block-wise Subscriptions" />
      </Tabs>

      {/* Dynamic Tab Rendering */}
      {activeTab === 0 && <PaidSubscriptionsReportTab filteredPaidResidents={filteredPaidResidents} filterBlock={filterBlock} setFilterBlock={setFilterBlock} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 1 && <DonationReportTab filteredDonations={filteredDonations} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 2 && <SouvenirReportTab filteredSouvenirs={filteredSouvenirs} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 3 && <SponsorshipReportTab filteredSponsorships={filteredSponsorships} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 4 && <FoodCouponReportTab dayCouponSummary={dayCouponSummary} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 5 && <ExpenseSubCategoryReportTab filteredExpenses={filteredExpenses} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 6 && <IncomeSubCategoryReportTab incomeSubCategorySummary={incomeSubCategorySummary} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 7 && <PaymentModeReportTab paymentModeSummary={paymentModeSummary} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
      {activeTab === 8 && <BlockSubscriptionReportTab blockSummary={blockSummary} config={config} fmt={fmt} printReport={printReport} exportCSV={exportCSV} />}
    </Box>
  );
};

export default Reports;
