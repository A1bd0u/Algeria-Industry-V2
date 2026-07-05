import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'motion/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import BackToTop from './components/BackToTop';
import Footer from './components/Footer';
import HelpWidget from './components/HelpWidget';
import HeroSlider from './components/HeroSlider';
import Navbar from './components/Navbar';
import PageTransition from './components/PageTransition';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import { DEFAULT_SLIDES, SLIDES_BY_PATH } from './constants/slides';
import BecomeExhibitor from './pages/BecomeExhibitor';
import AdsRequest from './pages/AdsRequest';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import CompanyProfile from './pages/CompanyProfile';
import Compare from './pages/Compare';
import ConsolePro from './pages/ConsolePro';
import AdminKYCReview from './pages/AdminKYCReview';
import AdminContentModeration from './pages/AdminContentModeration';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import Events from './pages/Events';
import Exhibitors from './pages/Exhibitors';
import FAQ from './pages/FAQ';
import Home from './pages/Home';
import KYCUpload from './pages/KYCUpload';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Privacy from './pages/Privacy';
import ProductDetail from './pages/ProductDetail';
import Products from './pages/Products';
import Favorites from './pages/Favorites';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import Resources from './pages/Resources';
import SearchResults from './pages/SearchResults';
import Subscriptions from './pages/Subscriptions';
import Tarifs from './pages/Tarifs';
import Terms from './pages/Terms';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ComparisonBar from './components/ComparisonBar';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { TrackingProvider } from './context/TrackingContext';
import VerifyAccountModal from './components/VerifyAccountModal';

// Create a client for React Query (API data management)
const queryClient = new QueryClient();

// Placeholder components for other pages




export default function App() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const currentSlides = SLIDES_BY_PATH[location.pathname] || DEFAULT_SLIDES;
  const isExtranet = location.pathname.startsWith('/extranet');
  const hideHeroSlider = isExtranet || location.pathname === '/become-exhibitor';

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TrackingProvider>
          <CurrencyProvider>
            <ComparisonProvider>
              <VerifyAccountModal />
              <ScrollToTop />
              <div className="flex flex-col min-h-screen">
              {!isExtranet && <Navbar />}
              {!hideHeroSlider && <HeroSlider slides={currentSlides} />}
              <main className="flex-grow">
                <AnimatePresence mode="wait">
                  {/* @ts-ignore - framer-motion requires key on Routes */}
                  <Routes location={location} key={location.pathname}>
                      <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                      <Route path="/directory" element={<PageTransition><Directory /></PageTransition>} />
                      <Route path="/directory/:id" element={<PageTransition><CompanyProfile /></PageTransition>} />
                      <Route path="/products" element={<PageTransition><Products /></PageTransition>} />
                      <Route path="/favorites" element={<PageTransition><Favorites /></PageTransition>} />
                      <Route path="/products/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
                      <Route path="/exhibitors" element={<PageTransition><Exhibitors /></PageTransition>} />
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
                      <Route path="/subscriptions" element={<PageTransition><Subscriptions /></PageTransition>} />
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
                      <Route path="/extranet/moderation" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminContentModeration />
                        </ProtectedRoute>
                      } />
                      <Route path="/become-exhibitor" element={<PageTransition><BecomeExhibitor /></PageTransition>} />
                      <Route path="/ads-request" element={<PageTransition><AdsRequest /></PageTransition>} />
                      <Route path="/resources" element={<PageTransition><Resources /></PageTransition>} />
                      <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
                      <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                      <Route path="/compare" element={<PageTransition><Compare /></PageTransition>} />
                      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                    </Routes>
                  </AnimatePresence>
                </main>
                {!isExtranet && <Footer />}
                <HelpWidget />
                <BackToTop />
                {!isExtranet && <ComparisonBar />}
              </div>
            </ComparisonProvider>
          </CurrencyProvider>
        </TrackingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
