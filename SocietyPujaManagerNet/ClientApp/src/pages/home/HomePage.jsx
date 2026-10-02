import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { brand } from '../../theme/colorTokens';
import FlatSelectionDialog, { getSelectedFlat } from '../../components/FlatSelectionDialog';
import BannerSlot from '../../components/BannerSlot';
import ErrorBoundary from '../../components/ErrorBoundary';

// Lazy load all sections for code splitting
const HeroSection = lazy(() => import('./HeroSection'));
const MyFoodSection = lazy(() => import('./MyFoodSection'));
const NoticesSection = lazy(() => import('./NoticesSection'));
const DPCSection = lazy(() => import('./DPCSection'));
const SocietySection = lazy(() => import('./SocietySection'));
const FeedbackSection = lazy(() => import('./FeedbackSection'));
const SubscriptionReportSection = lazy(() => import('./SubscriptionReportSection'));
const CulturalSection = lazy(() => import('./CulturalSection'));

const SectionLoader = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
    <CircularProgress sx={{ color: brand.orange }} />
  </Box>
);

const HomePage = ({ activeTab, onTabChange }) => {
  const [flatDialogOpen, setFlatDialogOpen] = useState(false);
  const [flatRefreshKey, setFlatRefreshKey] = useState(0);

  const handleSelectFlat = useCallback(() => {
    setFlatDialogOpen(true);
  }, []);

  const handleFlatSelected = useCallback((flat) => {
    window.dispatchEvent(new Event('flatSelectionChanged'));
  }, []);

  useEffect(() => {
    const handleFlatChange = () => {
      const flat = getSelectedFlat();
      if (flat) {
        setFlatDialogOpen(false);
      }
      setFlatRefreshKey((prev) => prev + 1);
    };

    window.addEventListener('flatSelectionChanged', handleFlatChange);
    return () => {
      window.removeEventListener('flatSelectionChanged', handleFlatChange);
    };
  }, []);

  const renderSection = () => {
    switch (activeTab) {
      case 0:
        return (
          <Suspense fallback={<SectionLoader />}>
            <HeroSection onSelectFlat={handleSelectFlat} onNavigateTab={onTabChange} />
          </Suspense>
        );
      case 1:
        return (
          <Suspense fallback={<SectionLoader />}>
            <MyFoodSection />
          </Suspense>
        );
      case 2:
        return (
          <Suspense fallback={<SectionLoader />}>
            <NoticesSection />
          </Suspense>
        );
      case 3:
        return (
          <Suspense fallback={<SectionLoader />}>
            <CulturalSection />
          </Suspense>
        );
      case 4:
        return (
          <Suspense fallback={<SectionLoader />}>
            <DPCSection />
          </Suspense>
        );
      case 5:
        return (
          <Suspense fallback={<SectionLoader />}>
            <SocietySection />
          </Suspense>
        );
      case 6:
        return (
          <Suspense fallback={<SectionLoader />}>
            <FeedbackSection />
          </Suspense>
        );
      case 7:
        return (
          <Suspense fallback={<SectionLoader />}>
            <SubscriptionReportSection />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <ErrorBoundary>
        {renderSection()}
      </ErrorBoundary>

      {/* Banner Ad — Between Sections */}
      <BannerSlot slot="between-sections" />

      <FlatSelectionDialog
        open={flatDialogOpen}
        onClose={() => setFlatDialogOpen(false)}
        onSelect={handleFlatSelected}
        allowClose={true}
      />
    </Box>
  );
};

export default HomePage;
