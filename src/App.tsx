import { useEffect, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import HelpWidget from './components/HelpWidget';
import HeroSlider from './components/HeroSlider';
import { AdTargetingProvider } from './context/AdTargetingContext';
import { adPlacementForPath } from './data/adPlacements';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
const BecomeExhibitor = lazy(() => import('./pages/BecomeExhibitor'));
const AdsRequest = lazy(() => import('./pages/AdsRequest'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const CompanyProfile = lazy(() => import('./pages/CompanyProfile'));
const Compare = lazy(() => import('./pages/Compare'));
const ConsolePro = lazy(() => import('./pages/ConsolePro'));
const AdminKYCReview = lazy(() => import('./pages/AdminKYCReview'));
const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Directory = lazy(() => import('./pages/Directory'));
const Events = lazy(() => import('./pages/Events'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Home = lazy(() => import('./pages/Home'));
const KYCUpload = lazy(() => import('./pages/KYCUpload'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Products = lazy(() => import('./pages/Products'));
const Favorites = lazy(() => import('./pages/Favorites'));
const Register = lazy(() => import('./pages/Register'));
const RegisterSuccess = lazy(() => import('./pages/RegisterSuccess'));
const Resources = lazy(() => import('./pages/Resources'));
const Developers = lazy(() => import('./pages/Developers'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const Tarifs = lazy(() => import('./pages/Tarifs'));
const Terms = lazy(() => import('./pages/Terms'));
const Cgv = lazy(() => import('./pages/Cgv'));
const Catalogues = lazy(() => import('./pages/Catalogues'));
const Sector = lazy(() => import('./pages/Sector'));

import { useTranslation } from 'react-i18next';
import { cn } from './lib/utils';
import ComparisonBar from './components/ComparisonBar';
import MobileTabBar from './components/MobileTabBar';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { ToastProvider } from './context/ToastContext';
import VerifyAccountModal from './components/VerifyAccountModal';
import CookieBanner from './components/CookieBanner';
import { Navigate } from 'react-router-dom';

// Create a client for React Query (API data management)
const queryClient = new QueryClient();

// Placeholder components for other pages




export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const isExtranet = location.pathname.startsWith('/extranet');
  // Bandeau publicitaire : grand sur l'accueil, compact sur les pages du
  // catalogue, des fournisseurs et des contenus ; absent ailleurs.
  const adPlacement = isExtranet ? null : adPlacementForPath(location.pathname);

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      
      if (lng === 'ar') {
        document.body.classList.add('font-arabic');
      } else {
        document.body.classList.remove('font-arabic');
      }
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    // Initial call
    handleLanguageChange(i18n.language);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <HelmetProvider>
      <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <MotionConfig reducedMotion="user">
      <AuthProvider>
          <CurrencyProvider>
            <ComparisonProvider>
            <AdTargetingProvider>
              <VerifyAccountModal />
              <ScrollToTop />
              <div className={cn("flex flex-col min-h-screen", !isExtranet && "pb-16 lg:pb-0")}>
              {!isExtranet && <Navbar />}
              {adPlacement && <HeroSlider placement={adPlacement} />}
              <main className="flex-grow min-h-screen">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
                  <AnimatePresence mode="wait">
                    {/* @ts-ignore - framer-motion requires key on Routes */}
                    <Routes location={location} key={location.pathname}>
                      <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                      <Route path="/directory" element={<PageTransition><Directory /></PageTransition>} />
                      <Route path="/directory/:id" element={<PageTransition><CompanyProfile /></PageTransition>} />
                      <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
                      <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
                      <Route path="/products/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
                      {/* Ancienne page Exposants : l'annuaire unique est /directory. */}
                      <Route path="/exhibitors" element={<Navigate to="/directory" replace />} />
                      <Route path="/search" element={<PageTransition><SearchResults /></PageTransition>} />
                      <Route path="/dashboard/*" element={
                        <ProtectedRoute>
                          <PageTransition>
                            <Dashboard />
                          </PageTransition>
                        </ProtectedRoute>
                      } />
                      <Route path="/kyc-upload" element={
                        <ProtectedRoute>
                          <PageTransition>
                            <KYCUpload />
                          </PageTransition>
                        </ProtectedRoute>
                      } />
                      <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                      <Route path="/forgot-password" element={<PageTransition><ForgotPassword /></PageTransition>} />
                      <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
                      <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                      <Route path="/register-success" element={<PageTransition><RegisterSuccess /></PageTransition>} />
                      {/* Ancienne page de démonstration : l'abonnement se gère dans le tableau de bord. */}
                      <Route path="/subscriptions" element={<Navigate to="/dashboard?tab=subscription" replace />} />
                      <Route path="/tarifs" element={<PageTransition><Tarifs /></PageTransition>} />
                      <Route path="/contact" element={<PageTransition><Contact /></PageTransition>} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:id" element={<PageTransition><BlogDetail /></PageTransition>} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/extranet" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ConsolePro />
                        </ProtectedRoute>
                      } />
                      <Route path="/extranet/kyc/:id" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminKYCReview />
                        </ProtectedRoute>
                      } />
                      {/* Ancienne page de modération : tout se fait dans la console. */}
                      <Route path="/extranet/moderation" element={<Navigate to="/extranet" replace />} />
                      <Route path="/become-exhibitor" element={<PageTransition><BecomeExhibitor /></PageTransition>} />
                      <Route path="/ads-request" element={<PageTransition><AdsRequest /></PageTransition>} />
                      <Route path="/resources" element={<PageTransition><Resources /></PageTransition>} />
                      <Route path="/developers" element={<PageTransition><Developers /></PageTransition>} />
                      <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                      <Route path="/cgv" element={<PageTransition><Cgv /></PageTransition>} />
                      <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                      <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
                      <Route path="/catalogues" element={<PageTransition><Catalogues /></PageTransition>} />
                      <Route path="/secteurs/:slug" element={<PageTransition><Sector /></PageTransition>} />
                      <Route path="/messages" element={<Navigate to="/dashboard?tab=messages" replace />} />
                      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                    </Routes>
                  </AnimatePresence>
                </Suspense>
              </main>
                {!isExtranet && <Footer />}
                {!isExtranet && <HelpWidget />}
                <CookieBanner />
                <BackToTop />
                {!isExtranet && <ComparisonBar />}
                {!isExtranet && <MobileTabBar />}
              </div>
            </AdTargetingProvider>
            </ComparisonProvider>
          </CurrencyProvider>
      </AuthProvider>
      </MotionConfig>
      </ToastProvider>
    </QueryClientProvider>
    </ErrorBoundary>
    </HelmetProvider>
  );
}
