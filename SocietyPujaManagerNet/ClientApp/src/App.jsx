import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProcessingProvider } from './contexts/ProcessingContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/admin/Login';
import SleekLoader from './components/SleekLoader';
import FlatRedirector from './components/FlatRedirector';
import { getMasterConfig } from './services/masterConfigService';
import UpdatePrompt from './components/UpdatePrompt';

import ErrorBoundary from './components/ErrorBoundary';

// Lazy load layouts and pages for code splitting
const HomeLayout = lazy(() => import('./layouts/HomeLayout'));
const HomePage = lazy(() => import('./pages/home/HomePage'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Subscriptions = lazy(() => import('./pages/admin/Subscriptions'));
const FoodCoupons = lazy(() => import('./pages/admin/FoodCoupons'));
const Donations = lazy(() => import('./pages/admin/Donations'));
const Souvenirs = lazy(() => import('./pages/admin/Souvenirs'));
const Sponsorships = lazy(() => import('./pages/admin/Sponsorships'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const MasterSettings = lazy(() => import('./pages/admin/MasterSettings'));
const PublishNotices = lazy(() => import('./pages/admin/PublishNotices'));
const Expenses = lazy(() => import('./pages/admin/Expenses'));
const Scanner = lazy(() => import('./pages/admin/Scanner'));
const AdminFeedback = lazy(() => import('./pages/admin/AdminFeedback'));
const TestPage = lazy(() => import('./pages/admin/TestPage'));
const AuditReport = lazy(() => import('./pages/admin/AuditReport'));
const CulturalPrograms = lazy(() => import('./pages/admin/Cultural/CulturalPrograms'));
const AccessDenied = lazy(() => import('./pages/admin/AccessDenied'));
const BannerAds = lazy(() => import('./pages/admin/BannerAds'));
const VendorManagement = lazy(() => import('./pages/admin/VendorManagement'));
const Leads = lazy(() => import('./pages/admin/Leads'));
const CashInHand = lazy(() => import('./pages/admin/CashInHand'));
const Withdraw = lazy(() => import('./pages/admin/Withdraw'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SleekLoader message="Checking authentication..." minHeight="100vh" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Role based route wrapper
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <SleekLoader message="Verifying permissions..." minHeight="100vh" />;
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Public route - redirect to dashboard if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SleekLoader message="Loading..." minHeight="100vh" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirect based on where PWA was installed from
const PwaStartRedirector = () => {
  const startPath = localStorage.getItem('pwa_installed_start_path') || '/home';
  return <Navigate to={startPath} replace />;
};

const AppRoutes = () => (
  <Routes>
    {/* Public Home Page - no auth required */}
    <Route path="/" element={<Suspense fallback={<SleekLoader message="Loading..." minHeight="100vh" />}><HomeLayout /></Suspense>}>
      <Route index element={<Navigate to="/home" replace />} />
      <Route path="home" element={<HomePage activeTab={0} />} />
      <Route path="home/:flatId" element={<FlatRedirector />} />
      <Route path="my-food" element={<HomePage activeTab={1} />} />
      <Route path="my-food/:flatId" element={<FlatRedirector />} />
      <Route path="myfood" element={<Navigate to="/my-food" replace />} />
      <Route path="myfood/:flatId" element={<FlatRedirector />} />
      <Route path="notices" element={<HomePage activeTab={2} />} />
      <Route path="notices/:notificationId" element={<HomePage activeTab={2} />} />
      <Route path="notifications" element={<Navigate to="/notices" replace />} />
      <Route path="notifications/*" element={<Navigate to="/notices" replace />} />
      <Route path="cultural" element={<HomePage activeTab={3} />} />
      <Route path="cultural/:eventId" element={<HomePage activeTab={3} />} />
      <Route path="events" element={<Navigate to="/cultural" replace />} />
      <Route path="events/:eventId" element={<Navigate to="/cultural" replace />} />
      <Route path="my-flat" element={<Navigate to="/home" replace />} />
      <Route path="my-flat/:flatId" element={<FlatRedirector />} />
      <Route path="myflat/:flatId" element={<FlatRedirector />} />
      <Route path="dpc" element={<HomePage activeTab={4} />} />
      <Route path="society" element={<HomePage activeTab={5} />} />
      <Route path="feedback" element={<HomePage activeTab={6} />} />
      <Route path="reports" element={<HomePage activeTab={7} />} />
    </Route>
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/access-denied" element={<Suspense fallback={<SleekLoader message="Loading..." minHeight="100vh" />}><AccessDenied /></Suspense>} />
    <Route path="/pwa-start" element={<PwaStartRedirector />} />
    <Route
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/subscriptions" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Subscriptions /></RoleRoute>} />
      <Route path="/food-coupons" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Food Seller']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/drafts" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/history" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/dashboard" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/foc" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/online-dashboard" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor']}><FoodCoupons /></RoleRoute>} />
      <Route path="/food-coupons/redemptions" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Food Seller']}><FoodCoupons /></RoleRoute>} />
      <Route path="/scanner" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Food Seller']}><Scanner /></RoleRoute>} />
      <Route path="/donations" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Donations /></RoleRoute>} />
      <Route path="/souvenirs" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Souvenirs /></RoleRoute>} />
      <Route path="/sponsorships" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'Collection', 'FoodCoupon']}><Sponsorships /></RoleRoute>} />
      <Route path="/expenses" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Expenses /></RoleRoute>} />
      <Route path="/withdrawals" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Withdraw /></RoleRoute>} />
      <Route path="/cheque-transactions" element={<Navigate to="/withdrawals" replace />} />
      <Route path="/admin-reports" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Reports /></RoleRoute>} />
      <Route path="/admin-reports/:tab" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'Auditor', 'FoodCoupon']}><Reports /></RoleRoute>} />
      <Route path="/feedback-inbox" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Auditor', 'Standard', 'Cultural']}><AdminFeedback /></RoleRoute>} />
      <Route path="/publish-notices" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer', 'FoodCoupon', 'Standard']}><PublishNotices /></RoleRoute>} />
      <Route path="/settings" element={<RoleRoute allowedRoles={['Super Admin']}><MasterSettings /></RoleRoute>} />
      <Route path="/audit-trail" element={<RoleRoute allowedRoles={['Super Admin']}><AuditReport /></RoleRoute>} />
      <Route path="/manage-events" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Cultural']}><CulturalPrograms /></RoleRoute>} />
      <Route path="/manage-events/dashboard" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Cultural']}><CulturalPrograms /></RoleRoute>} />
      <Route path="/manage-events/add" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Cultural']}><CulturalPrograms /></RoleRoute>} />
      <Route path="/cultural-programs" element={<Navigate to="/manage-events" replace />} />
      <Route path="/cultural-programs/*" element={<Navigate to="/manage-events" replace />} />
      <Route path="/cultural/dashboard" element={<Navigate to="/manage-events/dashboard" replace />} />
      <Route path="/test" element={<RoleRoute allowedRoles={['Super Admin']}><TestPage /></RoleRoute>} />
      <Route path="/banner-ads" element={<RoleRoute allowedRoles={['Super Admin']}><BannerAds /></RoleRoute>} />
      <Route path="/vendors" element={<VendorManagement />} />
      <Route path="/leads" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Collection', 'Treasurer']}><Leads /></RoleRoute>} />
      <Route path="/cash-in-hand" element={<RoleRoute allowedRoles={['Super Admin', 'Admin', 'Treasurer']}><CashInHand /></RoleRoute>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => {
  React.useEffect(() => {
    const handleAppInstalled = () => {
      const path = window.location.hash.includes('/dashboard') || window.location.hash.includes('/login') 
        ? '/dashboard' 
        : '/home';
      localStorage.setItem('pwa_installed_start_path', path);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    const fetchConfig = async () => {
      try {
        const config = await getMasterConfig();
        if (config) {
          const societyName = config.societyName || 'Society';
          const year = config.year || new Date().getFullYear();
          document.title = `${societyName.toUpperCase()} | DPC ${year}`;
        }
      } catch (error) {
        console.error('Failed to set document title:', error);
      }
    };
    fetchConfig();

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <ThemeModeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <ProcessingProvider>
              <HashRouter>
                <UpdatePrompt />
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </HashRouter>
            </ProcessingProvider>
          </AuthProvider>
        </LocalizationProvider>
      </SnackbarProvider>
    </ThemeModeProvider>
  );
};

export default App;
