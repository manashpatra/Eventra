import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, Tab, CircularProgress, IconButton } from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Assessment as HistoryIcon,
  Dashboard as DashboardIcon,
  FilterList as FilterListIcon,
  Fastfood as FastfoodIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Timeline as TimelineIcon,
  CardGiftcard as FocIcon,
} from '@mui/icons-material';
import { getAllResidents } from '../../services/residentService';
import { getAllFoodCoupons } from '../../services/foodCouponService';
import { getMasterConfig } from '../../services/masterConfigService';
import { useAuth } from '../../contexts/AuthContext';
import SellCounterTab from './FoodCouponTabs/SellCounterTab';
import SalesHistoryTab from './FoodCouponTabs/SalesHistoryTab';
import FoodDashboardTab from './FoodCouponTabs/FoodDashboardTab';
import OnlineCouponDashboardTab from './FoodCouponTabs/OnlineCouponDashboardTab';
import OnlineRedemptionDashboardTab from './FoodCouponTabs/OnlineRedemptionDashboardTab';
import FocCouponsTab from './FoodCouponTabs/FocCouponsTab';

const TAB_ROUTES = ['/food-coupons', '/food-coupons/history', '/food-coupons/dashboard', '/food-coupons/foc', '/food-coupons/online-dashboard', '/food-coupons/redemptions'];

const FoodCoupons = () => {
  const { user } = useAuth();
  const isAuditor = user?.role === 'Auditor';
  const isFoodSeller = user?.role === 'Food Seller';
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from URL
  const activeTab = location.pathname === '/food-coupons/history' ? 1
    : location.pathname === '/food-coupons/dashboard' ? 2
    : location.pathname === '/food-coupons/foc' ? 3
    : location.pathname === '/food-coupons/online-dashboard' ? 4
    : location.pathname === '/food-coupons/redemptions' ? 5
    : 0;

  useEffect(() => {
    if (isFoodSeller && activeTab !== 5) {
      navigate('/food-coupons/redemptions', { replace: true });
    } else if (isAuditor && activeTab === 0) {
      navigate('/food-coupons/dashboard', { replace: true });
    }
  }, [isAuditor, isFoodSeller, activeTab, navigate]);

  // Shared state — counter data
  const [residents, setResidents] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shared state — history / dashboard data (lazy loaded)
  const [coupons, setCoupons] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showDashboardFilters, setShowDashboardFilters] = useState(false);

  useEffect(() => {
    loadCounterData();
  }, []);

  // Trigger lazy data load for History, Dashboard, and FOC tabs on direct navigation
  useEffect(() => {
    if ((activeTab === 1 || activeTab === 2 || activeTab === 3 || activeTab === 4) && !historyLoaded && !historyLoading) {
      loadHistoryData();
    }
  }, [activeTab, historyLoaded, historyLoading]);

  // Load counter essentials (residents + config) — zero coupon reads
  const loadCounterData = async () => {
    try {
      setLoading(true);
      const [residentData, configData] = await Promise.all([
        getAllResidents(),
        getMasterConfig(),
      ]);
      setResidents(residentData);
      setConfig(configData);
    } catch (error) {
      console.error('Error loading counter data:', error);
    } finally {
      setLoading(false);
    }
  };

// Lazy load all coupons — called only when History or Dashboard tab is viewed
  const loadHistoryData = async () => {
    try {
      setHistoryLoading(true);
      const couponData = await getAllFoodCoupons();
      setCoupons(couponData);
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Error loading coupon history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    navigate(TAB_ROUTES[newValue]);
    // Trigger lazy data load for History, Dashboard, and FOC tabs
    if ((newValue === 1 || newValue === 2 || newValue === 3) && !historyLoaded) {
      loadHistoryData();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1.5 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40 } }}
        >
          {!isAuditor && !isFoodSeller && (
            <Tab
              value={0}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<FastfoodIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label="Sell"
            />
          )}
          {!isFoodSeller && (
            <Tab
              value={1}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<HistoryIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label="History"
            />
          )}
          {!isFoodSeller && (
            <Tab
              value={2}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<DashboardIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  Dashboard
                  {activeTab === 2 && (
                    <IconButton
                      component="div"
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setShowDashboardFilters(true); }}
                      sx={{ ml: 0.5, p: 0.2, '&:hover': { bgcolor: 'action.selected' } }}
                    >
                      <FilterListIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              }
            />
          )}
          {!isFoodSeller && (
            <Tab
              value={3}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<FocIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label="FOC Issued"
            />
          )}
          {config?.onlineFoodCouponEnabled && !isFoodSeller && (
            <Tab
              value={4}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<PhoneAndroidIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label="Online Dashboard"
            />
          )}
          {config?.onlineFoodCouponEnabled && (
            <Tab
              value={5}
              sx={{ minHeight: 40, py: 0.5, px: { xs: 1, sm: 2 }, textTransform: 'none', fontWeight: 600, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}
              icon={<TimelineIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />}
              iconPosition="start"
              label="Online Redemptions"
            />
          )}
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && !isAuditor && !isFoodSeller && (
        <SellCounterTab
          residents={residents}
          config={config}
          coupons={coupons}
          historyLoaded={historyLoaded}
          loadCounterData={loadCounterData}
          loadHistoryData={loadHistoryData}
        />
      )}

      {activeTab === 1 && !isFoodSeller && (
        <SalesHistoryTab
          coupons={coupons}
          config={config}
          historyLoading={historyLoading}
          loadHistoryData={loadHistoryData}
          isAuditor={isAuditor}
        />
      )}

      {activeTab === 2 && !isFoodSeller && (
        <FoodDashboardTab
          coupons={coupons}
          config={config}
          historyLoading={historyLoading}
          loadHistoryData={loadHistoryData}
          historyLoaded={historyLoaded}
          showFilters={showDashboardFilters}
          setShowFilters={setShowDashboardFilters}
        />
      )}

      {activeTab === 3 && !isFoodSeller && (
        <FocCouponsTab
          coupons={coupons}
          config={config}
          historyLoading={historyLoading}
          loadHistoryData={loadHistoryData}
          isAuditor={isAuditor}
        />
      )}

      {activeTab === 4 && config?.onlineFoodCouponEnabled && !isFoodSeller && (
        <OnlineCouponDashboardTab
          config={config}
        />
      )}

      {activeTab === 5 && config?.onlineFoodCouponEnabled && (
        <OnlineRedemptionDashboardTab
          config={config}
        />
      )}
    </Box>
  );
};

export default FoodCoupons;
